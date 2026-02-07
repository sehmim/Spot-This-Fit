"""
Batch-build FashionCLIP embeddings for shoe products and upsert to Pinecone.

Reads the filtered shoes CSV, generates 512-dim embeddings via the local
CLIP service, and upserts vectors with product metadata to a Pinecone index.

Usage:
    python build_pinecone_shoes.py

Environment variables:
    PINECONE_API_KEY    Pinecone API key (required)
    PINECONE_INDEX_NAME Index name (default: shoes-clip)
    CLIP_SERVICE_URL    URL of the clip service (default: http://localhost:5111)
    BATCH_SIZE          Products per CLIP batch (default: 50)
    START_OFFSET        Resume from this row offset (default: 0)
    CSV_PATH            Path to filtered shoes CSV
                        (default: ../backend/data/awin-data-wearables-20k.csv)
"""

import csv
import os
import sys
import time

import requests
from pinecone import Pinecone, ServerlessSpec

# --------------- Config ---------------

PINECONE_API_KEY = os.environ.get("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.environ.get("PINECONE_INDEX_NAME", "shoes-clip")
CLIP_SERVICE_URL = os.environ.get("CLIP_SERVICE_URL", "http://localhost:5111")
BATCH_SIZE = int(os.environ.get("BATCH_SIZE", "50"))
START_OFFSET = int(os.environ.get("START_OFFSET", "0"))
CSV_PATH = os.environ.get(
    "CSV_PATH",
    os.path.join(os.path.dirname(__file__), "..", "backend", "data", "awin-data-wearables-20k.csv"),
)

EMBEDDING_DIM = 512
PINECONE_UPSERT_BATCH = 100  # max vectors per Pinecone upsert call


# --------------- Helpers ---------------


def ensure_pinecone_index(pc: Pinecone) -> None:
    """Create the Pinecone index if it doesn't exist."""
    existing = [idx.name for idx in pc.list_indexes()]
    if PINECONE_INDEX_NAME in existing:
        print(f"[pinecone] Index '{PINECONE_INDEX_NAME}' already exists.")
        return

    print(f"[pinecone] Creating index '{PINECONE_INDEX_NAME}' (dim={EMBEDDING_DIM}, cosine)...")
    pc.create_index(
        name=PINECONE_INDEX_NAME,
        dimension=EMBEDDING_DIM,
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region="us-east-1"),
    )
    # Wait for it to be ready
    while not pc.describe_index(PINECONE_INDEX_NAME).status.get("ready"):
        print("[pinecone] Waiting for index to be ready...")
        time.sleep(2)
    print(f"[pinecone] Index ready.")


def pick_image_url(row: dict) -> str | None:
    """Pick the best available image URL from the CSV row."""
    img = (row.get("image_link") or "").strip()
    if img and len(img) > 10:
        return img
    alt = (row.get("additional_image_link") or "").strip()
    if alt and len(alt) > 10:
        return alt
    return None


def embed_batch_via_service(urls: list[str]) -> list[list[float]]:
    """Call the CLIP service /embed/batch endpoint."""
    resp = requests.post(
        f"{CLIP_SERVICE_URL}/embed/batch",
        json={"urls": urls},
        timeout=120,
    )
    resp.raise_for_status()
    data = resp.json()
    return data["embeddings"]


def truncate_str(s: str, max_len: int = 400) -> str:
    """Truncate string to fit Pinecone metadata limits."""
    if not s:
        return ""
    return s[:max_len]


def build_metadata(row: dict) -> dict:
    """Build Pinecone metadata from a CSV row."""
    return {
        "title": truncate_str(row.get("title", "")),
        "link": truncate_str(row.get("link", ""), 500),
        "image_link": truncate_str(row.get("image_link", ""), 500),
        "price": truncate_str(row.get("price", "")),
        "sale_price": truncate_str(row.get("sale_price", "")),
        "gender": truncate_str(row.get("gender", ""), 50),
        "availability": truncate_str(row.get("availability", ""), 50),
        "category": truncate_str(row.get("google_product_category", ""), 200),
    }


# --------------- Main ---------------


def main():
    if not PINECONE_API_KEY:
        print("[build] ERROR: PINECONE_API_KEY not set", file=sys.stderr)
        sys.exit(1)

    # Check CLIP service health
    try:
        health = requests.get(f"{CLIP_SERVICE_URL}/health", timeout=5).json()
        print(f"[build] CLIP service: {health}")
    except Exception as e:
        print(f"[build] ERROR: Cannot reach CLIP service at {CLIP_SERVICE_URL}: {e}")
        sys.exit(1)

    # Init Pinecone
    pc = Pinecone(api_key=PINECONE_API_KEY)
    ensure_pinecone_index(pc)
    index = pc.Index(PINECONE_INDEX_NAME)

    # Read CSV
    print(f"[build] Reading CSV: {CSV_PATH}")
    with open(CSV_PATH, "r") as f:
        reader = csv.DictReader(f)
        all_rows = list(reader)

    total = len(all_rows)
    print(f"[build] Total products: {total}, batch size: {BATCH_SIZE}, start offset: {START_OFFSET}")

    processed = 0
    skipped = 0
    failed = 0
    start_time = time.time()
    pinecone_buffer: list[dict] = []  # accumulate vectors for batch upsert

    offset = START_OFFSET
    while offset < total:
        batch_rows = all_rows[offset : offset + BATCH_SIZE]
        if not batch_rows:
            break

        # Build (id, url, metadata) tuples for rows with valid images
        batch_items: list[tuple[str, str, dict]] = []
        for row in batch_rows:
            url = pick_image_url(row)
            if not url:
                skipped += 1
                continue
            product_id = str(row.get("id", "")).strip()
            if not product_id:
                skipped += 1
                continue
            batch_items.append((product_id, url, build_metadata(row)))

        if batch_items:
            urls = [item[1] for item in batch_items]
            try:
                embeddings = embed_batch_via_service(urls)

                for (product_id, _, metadata), embedding in zip(batch_items, embeddings):
                    if not embedding:
                        failed += 1
                        continue
                    pinecone_buffer.append({
                        "id": product_id,
                        "values": embedding,
                        "metadata": metadata,
                    })
                    processed += 1

                # Flush to Pinecone when buffer is large enough
                while len(pinecone_buffer) >= PINECONE_UPSERT_BATCH:
                    batch_to_upsert = pinecone_buffer[:PINECONE_UPSERT_BATCH]
                    pinecone_buffer = pinecone_buffer[PINECONE_UPSERT_BATCH:]
                    index.upsert(vectors=batch_to_upsert)

            except Exception as e:
                print(f"[build] Batch error at offset {offset}: {e}")
                failed += len(batch_items)

        offset += len(batch_rows)
        elapsed = time.time() - start_time
        rate = processed / elapsed if elapsed > 0 else 0
        print(
            f"[build] Progress: {min(offset, total)}/{total} "
            f"(embedded: {processed}, skipped: {skipped}, failed: {failed}, "
            f"rate: {rate:.1f}/s)"
        )

    # Flush remaining vectors
    if pinecone_buffer:
        index.upsert(vectors=pinecone_buffer)
        print(f"[build] Flushed final {len(pinecone_buffer)} vectors to Pinecone.")

    elapsed = time.time() - start_time
    print(
        f"[build] Done in {elapsed:.0f}s. "
        f"Embedded: {processed}, skipped: {skipped}, failed: {failed}"
    )

    # Print index stats
    stats = index.describe_index_stats()
    print(f"[build] Pinecone index stats: {stats}")


if __name__ == "__main__":
    main()

"""
Batch-build image embeddings for all products in the awin_products table.

Fetches product image URLs from PostgreSQL, generates 512-dim FashionCLIP
embeddings, and upserts them into the awin_image_embeddings table.

Usage:
    python build_embeddings.py

Environment variables:
    DATABASE_URL        PostgreSQL connection string (required)
    BATCH_SIZE          Products per batch (default: 50)
    START_OFFSET        Resume from this offset (default: 0)
    CLIP_SERVICE_URL    URL of the clip service (default: http://localhost:5111)
"""

import os
import sys
import time

import requests

DATABASE_URL = os.environ.get("DATABASE_URL")
BATCH_SIZE = int(os.environ.get("BATCH_SIZE", "50"))
START_OFFSET = int(os.environ.get("START_OFFSET", "0"))
CLIP_SERVICE_URL = os.environ.get("CLIP_SERVICE_URL", "http://localhost:5111")


def get_db_connection():
    import psycopg2

    return psycopg2.connect(DATABASE_URL)


def pick_image_url(row: dict) -> str | None:
    """Pick the best image URL using the same priority as awin.ts mapToProduct."""
    large = row.get("large_image") or ""
    merchant = row.get("merchant_image_url") or ""
    aw = row.get("aw_image_url") or ""

    if large and len(large) > 10:
        return large
    if merchant and len(merchant) > 10:
        return merchant
    if aw and "noimage" not in aw and len(aw) > 20:
        return aw
    return None


def embed_batch_via_service(urls: list[str]) -> list[list[float]]:
    """Call the clip service /embed/batch endpoint."""
    resp = requests.post(
        f"{CLIP_SERVICE_URL}/embed/batch",
        json={"urls": urls},
        timeout=120,
    )
    resp.raise_for_status()
    data = resp.json()
    return data["embeddings"]


def to_pg_vector(embedding: list[float]) -> str:
    """Format embedding as PostgreSQL vector literal."""
    return "[" + ",".join(str(v) for v in embedding) + "]"


def main():
    if not DATABASE_URL:
        print("[build] ERROR: DATABASE_URL not set", file=sys.stderr)
        sys.exit(1)

    # Check clip service health
    try:
        health = requests.get(f"{CLIP_SERVICE_URL}/health", timeout=5).json()
        print(f"[build] Clip service: {health}")
    except Exception as e:
        print(f"[build] ERROR: Cannot reach clip service at {CLIP_SERVICE_URL}: {e}")
        sys.exit(1)

    conn = get_db_connection()
    cur = conn.cursor()

    # Get total count
    cur.execute("SELECT COUNT(*) FROM awin_products")
    total = cur.fetchone()[0]
    print(f"[build] Total products: {total}, batch size: {BATCH_SIZE}")

    offset = START_OFFSET
    processed = 0
    skipped = 0
    failed = 0
    start_time = time.time()

    while offset < total:
        cur.execute(
            """
            SELECT aw_product_id, large_image, merchant_image_url, aw_image_url
            FROM awin_products
            ORDER BY aw_product_id
            LIMIT %s OFFSET %s
            """,
            (BATCH_SIZE, offset),
        )
        rows = cur.fetchall()
        if not rows:
            break

        columns = [desc[0] for desc in cur.description]
        products = [dict(zip(columns, row)) for row in rows]

        # Build list of (product_id, image_url) pairs
        batch_items: list[tuple[str, str]] = []
        for product in products:
            url = pick_image_url(product)
            if url:
                batch_items.append((product["aw_product_id"], url))
            else:
                skipped += 1

        if batch_items:
            urls = [item[1] for item in batch_items]

            try:
                embeddings = embed_batch_via_service(urls)

                # Upsert each embedding
                values = []
                for (product_id, _), embedding in zip(batch_items, embeddings):
                    if not embedding:  # Failed to embed
                        failed += 1
                        continue
                    values.append((product_id, to_pg_vector(embedding)))

                if values:
                    args_str = ",".join(
                        cur.mogrify("(%s, %s::vector, NOW())", v).decode()
                        for v in values
                    )
                    cur.execute(
                        f"""
                        INSERT INTO awin_image_embeddings (aw_product_id, embedding, updated_at)
                        VALUES {args_str}
                        ON CONFLICT (aw_product_id)
                        DO UPDATE SET embedding = EXCLUDED.embedding, updated_at = NOW()
                        """
                    )
                    conn.commit()
                    processed += len(values)

            except Exception as e:
                print(f"[build] Batch error at offset {offset}: {e}")
                failed += len(batch_items)
                conn.rollback()

        offset += len(products)
        elapsed = time.time() - start_time
        rate = processed / elapsed if elapsed > 0 else 0
        print(
            f"[build] Progress: {min(offset, total)}/{total} "
            f"(embedded: {processed}, skipped: {skipped}, failed: {failed}, "
            f"rate: {rate:.1f}/s)"
        )

    elapsed = time.time() - start_time
    print(
        f"[build] Done in {elapsed:.0f}s. "
        f"Embedded: {processed}, skipped: {skipped}, failed: {failed}"
    )

    cur.close()
    conn.close()


if __name__ == "__main__":
    main()

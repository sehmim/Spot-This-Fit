"""
Query the Pinecone shoes index with an image to find visually similar products.

Usage:
    python query_pinecone.py --url "https://example.com/shoe.jpg"
    python query_pinecone.py --file /path/to/shoe.jpg
    python query_pinecone.py --url "https://example.com/shoe.jpg" --top-k 10

Environment variables:
    PINECONE_API_KEY    Pinecone API key (required)
    PINECONE_INDEX_NAME Index name (default: shoes-clip)
    CLIP_SERVICE_URL    URL of the clip service (default: http://localhost:5111)
"""

import argparse
import base64
import os
import sys

import requests
from pinecone import Pinecone

PINECONE_API_KEY = os.environ.get("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.environ.get("PINECONE_INDEX_NAME", "shoes-clip")
CLIP_SERVICE_URL = os.environ.get("CLIP_SERVICE_URL", "http://localhost:5111")


def embed_from_url(url: str) -> list[float]:
    resp = requests.post(
        f"{CLIP_SERVICE_URL}/embed/image",
        json={"url": url},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()["embedding"]


def embed_from_file(path: str) -> list[float]:
    with open(path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode()
    resp = requests.post(
        f"{CLIP_SERVICE_URL}/embed/image",
        json={"base64": b64},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()["embedding"]


def main():
    parser = argparse.ArgumentParser(description="Query Pinecone shoes index with an image")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--url", help="Image URL to search with")
    group.add_argument("--file", help="Local image file path to search with")
    parser.add_argument("--top-k", type=int, default=5, help="Number of results (default: 5)")
    args = parser.parse_args()

    if not PINECONE_API_KEY:
        print("ERROR: PINECONE_API_KEY not set", file=sys.stderr)
        sys.exit(1)

    # Generate embedding
    print("Generating embedding...")
    if args.url:
        embedding = embed_from_url(args.url)
    else:
        embedding = embed_from_file(args.file)
    print(f"Embedding: {len(embedding)} dimensions")

    # Query Pinecone
    pc = Pinecone(api_key=PINECONE_API_KEY)
    index = pc.Index(PINECONE_INDEX_NAME)

    print(f"Querying Pinecone index '{PINECONE_INDEX_NAME}' for top {args.top_k} results...\n")
    results = index.query(vector=embedding, top_k=args.top_k, include_metadata=True)

    for i, match in enumerate(results.matches, 1):
        meta = match.metadata or {}
        print(f"  #{i}  score={match.score:.4f}")
        print(f"       title: {meta.get('title', 'N/A')}")
        print(f"       price: {meta.get('price', 'N/A')}")
        print(f"       gender: {meta.get('gender', 'N/A')}")
        print(f"       image: {meta.get('image_link', 'N/A')[:80]}")
        print(f"       link:  {meta.get('link', 'N/A')[:80]}")
        print()

    print(f"Total matches: {len(results.matches)}")


if __name__ == "__main__":
    main()

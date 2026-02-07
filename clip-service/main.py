"""
FashionCLIP embedding microservice.

Exposes endpoints to generate 512-dim image embeddings using the
patrickjohncyh/fashion-clip model (CLIP fine-tuned on 800K fashion products).
"""

import base64
import io
import logging
import math
from contextlib import asynccontextmanager
from typing import Optional

import requests as http_requests
import torch
import torch.nn.functional as F
from fastapi import FastAPI, HTTPException
from PIL import Image
from pydantic import BaseModel
from transformers import CLIPModel, CLIPProcessor

logger = logging.getLogger("clip-service")
logging.basicConfig(level=logging.INFO)

MODEL_NAME = "patrickjohncyh/fashion-clip"
model: Optional[CLIPModel] = None
processor: Optional[CLIPProcessor] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global model, processor
    logger.info(f"Loading model {MODEL_NAME} ...")
    processor = CLIPProcessor.from_pretrained(MODEL_NAME)
    model = CLIPModel.from_pretrained(MODEL_NAME)
    model.eval()

    # Quick self-test
    logger.info("Running self-test ...")
    try:
        test_img = Image.new("RGB", (224, 224), (128, 128, 128))
        emb = _embed_image(test_img)
        logger.info(f"Self-test passed: {len(emb)}-dim embedding, "
                     f"sample values: {emb[:3]}")
    except Exception as e:
        logger.error(f"Self-test FAILED: {e}")

    logger.info("Model loaded and ready.")
    yield
    logger.info("Shutting down.")


app = FastAPI(title="FashionCLIP Embedding Service", lifespan=lifespan)


# --------------- Request / Response models ---------------


class ImageEmbedRequest(BaseModel):
    url: Optional[str] = None
    base64: Optional[str] = None


class ImageEmbedResponse(BaseModel):
    embedding: list[float]
    dimensions: int


class BatchEmbedRequest(BaseModel):
    urls: list[str]


class BatchEmbedResponse(BaseModel):
    embeddings: list[list[float]]
    dimensions: int
    count: int
    failed: list[int]


# --------------- Helpers ---------------

IMAGE_DOWNLOAD_TIMEOUT = 10  # seconds


def _load_image_from_url(url: str) -> Image.Image:
    resp = http_requests.get(url, timeout=IMAGE_DOWNLOAD_TIMEOUT, stream=True)
    resp.raise_for_status()
    return Image.open(io.BytesIO(resp.content)).convert("RGB")


def _load_image_from_base64(b64: str) -> Image.Image:
    # Strip data URI prefix if present (e.g. "data:image/jpeg;base64,...")
    if "," in b64:
        b64 = b64.split(",", 1)[1]
    raw = base64.b64decode(b64)
    return Image.open(io.BytesIO(raw)).convert("RGB")


def _sanitize_floats(values: list[float]) -> list[float]:
    """Replace NaN/Inf with 0.0 to ensure JSON-serializable output."""
    return [0.0 if (math.isnan(v) or math.isinf(v)) else v for v in values]


def _embed_image(img: Image.Image) -> list[float]:
    inputs = processor(images=img, return_tensors="pt")
    pixel_values = inputs["pixel_values"]

    with torch.no_grad():
        # Use the vision model directly, then project through the visual projection
        vision_outputs = model.vision_model(pixel_values=pixel_values)
        pooled = vision_outputs.pooler_output  # (1, hidden_dim)
        features = model.visual_projection(pooled)  # (1, 512)

    # L2-normalize
    features = F.normalize(features, dim=-1)
    result = features[0].tolist()
    return _sanitize_floats(result)


def _embed_images_batch(images: list[Image.Image]) -> list[list[float]]:
    inputs = processor(images=images, return_tensors="pt", padding=True)
    pixel_values = inputs["pixel_values"]

    with torch.no_grad():
        vision_outputs = model.vision_model(pixel_values=pixel_values)
        pooled = vision_outputs.pooler_output  # (N, hidden_dim)
        features = model.visual_projection(pooled)  # (N, 512)

    features = F.normalize(features, dim=-1)
    return [_sanitize_floats(row) for row in features.tolist()]


# --------------- Endpoints ---------------


@app.get("/health")
async def health():
    return {
        "status": "ok" if model is not None else "loading",
        "model": MODEL_NAME,
        "dimensions": 512,
    }


@app.post("/embed/image", response_model=ImageEmbedResponse)
async def embed_image(req: ImageEmbedRequest):
    if not req.url and not req.base64:
        raise HTTPException(400, "Provide either 'url' or 'base64'")

    try:
        if req.base64:
            img = _load_image_from_base64(req.base64)
        else:
            img = _load_image_from_url(req.url)
    except Exception as e:
        raise HTTPException(400, f"Failed to load image: {e}")

    try:
        embedding = _embed_image(img)
    except Exception as e:
        logger.exception("Embedding failed")
        raise HTTPException(500, f"Embedding failed: {e}")

    return ImageEmbedResponse(embedding=embedding, dimensions=len(embedding))


@app.post("/embed/batch", response_model=BatchEmbedResponse)
async def embed_batch(req: BatchEmbedRequest):
    if not req.urls:
        raise HTTPException(400, "Provide at least one URL")

    images: list[Image.Image] = []
    failed_indices: list[int] = []

    for i, url in enumerate(req.urls):
        try:
            img = _load_image_from_url(url)
            images.append(img)
        except Exception as e:
            logger.warning(f"Failed to load image {i} ({url}): {e}")
            failed_indices.append(i)
            images.append(None)

    # Filter out failed images for batch processing
    valid_images = [img for img in images if img is not None]

    if not valid_images:
        raise HTTPException(400, "All images failed to load")

    try:
        valid_embeddings = _embed_images_batch(valid_images)
    except Exception as e:
        logger.exception("Batch embedding failed")
        raise HTTPException(500, f"Batch embedding failed: {e}")

    # Reconstruct full list with empty embeddings for failed indices
    embeddings: list[list[float]] = []
    valid_idx = 0
    for i in range(len(req.urls)):
        if i in failed_indices:
            embeddings.append([])
        else:
            embeddings.append(valid_embeddings[valid_idx])
            valid_idx += 1

    return BatchEmbedResponse(
        embeddings=embeddings,
        dimensions=512,
        count=len(valid_images),
        failed=failed_indices,
    )


if __name__ == "__main__":
    import os
    import uvicorn

    port = int(os.environ.get("PORT", "5111"))
    uvicorn.run(app, host="0.0.0.0", port=port)

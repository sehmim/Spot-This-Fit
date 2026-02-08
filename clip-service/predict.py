"""
FashionCLIP embedding model for Replicate (Cog).

Returns a 512-dim L2-normalised embedding for an input image.
"""

import base64
import io
import math
from typing import Optional

import requests as http_requests
import torch
import torch.nn.functional as F
from cog import BasePredictor, Input
from PIL import Image
from transformers import CLIPModel, CLIPProcessor

MODEL_NAME = "patrickjohncyh/fashion-clip"


class Predictor(BasePredictor):
    def setup(self):
        """Load the FashionCLIP model (runs once on cold start)."""
        self.processor = CLIPProcessor.from_pretrained(MODEL_NAME)
        self.model = CLIPModel.from_pretrained(MODEL_NAME)
        self.model.eval()

    def predict(
        self,
        image_url: str = Input(
            description="URL of the image to embed", default=""
        ),
        image_base64: str = Input(
            description="Base64-encoded image (with or without data URI prefix)",
            default="",
        ),
    ) -> list[float]:
        """Return a 512-dim embedding for the input image."""
        if image_base64:
            img = self._load_from_base64(image_base64)
        elif image_url:
            img = self._load_from_url(image_url)
        else:
            raise ValueError("Provide either image_url or image_base64")

        return self._embed(img)

    # ---- helpers ----

    def _load_from_url(self, url: str) -> Image.Image:
        resp = http_requests.get(url, timeout=10, stream=True)
        resp.raise_for_status()
        return Image.open(io.BytesIO(resp.content)).convert("RGB")

    def _load_from_base64(self, b64: str) -> Image.Image:
        if "," in b64:
            b64 = b64.split(",", 1)[1]
        raw = base64.b64decode(b64)
        return Image.open(io.BytesIO(raw)).convert("RGB")

    def _embed(self, img: Image.Image) -> list[float]:
        inputs = self.processor(images=img, return_tensors="pt")
        with torch.no_grad():
            vision_out = self.model.vision_model(
                pixel_values=inputs["pixel_values"]
            )
            features = self.model.visual_projection(vision_out.pooler_output)
        features = F.normalize(features, dim=-1)
        values = features[0].tolist()
        return [0.0 if (math.isnan(v) or math.isinf(v)) else v for v in values]

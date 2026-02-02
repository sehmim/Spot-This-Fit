# SpotThisFit — API Reference

Base URL: `http://localhost:4000` (dev) or your Railway deployment URL (production).

All responses follow the `ApiResponse<T>` / `ApiError` format from `@spotthisfit/shared`.

---

## POST `/api/video/download`

Download a video from a social media URL.

**Request:**

```json
{
  "url": "https://www.instagram.com/reel/..."
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "videoUrl": "http://localhost:4000/videos/test.mp4"
  },
  "timestamp": "2026-01-15T12:00:00.000Z"
}
```

Currently returns a mock video after a 2-second delay.

---

## POST `/api/search/frame`

Start a product search from a frame image. The image is analyzed by GPT-4V to identify clothing items, then products are enriched via the configured product provider.

**Request:**

```json
{
  "frameImage": "data:image/jpeg;base64,...",
  "highlight": { "x": 0.2, "y": 0.1, "width": 0.4, "height": 0.6 },
  "description": "blue denim jacket"
}
```

| Field         | Type              | Required | Description                                          |
| ------------- | ----------------- | -------- | ---------------------------------------------------- |
| `frameImage`  | string (base64)   | Yes      | JPEG/PNG image as data URL                           |
| `highlight`   | `HighlightRegion` | No       | Bounding box with normalized 0-1 coordinates         |
| `description` | string            | No       | User description of the product to prioritize        |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "searchId": "abc123-def456"
  },
  "timestamp": "2026-01-15T12:00:00.000Z"
}
```

---

## GET `/api/search/:searchId/stream`

Server-Sent Events stream of enriched products. Connect with `EventSource`.

**Usage:**

```js
const es = new EventSource("/api/search/abc123-def456/stream");

es.addEventListener("status", (e) => { /* ... */ });
es.addEventListener("product", (e) => { /* ... */ });
es.addEventListener("complete", (e) => { /* ... */ });
```

### Event: `status`

Sent periodically as the search progresses.

```json
{
  "type": "status",
  "data": {
    "message": "Searching Zara...",
    "code": "identified_products",
    "params": { "count": 5 },
    "retailersSearched": 3
  }
}
```

| Code                  | Params             | Description                            |
| --------------------- | ------------------ | -------------------------------------- |
| `analyzing_image`     | —                  | AI is processing the image             |
| `identified_products` | `{ count }`        | AI found N product candidates          |
| `ai_failed`           | —                  | Vision analysis failed, using fallback |
| `found_product`       | `{ product }`      | A specific product was matched         |

### Event: `product`

Sent each time a product is enriched. Products arrive one at a time with staggered delays.

```json
{
  "type": "product",
  "data": {
    "id": "uuid",
    "name": "Classic Denim Jacket",
    "brand": "Levi's",
    "category": "outerwear",
    "price": 89.99,
    "currency": "CAD",
    "originalPrice": 120.00,
    "onSale": true,
    "saleDiscount": 25,
    "imageUrl": "https://...",
    "shopUrl": "https://...",
    "affiliateUrl": "https://...",
    "confidence": "high",
    "confidenceScore": 92,
    "isHighlighted": true,
    "merchantName": "Nordstrom",
    "merchantLogo": "https://...",
    "availability": "in_stock",
    "color": "Blue",
    "material": "Denim",
    "size": "M",
    "description": "Classic trucker jacket in medium wash denim."
  }
}
```

### Event: `complete`

Sent when all products have been streamed.

```json
{
  "type": "complete",
  "data": {
    "totalProducts": 8
  }
}
```

---

## POST `/api/user/email`

Save user email for search results delivery and price drop alerts.

**Request:**

```json
{
  "email": "user@example.com",
  "searchId": "abc123-def456",
  "marketingOptIn": true
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Email saved"
  },
  "timestamp": "2026-01-15T12:00:00.000Z"
}
```

---

## Error Responses

All errors return `ApiError` format:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_URL",
    "message": "URL is not a supported video link.",
    "details": {}
  },
  "timestamp": "2026-01-15T12:00:00.000Z"
}
```

| Code              | HTTP | Description                                |
| ----------------- | ---- | ------------------------------------------ |
| `MISSING_URL`     | 400  | Video URL is required                      |
| `INVALID_URL`     | 400  | URL is not a supported platform link       |
| `INVALID_REQUEST` | 400  | Missing required fields                    |
| `NOT_FOUND`       | 404  | Search session not found                   |
| `INVALID_EMAIL`   | 400  | Email format invalid                       |
| `INTERNAL_ERROR`  | 500  | Unexpected server error                    |

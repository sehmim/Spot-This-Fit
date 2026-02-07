/**
 * Crop a region from a base64-encoded image using sharp.
 *
 * The region uses normalized 0-1 coordinates (matching HighlightRegion from the frontend).
 */

import sharp from "sharp";

interface CropRegion {
  x: number; // 0-1 normalized left position
  y: number; // 0-1 normalized top position
  width: number; // 0-1 normalized width
  height: number; // 0-1 normalized height
}

export async function cropImage(
  fullImageBase64: string,
  region: CropRegion
): Promise<string> {
  // Strip data URI prefix if present
  const raw = fullImageBase64.includes(",")
    ? fullImageBase64.split(",")[1]
    : fullImageBase64;

  const buffer = Buffer.from(raw, "base64");
  const metadata = await sharp(buffer).metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Could not read image dimensions");
  }

  const left = Math.round(region.x * metadata.width);
  const top = Math.round(region.y * metadata.height);
  const width = Math.max(
    1,
    Math.round(region.width * metadata.width)
  );
  const height = Math.max(
    1,
    Math.round(region.height * metadata.height)
  );

  const cropped = await sharp(buffer)
    .extract({ left, top, width, height })
    .jpeg()
    .toBuffer();

  return cropped.toString("base64");
}

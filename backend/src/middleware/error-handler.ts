import type { Request, Response, NextFunction } from "express";
import type { ApiError } from "@spotthisfit/shared";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error("[Error]", err.message);

  const response: ApiError = {
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: err.message || "An unexpected error occurred",
    },
    timestamp: new Date().toISOString(),
  };

  res.status(500).json(response);
}

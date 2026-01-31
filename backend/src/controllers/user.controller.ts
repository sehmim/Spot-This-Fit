import type { Request, Response } from "express";
import type {
  ApiResponse,
  ApiError,
  EmailCaptureRequest,
  EmailCaptureResponse,
} from "@spotthisfit/shared";

export async function captureEmail(req: Request, res: Response) {
  const { email } = req.body as EmailCaptureRequest;

  if (!email || !email.includes("@")) {
    const error: ApiError = {
      success: false,
      error: { code: "INVALID_EMAIL", message: "A valid email address is required" },
      timestamp: new Date().toISOString(),
    };
    res.status(400).json(error);
    return;
  }

  // Simulate delay
  await new Promise((r) => setTimeout(r, 400));

  console.log(`[Email Captured] ${email}`);

  const data: EmailCaptureResponse = {
    success: true,
    message: "Email saved! You'll receive your results and price drop alerts.",
  };

  const response: ApiResponse<EmailCaptureResponse> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
}

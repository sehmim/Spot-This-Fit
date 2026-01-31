export interface EmailCaptureRequest {
  email: string;
  searchId?: string;
  marketingOptIn: boolean;
}

export interface EmailCaptureResponse {
  success: boolean;
  message: string;
}

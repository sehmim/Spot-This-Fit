"use client";

import { useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import { useSearchStore } from "@/stores/search-store";
import { useUiStore } from "@/stores/ui-store";
import type { ApiResponse, EmailCaptureResponse } from "@spotthisfit/shared";

export function useEmailCapture() {
  const searchId = useSearchStore((s) => s.searchId);
  const { setEmailSubmitted, setEmailSheetOpen } = useUiStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitEmail = useCallback(
    async (email: string) => {
      setIsSubmitting(true);
      setError(null);
      try {
        await apiClient.post<ApiResponse<EmailCaptureResponse>>(
          "/api/user/email",
          { email, searchId, marketingOptIn: true }
        );
        setEmailSubmitted(true);
        setEmailSheetOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save email");
      } finally {
        setIsSubmitting(false);
      }
    },
    [searchId, setEmailSubmitted, setEmailSheetOpen]
  );

  return { submitEmail, isSubmitting, error };
}

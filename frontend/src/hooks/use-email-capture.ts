"use client";

import { useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import { useSearchStore } from "@/stores/search-store";
import { useUiStore } from "@/stores/ui-store";
import type { ApiResponse, EmailCaptureResponse } from "@spotthisfit/shared";
import { useTranslations } from "@/components/i18n/locale-provider";
import { getErrorMessage } from "@/lib/error-messages";

export function useEmailCapture() {
  const t = useTranslations();
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
        setError(
          getErrorMessage(err, t, {
            fallbackKey: "results.emailCapture.errorFailed",
          })
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [searchId, setEmailSubmitted, setEmailSheetOpen, t]
  );

  return { submitEmail, isSubmitting, error };
}

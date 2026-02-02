import type { TranslationKey } from "@/lib/i18n";
import { isApiClientError } from "@/lib/api-client";

type Translator = (
  key: TranslationKey,
  params?: Record<string, string | number>,
) => string;

const ERROR_CODE_TO_KEY: Record<string, TranslationKey> = {
  MISSING_URL: "errors.missingUrl",
  INVALID_URL: "errors.invalidUrl",
  INVALID_REQUEST: "errors.invalidRequest",
  NOT_FOUND: "errors.notFound",
  INVALID_EMAIL: "errors.invalidEmail",
  INTERNAL_ERROR: "errors.internalError",
};

export function getErrorMessage(
  error: unknown,
  t: Translator,
  options?: { fallbackKey?: TranslationKey },
): string {
  if (isApiClientError(error)) {
    const key = error.code ? ERROR_CODE_TO_KEY[error.code] : undefined;
    if (key) return t(key);
    if (options?.fallbackKey) {
      return t(options.fallbackKey);
    }
    if (error.status) {
      return t("errors.requestFailed", { status: error.status });
    }
  }

  if (options?.fallbackKey) {
    return t(options.fallbackKey);
  }

  return t("errors.unknown");
}

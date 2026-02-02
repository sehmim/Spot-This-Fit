"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEmailCapture } from "@/hooks/use-email-capture";
import { useUiStore } from "@/stores/ui-store";
import { Mail, Loader2, X, CheckCircle2 } from "lucide-react";
import { useTranslations } from "@/components/i18n/locale-provider";

export function EmailCaptureInline() {
  const t = useTranslations();
  const { submitEmail, isSubmitting, error } = useEmailCapture();
  const emailSubmitted = useUiStore((s) => s.emailSubmitted);
  const [email, setEmail] = useState("");
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  if (emailSubmitted) {
    return (
      <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
        <CardContent className="flex items-center gap-3 p-4">
          <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
          <p className="text-sm font-medium text-green-800 dark:text-green-200">
            {t("results.emailCapture.success")}
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) submitEmail(email);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Mail className="size-5 text-primary" />
            <div>
              <p className="text-sm font-semibold">
                {t("results.emailCapture.title")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("results.emailCapture.subtitle")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
          <Input
            type="email"
            placeholder={t("results.emailCapture.placeholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-9 text-sm"
          />
          <Button
            type="submit"
            size="sm"
            className="h-9 shrink-0 gap-2"
            disabled={isSubmitting || !email.trim()}
          >
            {isSubmitting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              t("results.emailCapture.save")
            )}
          </Button>
        </form>
        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}

"use client";

import { Input } from "@/components/ui/input";
import { useTranslations } from "@/components/i18n/locale-provider";

interface ProductDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function ProductDescriptionInput({
  value,
  onChange,
}: ProductDescriptionInputProps) {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">
        {t("description.label")}
      </label>
      <Input
        placeholder={t("description.placeholder")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 text-base"
      />
      <p className="text-xs text-muted-foreground">
        {t("description.helper")}
      </p>
    </div>
  );
}

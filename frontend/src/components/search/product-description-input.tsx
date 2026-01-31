"use client";

import { Input } from "@/components/ui/input";

interface ProductDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function ProductDescriptionInput({
  value,
  onChange,
}: ProductDescriptionInputProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">
        Describe the highlighted product
      </label>
      <Input
        placeholder='e.g. "the blue denim jacket", "white sneakers"'
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 text-base"
      />
      <p className="text-xs text-muted-foreground">
        Be specific &mdash; this helps our AI prioritize the right product
      </p>
    </div>
  );
}

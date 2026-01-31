"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 md:mx-auto md:max-w-5xl">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="size-6 text-primary" />
          <span className="text-lg font-bold tracking-tight">SpotThisFit</span>
        </Link>
      </div>
    </header>
  );
}

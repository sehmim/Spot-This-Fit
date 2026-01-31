"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export function FindMoreCta() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border bg-muted/30 p-6 text-center">
      <p className="text-sm font-medium">Want to find more products?</p>
      <p className="text-xs text-muted-foreground">
        Search a different moment in the same video or try a new one.
      </p>
      <div className="mt-2 flex gap-2">
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link href="/search">
            <Search className="size-3.5" />
            Search again
          </Link>
        </Button>
        <Button asChild size="sm" className="gap-1.5">
          <Link href="/">Try new video</Link>
        </Button>
      </div>
    </div>
  );
}

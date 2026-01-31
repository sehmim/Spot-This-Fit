"use client";

import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { toast } from "sonner";

export function ShareButton() {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "SpotThisFit - Products I found",
          text: "Check out these products I found from a video!",
          url: window.location.href,
        });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  return (
    <Button variant="outline" className="gap-2" onClick={handleShare}>
      <Share2 className="size-4" />
      Share
    </Button>
  );
}

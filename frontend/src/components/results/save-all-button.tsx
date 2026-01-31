"use client";

import { Button } from "@/components/ui/button";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";

export function SaveAllButton() {
  return (
    <Button
      variant="outline"
      className="gap-2"
      onClick={() => toast.success("All products saved!")}
    >
      <Bookmark className="size-4" />
      Save All
    </Button>
  );
}

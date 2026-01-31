"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Search, CheckCircle2 } from "lucide-react";

interface SearchStatusProps {
  status: string;
  isStreaming: boolean;
  retailersSearched: number;
  streamComplete: boolean;
}

export function SearchStatus({
  status,
  isStreaming,
  retailersSearched,
  streamComplete,
}: SearchStatusProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
      {streamComplete ? (
        <CheckCircle2 className="size-5 shrink-0 text-green-500" />
      ) : isStreaming ? (
        <Loader2 className="size-5 shrink-0 animate-spin text-primary" />
      ) : (
        <Search className="size-5 shrink-0 text-muted-foreground" />
      )}
      <AnimatePresence mode="wait">
        <motion.p
          key={status}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className="text-sm font-medium"
        >
          {status}
        </motion.p>
      </AnimatePresence>
      {isStreaming && retailersSearched > 0 && (
        <span className="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">
          {retailersSearched} retailers checked
        </span>
      )}
    </div>
  );
}

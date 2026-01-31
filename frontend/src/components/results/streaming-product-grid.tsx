"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ProductCard } from "./product-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product } from "@spotthisfit/shared";

interface StreamingProductGridProps {
  products: Product[];
  isStreaming: boolean;
  skeletonCount?: number;
}

export function StreamingProductGrid({
  products,
  isStreaming,
  skeletonCount = 3,
}: StreamingProductGridProps) {
  const remainingSkeletons = isStreaming
    ? Math.max(0, skeletonCount - products.length)
    : 0;

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      <AnimatePresence mode="popLayout">
        {products.map((product) => (
          <motion.div
            key={product.id}
            layout
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
            }}
          >
            <ProductCard product={product} />
          </motion.div>
        ))}
      </AnimatePresence>

      {Array.from({ length: remainingSkeletons }).map((_, i) => (
        <motion.div
          key={`skeleton-${i}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        >
          <Skeleton className="h-80 w-full rounded-xl" />
        </motion.div>
      ))}
    </div>
  );
}

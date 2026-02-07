import { create } from "zustand";
import type { Product } from "@spotthisfit/shared";

interface ResultsState {
  streamedProducts: Product[];
  isStreaming: boolean;
  streamStatus: string;
  retailersSearched: number;
  streamComplete: boolean;
  error: string | null;
  selectedProduct: Product | null;

  addStreamedProduct: (p: Product) => void;
  setIsStreaming: (v: boolean) => void;
  setStreamStatus: (s: string) => void;
  setRetailersSearched: (n: number) => void;
  setStreamComplete: (v: boolean) => void;
  setError: (err: string | null) => void;
  setSelectedProduct: (p: Product | null) => void;
  setProducts: (products: Product[]) => void;
  resetStream: () => void;
}

export const useResultsStore = create<ResultsState>((set) => ({
  streamedProducts: [],
  isStreaming: false,
  streamStatus: "",
  retailersSearched: 0,
  streamComplete: false,
  error: null,
  selectedProduct: null,

  addStreamedProduct: (p) =>
    set((s) => ({ streamedProducts: [...s.streamedProducts, p] })),
  setIsStreaming: (v) => set({ isStreaming: v }),
  setStreamStatus: (s) => set({ streamStatus: s }),
  setRetailersSearched: (n) => set({ retailersSearched: n }),
  setStreamComplete: (v) => set({ streamComplete: v }),
  setError: (err) => set({ error: err }),
  setSelectedProduct: (p) => set({ selectedProduct: p }),
  setProducts: (products) =>
    set({
      streamedProducts: products,
      isStreaming: false,
      streamComplete: true,
      streamStatus: `Found ${products.length} similar products`,
      retailersSearched: products.length,
      error: null,
    }),
  resetStream: () =>
    set({
      streamedProducts: [],
      isStreaming: false,
      streamStatus: "",
      retailersSearched: 0,
      streamComplete: false,
      error: null,
      selectedProduct: null,
    }),
}));

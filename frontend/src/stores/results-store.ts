import { create } from "zustand";
import type { Product } from "@spotthisfit/shared";

interface ResultsState {
  streamedProducts: Product[];
  isStreaming: boolean;
  streamStatus: string;
  retailersSearched: number;
  streamComplete: boolean;
  error: string | null;

  addStreamedProduct: (p: Product) => void;
  setIsStreaming: (v: boolean) => void;
  setStreamStatus: (s: string) => void;
  setRetailersSearched: (n: number) => void;
  setStreamComplete: (v: boolean) => void;
  setError: (err: string | null) => void;
  resetStream: () => void;
}

export const useResultsStore = create<ResultsState>((set) => ({
  streamedProducts: [],
  isStreaming: false,
  streamStatus: "",
  retailersSearched: 0,
  streamComplete: false,
  error: null,

  addStreamedProduct: (p) =>
    set((s) => ({ streamedProducts: [...s.streamedProducts, p] })),
  setIsStreaming: (v) => set({ isStreaming: v }),
  setStreamStatus: (s) => set({ streamStatus: s }),
  setRetailersSearched: (n) => set({ retailersSearched: n }),
  setStreamComplete: (v) => set({ streamComplete: v }),
  setError: (err) => set({ error: err }),
  resetStream: () =>
    set({
      streamedProducts: [],
      isStreaming: false,
      streamStatus: "",
      retailersSearched: 0,
      streamComplete: false,
      error: null,
    }),
}));

import { create } from "zustand";
import type { HighlightRegion } from "@spotthisfit/shared";

interface SearchState {
  inputUrl: string;
  downloadedVideoUrl: string | null;
  isDownloading: boolean;
  downloadError: string | null;
  selectedFrame: string | null;
  highlight: HighlightRegion | null;
  description: string;
  searchId: string | null;

  setInputUrl: (url: string) => void;
  setDownloadedVideoUrl: (url: string) => void;
  setIsDownloading: (v: boolean) => void;
  setDownloadError: (err: string | null) => void;
  setSelectedFrame: (frame: string) => void;
  setHighlight: (h: HighlightRegion) => void;
  setDescription: (d: string) => void;
  setSearchId: (id: string) => void;
  reset: () => void;
}

const initialState = {
  inputUrl: "",
  downloadedVideoUrl: null as string | null,
  isDownloading: false,
  downloadError: null as string | null,
  selectedFrame: null as string | null,
  highlight: null as HighlightRegion | null,
  description: "",
  searchId: null as string | null,
};

export const useSearchStore = create<SearchState>((set) => ({
  ...initialState,
  setInputUrl: (url) => set({ inputUrl: url }),
  setDownloadedVideoUrl: (url) => set({ downloadedVideoUrl: url }),
  setIsDownloading: (v) => set({ isDownloading: v }),
  setDownloadError: (err) => set({ downloadError: err }),
  setSelectedFrame: (frame) => set({ selectedFrame: frame }),
  setHighlight: (h) => set({ highlight: h }),
  setDescription: (d) => set({ description: d }),
  setSearchId: (id) => set({ searchId: id }),
  reset: () => set(initialState),
}));

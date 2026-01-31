import { create } from "zustand";

interface UiState {
  isEmailSheetOpen: boolean;
  emailSubmitted: boolean;

  setEmailSheetOpen: (v: boolean) => void;
  setEmailSubmitted: (v: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isEmailSheetOpen: false,
  emailSubmitted: false,
  setEmailSheetOpen: (v) => set({ isEmailSheetOpen: v }),
  setEmailSubmitted: (v) => set({ emailSubmitted: v }),
}));

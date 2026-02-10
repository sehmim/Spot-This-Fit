"use client";

import { useEffect } from "react";
import { useCurrencyStore } from "@/stores/currency-store";

export function CurrencyLoader() {
  useEffect(() => {
    useCurrencyStore.getState().fetchRates();
  }, []);

  return null;
}

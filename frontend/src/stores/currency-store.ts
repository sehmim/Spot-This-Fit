import { create } from "zustand";

export type Currency = "USD" | "CAD" | "GBP" | "EUR";

const STORAGE_KEY = "stf_currency";
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

interface RatesMap {
  [key: string]: number;
}

interface CurrencyState {
  currency: Currency;
  rates: RatesMap;
  lastFetched: number;
  setCurrency: (c: Currency) => void;
  fetchRates: () => Promise<void>;
  convert: (amount: number, fromCurrency: string) => number;
}

function getStoredCurrency(): Currency {
  if (typeof window === "undefined") return "USD";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "USD" || stored === "CAD" || stored === "GBP" || stored === "EUR") {
    return stored;
  }
  return "USD";
}

export const useCurrencyStore = create<CurrencyState>((set, get) => ({
  currency: getStoredCurrency(),
  rates: { USD: 1 },
  lastFetched: 0,

  setCurrency: (c) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, c);
    }
    set({ currency: c });
  },

  fetchRates: async () => {
    const { lastFetched } = get();
    if (Date.now() - lastFetched < CACHE_TTL) return;

    try {
      const res = await fetch(
        "https://api.frankfurter.app/latest?from=USD&to=CAD,GBP,EUR",
      );
      if (!res.ok) return;
      const data = (await res.json()) as { rates: RatesMap };
      set({ rates: { USD: 1, ...data.rates }, lastFetched: Date.now() });
    } catch {
      // keep existing rates on failure
    }
  },

  convert: (amount, fromCurrency) => {
    if (amount <= 0) return 0;
    const { currency, rates } = get();
    if (fromCurrency === currency) return amount;

    const fromRate = rates[fromCurrency] ?? 1;
    const toRate = rates[currency] ?? 1;
    // Convert: amount in fromCurrency → USD → target currency
    return (amount / fromRate) * toRate;
  },
}));

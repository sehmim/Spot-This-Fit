"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Cookie, ChevronDown, ChevronUp } from "lucide-react";

const COOKIE_KEY = "stf_cookie_consent";

interface CookiePreferences {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
}

function getStoredPreferences(): CookiePreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(COOKIE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CookiePreferences;
  } catch {
    return null;
  }
}

function storePreferences(prefs: CookiePreferences) {
  localStorage.setItem(COOKIE_KEY, JSON.stringify(prefs));
  window.dispatchEvent(new CustomEvent("cookie-consent-updated", { detail: prefs }));
}

export function getCookieConsent(): CookiePreferences | null {
  return getStoredPreferences();
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const stored = getStoredPreferences();
    if (!stored) {
      setVisible(true);
    }
  }, []);

  const handleAcceptAll = useCallback(() => {
    storePreferences({ necessary: true, analytics: true, marketing: true });
    setVisible(false);
  }, []);

  const handleDenyAll = useCallback(() => {
    storePreferences({ necessary: true, analytics: false, marketing: false });
    setVisible(false);
  }, []);

  const handleSavePreferences = useCallback(() => {
    storePreferences({ necessary: true, analytics, marketing });
    setVisible(false);
  }, [analytics, marketing]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed top-16 inset-x-0 z-30"
        >
          <div className="border-b bg-card/95 backdrop-blur-sm">
            <div className="flex items-center gap-3 px-4 py-2.5">
              <Cookie className="size-4 shrink-0 text-muted-foreground" />
              <p className="flex-1 min-w-0 text-xs text-muted-foreground">
                We use cookies to improve your experience.
              </p>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="flex items-center gap-0.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  {expanded ? (
                    <ChevronUp className="size-3" />
                  ) : (
                    <ChevronDown className="size-3" />
                  )}
                  Customize
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2.5 text-xs"
                  onClick={handleDenyAll}
                >
                  Deny
                </Button>
                <Button
                  size="sm"
                  className="h-7 px-2.5 text-xs"
                  onClick={handleAcceptAll}
                >
                  Accept
                </Button>
              </div>
            </div>

            {/* Expandable preferences */}
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-4 border-t px-4 py-2.5">
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked
                        disabled
                        className="size-3.5 accent-primary"
                      />
                      Necessary
                    </label>
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={analytics}
                        onChange={(e) => setAnalytics(e.target.checked)}
                        className="size-3.5 accent-primary cursor-pointer"
                      />
                      Analytics
                    </label>
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={marketing}
                        onChange={(e) => setMarketing(e.target.checked)}
                        className="size-3.5 accent-primary cursor-pointer"
                      />
                      Marketing
                    </label>
                    <Button
                      size="sm"
                      className="ml-auto h-7 px-2.5 text-xs"
                      onClick={handleSavePreferences}
                    >
                      Save
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

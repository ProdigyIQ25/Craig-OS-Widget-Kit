"use client";

import { useEffect } from "react";

/**
 * Registers the Craig OS service worker for installable shell + offline fallback.
 * SW must never cache /api/*, secrets, or Notion payloads.
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      /* installability still valid without SW in some browsers */
    });
  }, []);

  return null;
}

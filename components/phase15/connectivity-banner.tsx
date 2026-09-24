"use client";

import { useEffect, useState } from "react";

/**
 * Intentional degraded connectivity banner.
 * Does not invent offline Craig OS truth — only discloses that live state cannot be verified.
 */
export function ConnectivityBanner() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const sync = () => setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (online) return null;

  return (
    <div className="p15-connectivity" role="status" aria-live="polite" data-connectivity="offline">
      <strong>Offline</strong>
      <span>Craig OS cannot verify live Notion state. Capture, Ask writes, and record edits stay blocked until you reconnect.</span>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import type { AggregateEnvelope } from "@/lib/phase15/ui-models";
import { PHASE15_CONTRACT_VERSION } from "@/lib/phase15/semantic";

export type FetchState<T> =
  | { status: "loading"; data: null; error: null; generatedAt: null }
  | { status: "ready"; data: T; error: null; generatedAt: string }
  | { status: "error"; data: null; error: { code: string; message: string }; generatedAt: string | null };

export function useAggregate<T>(path: string) {
  const [state, setState] = useState<FetchState<T>>({
    status: "loading",
    data: null,
    error: null,
    generatedAt: null,
  });

  const load = useCallback(async () => {
    setState({ status: "loading", data: null, error: null, generatedAt: null });
    try {
      const response = await fetch(path, { cache: "no-store" });
      const body = (await response.json()) as AggregateEnvelope<T>;
      if (!response.ok || !body.ok || body.data === null) {
        setState({
          status: "error",
          data: null,
          error: body.error ?? { code: "UPSTREAM_UNAVAILABLE", message: "Canonical source unavailable." },
          generatedAt: body.generatedAt ?? null,
        });
        return;
      }
      setState({
        status: "ready",
        data: body.data,
        error: null,
        generatedAt: body.generatedAt,
      });
    } catch {
      const offline = typeof navigator !== "undefined" && navigator.onLine === false;
      setState({
        status: "error",
        data: null,
        error: {
          code: offline ? "OFFLINE" : "UPSTREAM_UNAVAILABLE",
          message: offline
            ? "You are offline. Live Craig OS state cannot be verified."
            : "Canonical source unavailable.",
        },
        generatedAt: new Date().toISOString(),
      });
    }
  }, [path]);

  useEffect(() => {
    void load();
  }, [load]);

  return { state, retry: load, contractVersion: PHASE15_CONTRACT_VERSION };
}

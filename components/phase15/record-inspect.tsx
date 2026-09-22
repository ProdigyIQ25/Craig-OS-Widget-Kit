"use client";

import { useEffect, useRef, useState } from "react";
import type { CommandRecord } from "@/lib/phase15/ui-models";
import { DeepEditLink } from "./primitives";

function useIsNarrow(breakpoint = 768) {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const update = () => setNarrow(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [breakpoint]);
  return narrow;
}

export function RecordInspect({
  record,
  open,
  onClose,
  contextLabel,
}: {
  record: CommandRecord | null;
  open: boolean;
  onClose: () => void;
  contextLabel: string;
}) {
  const narrow = useIsNarrow();
  const panelRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusable = panel?.querySelector<HTMLElement>("button, a[href]");
    focusable?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !panel) return;
      const nodes = Array.from(panel.querySelectorAll<HTMLElement>("button, a[href]"));
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [open, onClose]);

  if (!open || !record) return null;

  return (
    <div
      className="p15-inspect-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        ref={panelRef}
        className={narrow ? "p15-sheet" : "p15-drawer"}
        role="dialog"
        aria-modal="true"
        aria-label={`${record.kind} detail`}
      >
        <header>
          <div>
            <p className="p15-eyebrow">{record.kind}</p>
            <h2>{record.title}</h2>
            <p>{record.detail ?? contextLabel}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close detail">
            Close
          </button>
        </header>
        <section>
          <p className="p15-eyebrow">STATUS</p>
          <strong>{record.status ?? "AVAILABLE FOR REVIEW"}</strong>
        </section>
        <footer>
          <button type="button" onClick={onClose}>
            Back to {contextLabel}
          </button>
          <DeepEditLink href={record.notionUrl} />
        </footer>
      </aside>
    </div>
  );
}

"use client";

import { useState } from "react";
import { StatePanel } from "@/components/state-panel";
import { themes } from "@/lib/themes";
import type { WidgetState, WidgetTheme } from "@/types/widget";

const states: ReadonlyArray<{ id: WidgetState; label: string }> = [
  { id: "success", label: "Success" },
  { id: "loading", label: "Loading" },
  { id: "empty", label: "Empty" },
  { id: "error", label: "Error" },
  { id: "unauthorized", label: "Unauthorized" },
  { id: "not-configured", label: "Not configured" }
];

export function FoundationDemo() {
  const [theme, setTheme] = useState<WidgetTheme>("business");
  const [state, setState] = useState<WidgetState>("success");

  return (
    <main className="widget-frame" data-theme={theme}>
      <header className="widget-header">
        <div>
          <p className="eyebrow">FOUNDATION DEMO</p>
          <h1>Craig OS Widget Kit</h1>
          <p className="muted">A secure, embed-safe interaction shell. <strong>DEMO DATA</strong></p>
        </div>
        <span className="version" aria-label="Version 0.1.0">v0.1.0</span>
      </header>

      <section className="control-group" aria-labelledby="theme-label">
        <p id="theme-label" className="control-label">Theme</p>
        <div className="segmented">
          {themes.map((item) => (
            <button key={item.id} type="button" aria-pressed={theme === item.id} onClick={() => setTheme(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="control-group" aria-labelledby="state-label">
        <p id="state-label" className="control-label">Foundation state</p>
        <div className="segmented state-controls">
          {states.map((item) => (
            <button key={item.id} type="button" aria-pressed={state === item.id} onClick={() => setState(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {state === "success" ? (
        <section className="proof-grid" aria-label="Synthetic foundation status">
          <article className="metric-card">
            <p className="eyebrow">SYSTEM</p>
            <p className="metric-value healthy">READY</p>
            <p className="muted">Shared tokens and typed responses are active.</p>
          </article>
          <article className="metric-card">
            <p className="eyebrow">DATA BOUNDARY</p>
            <p className="metric-value attention">SERVER ONLY</p>
            <p className="muted">No production or personal data is used.</p>
          </article>
          <article className="metric-card">
            <p className="eyebrow">EMBED</p>
            <p className="metric-value">CONTENT DRIVEN</p>
            <p className="muted">No fixed viewport-height dependency.</p>
          </article>
        </section>
      ) : (
        <StatePanel state={state} />
      )}

      <footer>
        <span className="status-dot" aria-hidden="true" />
        Generic UI proof only · No Notion writes · No production widget behavior
      </footer>
    </main>
  );
}

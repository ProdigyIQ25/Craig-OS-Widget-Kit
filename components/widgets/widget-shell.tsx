import type { ReactNode } from "react";
import type { WidgetTheme } from "@/types/widget";

export function WidgetShell({ code, title, theme, children, footer = "Craig OS · local-first · no Notion writes" }: {
  code: string; title: string; theme: WidgetTheme; children: ReactNode; footer?: string;
}) {
  return (
    <main className="widget-frame wave-widget" data-theme={theme}>
      <header className="widget-header">
        <div><p className="eyebrow">{code}</p><h1>{title}</h1></div>
      </header>
      {children}
      <footer><span className="status-dot" aria-hidden="true" />{footer}</footer>
    </main>
  );
}

export function StatusCard({ state, title, detail }: { state: "loading"|"empty"|"error"|"disabled"; title?: string; detail?: string }) {
  const copy = {
    loading: ["LOADING", "Resolving trusted state"],
    empty: ["EMPTY", "Nothing is currently populated"],
    error: ["ERROR", "The source is temporarily unavailable"],
    disabled: ["DISABLED", "This control is unavailable"],
  }[state];
  return <section className={`state-card state-${state}`} role={state === "error" ? "alert" : "status"} aria-busy={state === "loading"}>
    <p className="eyebrow">{copy[0]}</p><h2>{title ?? copy[1]}</h2><p className="muted">{detail ?? "No live state has been fabricated."}</p>
  </section>;
}

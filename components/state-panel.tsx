import type { WidgetState } from "@/types/widget";

const stateCopy: Record<Exclude<WidgetState, "success">, { eyebrow: string; title: string; detail: string }> = {
  loading: { eyebrow: "LOADING", title: "Preparing the view", detail: "The foundation is resolving a trusted server response." },
  empty: { eyebrow: "EMPTY", title: "Nothing to show", detail: "No canonical records are available for this demonstration state." },
  error: { eyebrow: "ERROR", title: "Data unavailable", detail: "The source could not be reached. No live state has been fabricated." },
  unauthorized: { eyebrow: "UNAUTHORIZED", title: "Access unavailable", detail: "This view requires an approved server-side access policy." },
  "not-configured": { eyebrow: "NOT CONFIGURED", title: "Connection not configured", detail: "The widget remains usable without a Notion connection." }
};

export function StatePanel({ state }: { state: Exclude<WidgetState, "success"> }) {
  const copy = stateCopy[state];

  if (state === "loading") {
    return (
      <section className="state-card" aria-busy="true" aria-label="Loading demonstration">
        <span className="skeleton skeleton-short" />
        <span className="skeleton skeleton-wide" />
        <span className="skeleton skeleton-medium" />
      </section>
    );
  }

  return (
    <section className={`state-card state-${state}`} role={state === "error" ? "alert" : "status"}>
      <p className="eyebrow">{copy.eyebrow}</p>
      <h2>{copy.title}</h2>
      <p className="muted">{copy.detail}</p>
    </section>
  );
}

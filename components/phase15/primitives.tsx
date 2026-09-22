"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { EmptyState } from "./empty-state";
import type { CommandRecord, ModulePayload } from "@/lib/phase15/ui-models";

export function SectionHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="p15-section-header">
      <div>
        <p className="p15-eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function ModuleCard({
  eyebrow,
  title,
  body,
  children,
  href,
  label,
}: {
  eyebrow: string;
  title: string;
  body?: string;
  children?: ReactNode;
  href?: string;
  label?: string;
}) {
  return (
    <article className="p15-module">
      <p className="p15-eyebrow">{eyebrow}</p>
      <h3>{title}</h3>
      {body ? <p>{body}</p> : null}
      {children}
      {href ? (
        <Link className="p15-inline-link" href={href}>
          {label ?? "Open"}
        </Link>
      ) : null}
    </article>
  );
}

export function MetricCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "attention" | "critical" | "healthy";
}) {
  return (
    <div className="p15-metric" data-tone={tone}>
      <p className="p15-eyebrow">{label}</p>
      <strong>{value}</strong>
    </div>
  );
}

export function RecordCard({
  record,
  onInspect,
}: {
  record: CommandRecord;
  onInspect?: (record: CommandRecord) => void;
}) {
  return (
    <div className="p15-record" data-tone={record.tone ?? "neutral"}>
      <div>
        <strong>{record.title}</strong>
        {record.detail && record.detail !== record.status ? <small>{record.detail}</small> : null}
        {record.status ? <span className="p15-status">{record.status}</span> : null}
      </div>
      {onInspect ? (
        <button type="button" className="p15-inspect" onClick={() => onInspect(record)} aria-label={`Inspect ${record.title}`}>
          Inspect
        </button>
      ) : (
        <DeepEditLink href={record.notionUrl} label="Open in Notion" />
      )}
    </div>
  );
}

export function RecordList({
  records,
  empty,
  onInspect,
  emptyContext,
  emptyBelongs,
  emptyWhy,
  emptyNext,
  emptyMode = "light",
}: {
  records: CommandRecord[];
  empty: string;
  onInspect?: (record: CommandRecord) => void;
  emptyContext?: "personal" | "business" | "spiritual";
  emptyBelongs?: string;
  emptyWhy?: string;
  emptyNext?: string;
  emptyMode?: "light" | "dark";
}) {
  if (!records.length) {
    if (emptyContext) {
      return (
        <EmptyState
          context={emptyContext}
          mode={emptyMode}
          belongs={emptyBelongs ?? empty}
          whyEmpty={emptyWhy ?? empty}
          nextAction={emptyNext ?? "Open Notion when you need to add the next record."}
        />
      );
    }
    return <p className="p15-empty-inline">{empty}</p>;
  }
  return (
    <div className="p15-record-list">
      {records.map((record) => (
        <RecordCard key={record.id} record={record} onInspect={onInspect} />
      ))}
    </div>
  );
}

export function LoadingState({ label = "Loading operating state" }: { label?: string }) {
  return (
    <section className="p15-loading" aria-busy="true" aria-live="polite">
      <p className="p15-eyebrow">{label}</p>
      <div className="p15-loading-grid">
        <div className="p15-loading-panel">
          <span className="p15-skeleton p15-skeleton-medium" />
          <span className="p15-skeleton p15-skeleton-wide" />
          <span className="p15-skeleton" />
        </div>
        <div className="p15-loading-panel">
          <span className="p15-skeleton p15-skeleton-medium" />
          <span className="p15-skeleton" />
          <span className="p15-skeleton p15-skeleton-wide" />
        </div>
      </div>
    </section>
  );
}

export function ErrorState({
  title = "Your current operating state could not load.",
  detail,
  onRetry,
  deepEditHref,
}: {
  title?: string;
  detail: string;
  onRetry?: () => void;
  deepEditHref?: string;
}) {
  return (
    <section className="p15-error" role="alert">
      <p className="p15-eyebrow">UPSTREAM UNAVAILABLE</p>
      <h2>{title}</h2>
      <p>{detail}</p>
      <p className="p15-muted">No replacement data is shown.</p>
      <div className="p15-actions">
        {onRetry ? (
          <button type="button" onClick={onRetry}>
            Retry
          </button>
        ) : null}
        {deepEditHref ? <DeepEditLink href={deepEditHref} /> : null}
      </div>
    </section>
  );
}

export function FreshnessIndicator({ at }: { at: string | null }) {
  if (!at) return null;
  const date = new Date(at);
  const label = Number.isNaN(date.getTime())
    ? at
    : date.toLocaleString("en-US", {
        timeZone: "America/Chicago",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZoneName: "short",
      });
  return <p className="p15-freshness">Updated {label}</p>;
}

export function QuickAction({
  label,
  href,
  disabled,
  note,
}: {
  label: string;
  href?: string;
  disabled?: boolean;
  note?: string;
}) {
  if (disabled || !href) {
    return (
      <button type="button" className="p15-quick" disabled title={note ?? "Not authorized yet"}>
        {label}
      </button>
    );
  }
  return (
    <Link className="p15-quick" href={href}>
      {label}
    </Link>
  );
}

export function DeepEditLink({
  href,
  label = "Open in Notion ↗",
}: {
  href: string;
  label?: string;
}) {
  return (
    <a className="p15-deep-edit" href={href} target="_blank" rel="noreferrer">
      {label}
    </a>
  );
}

export function ModuleView({
  module,
  context,
  onInspect,
}: {
  module: ModulePayload;
  context: "personal" | "business" | "spiritual";
  onInspect?: (record: CommandRecord) => void;
}) {
  if (module.state === "unavailable") {
    return (
      <ErrorState
        title={module.title}
        detail={module.body ?? "Canonical source unavailable."}
        deepEditHref={module.deepEditUrl}
      />
    );
  }
  if (module.state === "empty") {
    return (
      <EmptyState
        context={context}
        belongs={module.title}
        whyEmpty={module.body ?? "This store is reachable and has no records."}
        nextAction="Open Notion when you need to add the next record."
      />
    );
  }
  return <RecordList records={module.items as CommandRecord[]} empty="No records." onInspect={onInspect} />;
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { COMMAND_SURFACE_ROUTES } from "@/lib/phase15/routes";
import { davidCraigInstance } from "@/lib/phase15/config";
import { BUSINESS_NAV } from "@/lib/phase15/nav";
import type { BusinessCommandData, CommandRecord } from "@/lib/phase15/ui-models";
import { CaptureCommand } from "./capture-command";
import { AskCommand } from "./ask-command";
import { AppShell, CommandHeader, ContextSwitcher, NavigationRail } from "./shell";
import {
  DeepEditLink,
  ErrorState,
  FreshnessIndicator,
  LoadingState,
  MetricCard,
  RecordList,
  SectionHeader,
} from "./primitives";
import { RecordInspect } from "./record-inspect";
import { useAggregate } from "./use-aggregate";
import { EmptyState } from "./empty-state";

export type BusinessSurface =
  | "command"
  | "executive"
  | "revenue"
  | "projects"
  | "clients"
  | "decisions"
  | "issues"
  | "knowledge"
  | "workforce";

const TITLES: Record<BusinessSurface, { title: string; subtitle: string }> = {
  command: { title: "Business Command", subtitle: "Attention first. Then revenue and delivery." },
  executive: { title: "Executive", subtitle: "What requires leadership attention." },
  revenue: { title: "Revenue", subtitle: "Pipeline movement without invented forecasts." },
  projects: { title: davidCraigInstance.productOperationsLabel, subtitle: "Delivery and attached pressure." },
  clients: { title: "Clients", subtitle: "Companies and People, one model." },
  decisions: { title: "Decisions", subtitle: "Judgment that is still open." },
  issues: { title: "Issues", subtitle: "Operational risk and resolution state." },
  knowledge: { title: "Knowledge", subtitle: "Operating notes you will reuse." },
  workforce: { title: "Workforce", subtitle: "Digital Workers is not authorized yet." },
};

function toRecords(
  items: Array<{
    id: string;
    title: string;
    notionUrl: string;
    status?: string;
    stage?: string;
    severity?: string;
    role?: string;
    relationship?: string;
    value?: number;
    followUpDate?: string;
  }>,
  kind: string,
): CommandRecord[] {
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    kind,
    detail: [
      item.stage,
      item.severity,
      item.role,
      item.relationship,
      item.followUpDate ? `Follow-up ${item.followUpDate}` : null,
      typeof item.value === "number"
        ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(item.value)
        : null,
    ]
      .filter(Boolean)
      .join(" · ") || undefined,
    status: item.status ?? item.stage,
    tone: item.severity === "HIGH" || item.severity === "CRITICAL" ? "critical" : "neutral",
    notionUrl: item.notionUrl,
    context: "business",
  }));
}

export function BusinessCommandSurface({ surface }: { surface: BusinessSurface }) {
  const href = surface === "command" ? COMMAND_SURFACE_ROUTES.business : `/business/${surface}`;
  const meta = TITLES[surface];
  const { state, retry } = useAggregate<BusinessCommandData>("/api/os/business");
  const [inspect, setInspect] = useState<CommandRecord | null>(null);
  const data = state.status === "ready" ? state.data : null;

  const attention =
    data?.executive.state === "populated"
      ? (data.executive.items as CommandRecord[]).map((item) => ({
          ...item,
          kind: item.kind || "Attention",
          detail: item.detail ?? item.status,
        }))
      : [];

  return (
    <AppShell context="business">
      <CommandHeader
        eyebrow={davidCraigInstance.companyName}
        title={meta.title}
        subtitle={meta.subtitle}
        actions={
          <div className="p15-header-actions">
            <AskCommand surface="business" />
            <CaptureCommand surface="business" />
          </div>
        }
      />
      <ContextSwitcher current="business" />
      <NavigationRail items={BUSINESS_NAV} currentHref={href} />

      {state.status === "loading" ? <LoadingState label="Loading business operating state" /> : null}
      {state.status === "error" ? <ErrorState detail={state.error.message} onRetry={retry} /> : null}

      {data ? (
        <div className="p15-surface p15-enter">
          {surface === "command" ? (
            <>
              <section className="p15-primary p15-primary-business" aria-labelledby="biz-attention">
                <div className="p15-primary-copy">
                  <p className="p15-eyebrow">Requires attention</p>
                  <h2 id="biz-attention">{attention[0]?.title ?? "Executive is clear"}</h2>
                  <p className="p15-lead">
                    {attention[0]?.detail ?? data.executive.body ?? "No decisions or issues currently require leadership attention."}
                  </p>
                  <Link className="p15-inline-link" href={COMMAND_SURFACE_ROUTES.businessExecutive}>
                    Open Executive
                  </Link>
                </div>
                <RecordList
                  records={attention.slice(0, 4)}
                  empty={data.executive.body ?? "Executive is clear."}
                  emptyContext="business"
                  emptyBelongs="Nothing requires leadership attention."
                  emptyWhy="No decisions or issues currently require a call."
                  emptyNext="Return here when pressure appears."
                  onInspect={setInspect}
                />
              </section>

              <section className="p15-metrics p15-metrics-tight">
                <MetricCard label="Decisions" value={String(data.decisions.items.length)} tone={data.decisions.items.length ? "attention" : "healthy"} />
                <MetricCard label="Issues" value={String(data.issues.items.length)} tone={data.issues.items.length ? "critical" : "healthy"} />
                <MetricCard label="Opportunities" value={String(data.revenue.items.length)} tone="neutral" />
                <MetricCard label="Projects" value={String(data.projects.items.length)} tone="neutral" />
              </section>

              <section className="p15-lane-pair">
                <Link className="p15-lane p15-lane-business" href={COMMAND_SURFACE_ROUTES.businessRevenue}>
                  <p className="p15-eyebrow">Revenue</p>
                  <strong>{data.revenue.items[0]?.title ?? "No active opportunity"}</strong>
                  <span>
                    {data.revenue.items[0]
                      ? [data.revenue.items[0].stage, typeof data.revenue.items[0].value === "number" ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(data.revenue.items[0].value) : null].filter(Boolean).join(" · ")
                      : "Stage visibility only — no fabricated forecast"}
                  </span>
                </Link>
                <Link className="p15-lane" href={COMMAND_SURFACE_ROUTES.businessProjects}>
                  <p className="p15-eyebrow">Delivery</p>
                  <strong>{davidCraigInstance.productOperationsLabel}</strong>
                  <span>{data.projects.items[0]?.title ?? "Goals, projects, and issues"}</span>
                </Link>
              </section>

              <section className="p15-compact-links" aria-label="Supporting business context">
                <Link href={COMMAND_SURFACE_ROUTES.businessDecisions}>Decisions</Link>
                <Link href={COMMAND_SURFACE_ROUTES.businessIssues}>Issues</Link>
                <Link href={COMMAND_SURFACE_ROUTES.businessClients}>Clients</Link>
                <Link href={COMMAND_SURFACE_ROUTES.businessKnowledge}>Knowledge</Link>
              </section>
            </>
          ) : null}

          {surface === "executive" ? (
            <>
              <section className="p15-primary p15-primary-business" aria-labelledby="exec-tier1">
                <div className="p15-primary-copy">
                  <p className="p15-eyebrow">Tier 1 · Requires attention</p>
                  <h2 id="exec-tier1">{attention[0]?.title ?? "Nothing requires leadership attention"}</h2>
                </div>
                <RecordList
                  records={attention}
                  empty={data.executive.body ?? "Executive is clear."}
                  emptyContext="business"
                  emptyBelongs="Nothing requires leadership attention."
                  emptyWhy="No decisions or issues currently require a call."
                  emptyNext="This page remains finished when the queue is empty."
                  onInspect={setInspect}
                />
              </section>

              <section className="p15-exec-tiers">
                <div>
                  <p className="p15-kicker">Tier 2 · Decisions</p>
                  <RecordList
                    records={toRecords(data.decisions.items, "Decision")}
                    empty="No open decisions."
                    emptyContext="business"
                    emptyBelongs="No open decisions."
                    emptyWhy="Nothing is waiting for your decision right now."
                    emptyNext="Capture a decision only when a choice is required."
                    onInspect={setInspect}
                  />
                </div>
                <div>
                  <p className="p15-kicker">Tier 2 · Issues</p>
                  <RecordList
                    records={toRecords(data.issues.items, "Issue")}
                    empty="No open issues."
                    emptyContext="business"
                    emptyBelongs="No open issues."
                    emptyWhy="Operational risk is clear."
                    emptyNext="Log an issue only when it is blocking or at risk."
                    onInspect={setInspect}
                  />
                </div>
              </section>

              <section className="p15-lane-pair">
                <Link className="p15-lane" href={COMMAND_SURFACE_ROUTES.businessProjects}>
                  <p className="p15-eyebrow">Tier 3 · Delivery</p>
                  <strong>{data.projects.items[0]?.title ?? "No active project"}</strong>
                  <span>What is moving in product operations</span>
                </Link>
                <Link className="p15-lane p15-lane-business" href={COMMAND_SURFACE_ROUTES.businessRevenue}>
                  <p className="p15-eyebrow">Tier 3 · Revenue</p>
                  <strong>{data.revenue.items[0]?.title ?? "No revenue movement"}</strong>
                  <span>Pipeline without invented numbers</span>
                </Link>
              </section>
            </>
          ) : null}

          {surface === "revenue" ? (
            <section className="p15-revenue-premium">
              <header className="p15-today-head">
                <div>
                  <p className="p15-eyebrow">Pipeline movement</p>
                  <h2>{data.revenue.items[0]?.title ?? "Pipeline is quiet"}</h2>
                  <p className="p15-lead">
                    {data.revenue.items[0]
                      ? [data.revenue.items[0].stage, typeof data.revenue.items[0].value === "number" ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(data.revenue.items[0].value) : null].filter(Boolean).join(" · ")
                      : "Stage visibility appears without inventing a weighted forecast."}
                  </p>
                </div>
                <p className="p15-muted">No fabricated forecast</p>
              </header>

              <div className="p15-revenue-layout">
                <div>
                  <p className="p15-kicker">Opportunities</p>
                  <RecordList
                    records={toRecords(data.revenue.items, "Opportunity")}
                    empty={data.revenue.body ?? "No opportunities."}
                    emptyContext="business"
                    emptyBelongs="No opportunities."
                    emptyWhy="The pipeline is empty and remains finished without fake metrics."
                    emptyNext="Add an opportunity only when the deal is real."
                    onInspect={setInspect}
                  />
                </div>
                <div className="p15-revenue-side">
                  <article className="p15-context-card">
                    <p className="p15-eyebrow">Next action</p>
                    <strong>
                      {data.revenue.items.find((item) => item.followUpDate)?.title ?? "No dated follow-up"}
                    </strong>
                    <p>
                      {data.revenue.items.find((item) => item.followUpDate)?.followUpDate
                        ? `Follow up ${data.revenue.items.find((item) => item.followUpDate)?.followUpDate}`
                        : "Follow-up dates appear with opportunities when present."}
                    </p>
                  </article>
                  <div>
                    <p className="p15-kicker">Follow-up queue</p>
                    <RecordList
                      records={data.revenue.items
                        .filter((item) => Boolean(item.followUpDate))
                        .map((item) => ({
                          id: `follow-${item.id}`,
                          title: item.title,
                          kind: "Follow-up",
                          detail: `Due ${item.followUpDate}`,
                          status: item.stage,
                          notionUrl: item.notionUrl,
                          context: "business" as const,
                          tone: "attention" as const,
                        }))}
                      empty="No dated follow-ups."
                      emptyContext="business"
                      emptyBelongs="Follow-up queue is clear."
                      emptyWhy="Nothing is inferred beyond dated opportunity follow-ups."
                      emptyNext="Set a follow-up date when the next step is real."
                      onInspect={setInspect}
                    />
                  </div>
                  <div>
                    <p className="p15-kicker">Relationships</p>
                    <RecordList
                      records={toRecords(data.clients.items, "Client")}
                      empty={data.clients.body ?? "No clients loaded."}
                      emptyContext="business"
                      emptyBelongs="No relationship records."
                      emptyWhy="Companies and People share one client model."
                      emptyNext="Open Clients when relationship context is needed."
                      onInspect={setInspect}
                    />
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {surface === "projects" ? (
            <section className="p15-exec-tiers">
              <div>
                <SectionHeader eyebrow="Projects" title={davidCraigInstance.productOperationsLabel} />
                <RecordList
                  records={toRecords(data.projects.items, "Project")}
                  empty={data.projects.body ?? "No business projects."}
                  emptyContext="business"
                  emptyBelongs="No business projects."
                  emptyWhy="Product operations stay empty until live work exists."
                  emptyNext="Open a project when delivery has multiple steps."
                  onInspect={setInspect}
                />
              </div>
              <div>
                <SectionHeader eyebrow="Issues" title="Attached pressure" />
                <RecordList
                  records={toRecords(data.issues.items, "Issue")}
                  empty={data.issues.body ?? "No issues."}
                  emptyContext="business"
                  emptyBelongs="No issues."
                  emptyWhy="Operational issues appear with resolution state."
                  emptyNext="Log an issue only when it is blocking or at risk."
                  onInspect={setInspect}
                />
              </div>
            </section>
          ) : null}

          {surface === "clients" || surface === "decisions" || surface === "issues" || surface === "knowledge" ? (
            <section>
              <SectionHeader
                eyebrow={surface}
                title={
                  surface === "clients"
                    ? "Companies and People"
                    : surface === "decisions"
                      ? "Business decisions"
                      : surface === "issues"
                        ? "Operational issues"
                        : "Business Knowledge"
                }
              />
              <RecordList
                records={toRecords(
                  surface === "clients"
                    ? data.clients.items
                    : surface === "decisions"
                      ? data.decisions.items
                      : surface === "issues"
                        ? data.issues.items
                        : data.knowledge.items,
                  surface === "clients" ? "Client" : surface === "decisions" ? "Decision" : surface === "issues" ? "Issue" : "Knowledge",
                )}
                empty="No records."
                emptyContext="business"
                emptyBelongs="This lane is clear."
                emptyWhy="Nothing is loaded for this surface right now."
                emptyNext="Open Notion when a record is required."
                onInspect={setInspect}
              />
            </section>
          ) : null}

          {surface === "workforce" ? (
            <section>
              <EmptyState
                context="business"
                belongs="Workforce is not authorized yet."
                whyEmpty="Digital Workers remains disabled until that module is explicitly enabled."
                nextAction="Keep executive and product operations current while this surface stays honest."
              />
            </section>
          ) : null}

          <footer className="p15-footer">
            <FreshnessIndicator at={state.generatedAt} />
            <DeepEditLink href="https://www.notion.so" />
          </footer>
        </div>
      ) : null}

      <RecordInspect record={inspect} open={Boolean(inspect)} onClose={() => setInspect(null)} contextLabel="Business" />
    </AppShell>
  );
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { COMMAND_SURFACE_ROUTES } from "@/lib/phase15/routes";
import { davidCraigInstance } from "@/lib/phase15/config";
import type { CommandRecord, HomeCommandData } from "@/lib/phase15/ui-models";
import { CaptureCommand } from "./capture-command";
import { AskCommand } from "./ask-command";
import { AppShell, CommandHeader, ContextSwitcher } from "./shell";
import {
  DeepEditLink,
  ErrorState,
  FreshnessIndicator,
  LoadingState,
  RecordList,
  SectionHeader,
} from "./primitives";
import { RecordInspect } from "./record-inspect";
import { useAggregate } from "./use-aggregate";
import { EmptyState } from "./empty-state";

function asRecords(module: HomeCommandData[keyof HomeCommandData]): CommandRecord[] {
  if (!module || typeof module !== "object" || !("items" in module)) return [];
  const items = module.items;
  if (!Array.isArray(items)) return [];
  return items.filter((item): item is CommandRecord => typeof item === "object" && item !== null && "id" in item && "title" in item);
}

export function HomeCommandCenter() {
  const { state, retry } = useAggregate<HomeCommandData>("/api/os/home");
  const [inspect, setInspect] = useState<CommandRecord | null>(null);

  const data = state.status === "ready" ? state.data : null;
  const today = useMemo(() => (data ? asRecords(data.today) : []), [data]);
  const focus = useMemo(() => (data ? asRecords(data.focus) : []), [data]);
  const attention = useMemo(() => {
    if (!data) return [] as CommandRecord[];
    const fromAttention = asRecords(data.requiresAttention);
    if (fromAttention.length) return fromAttention;
    return [...today.filter((item) => item.tone === "attention" || item.tone === "critical"), ...asRecords(data.openDecisions)].slice(0, 5);
  }, [data, today]);
  const projects = useMemo(() => (data ? asRecords(data.activeProjects) : []), [data]);
  const revenue = useMemo(() => (data ? asRecords(data.revenueMovement) : []), [data]);
  const decisions = useMemo(() => (data ? asRecords(data.openDecisions) : []), [data]);

  return (
    <AppShell context="home">
      <CommandHeader
        eyebrow={davidCraigInstance.productName}
        title="Command Center"
        subtitle="What requires you. What you are focused on. What is moving."
        actions={
          <div className="p15-header-actions">
            <AskCommand surface="home" />
            <CaptureCommand surface="home" />
          </div>
        }
      />
      <ContextSwitcher current="home" />

      {state.status === "loading" ? <LoadingState label="Loading home command state" /> : null}
      {state.status === "error" ? <ErrorState detail={state.error.message} onRetry={retry} /> : null}

      {data ? (
        <div className="p15-enter">
          <section className="p15-primary" aria-labelledby="requires-david">
            <div className="p15-primary-copy">
              <p className="p15-eyebrow">Requires you</p>
              <h2 id="requires-david">Nothing should wait without a reason.</h2>
            </div>
            {attention.length ? (
              <RecordList records={attention} empty="" onInspect={setInspect} />
            ) : (
              <EmptyState
                context="personal"
                mode="dark"
                belongs="Nothing requires your attention right now."
                whyEmpty="No open tasks, decisions, or issues are asking for judgment."
                nextAction="When something needs you, it will surface here first."
              />
            )}
          </section>

          <section className="p15-home-secondary">
            <article className="p15-focus-hero">
              <p className="p15-eyebrow">Current focus</p>
              <h2>{focus[0]?.title ?? "No active focus"}</h2>
              <p className="p15-lead">
                {focus[0]?.detail ?? data.focus.body ?? "Choose one objective when you are ready to work deeply."}
              </p>
              <Link className="p15-inline-link" href={COMMAND_SURFACE_ROUTES.personalFocus}>
                {focus[0] ? "Enter Focus" : "Set Focus"}
              </Link>
            </article>

            <div className="p15-lane-pair">
              <Link className="p15-lane p15-lane-personal" href={COMMAND_SURFACE_ROUTES.personal}>
                <p className="p15-eyebrow">Personal</p>
                <strong>Personal OS</strong>
                <span>{today[0]?.title ? `Next · ${today[0].title}` : "Today, Focus, Goals, Reset"}</span>
              </Link>
              <Link className="p15-lane p15-lane-business" href={COMMAND_SURFACE_ROUTES.business}>
                <p className="p15-eyebrow">Business</p>
                <strong>{davidCraigInstance.companyName}</strong>
                <span>{revenue[0]?.title ? `Pulse · ${revenue[0].title}` : "Executive, Revenue, Delivery"}</span>
              </Link>
            </div>
          </section>

          <section className="p15-movement" aria-label="What is moving">
            <SectionHeader eyebrow="Movement" title="Projects, decisions, and revenue" />
            <div className="p15-movement-grid">
              <div>
                <p className="p15-kicker">Projects</p>
                <RecordList
                  records={projects.slice(0, 3)}
                  empty="No projects in motion."
                  emptyContext="personal"
                  emptyMode="dark"
                  emptyBelongs="No projects in motion."
                  emptyWhy="Active projects appear here when work has more than one step."
                  emptyNext="Open Personal or Business projects when delivery begins."
                  onInspect={setInspect}
                />
              </div>
              <div>
                <p className="p15-kicker">Decisions</p>
                <RecordList
                  records={decisions.slice(0, 3)}
                  empty="No open decisions."
                  emptyContext="business"
                  emptyMode="dark"
                  emptyBelongs="No open decisions."
                  emptyWhy="Nothing is waiting for your judgment right now."
                  emptyNext="Open Executive when a choice is required."
                  onInspect={setInspect}
                />
              </div>
              <div>
                <p className="p15-kicker">Revenue</p>
                <RecordList
                  records={revenue.slice(0, 3)}
                  empty="No revenue movement."
                  emptyContext="business"
                  emptyMode="dark"
                  emptyBelongs="No revenue movement."
                  emptyWhy="Opportunities appear without inventing forecasts."
                  emptyNext="Open Revenue when a deal needs attention."
                  onInspect={setInspect}
                />
              </div>
            </div>
            <Link className="p15-inline-link" href={COMMAND_SURFACE_ROUTES.personalWeeklyReset}>
              Weekly Reset · {davidCraigInstance.reviewDay}
            </Link>
          </section>

          <footer className="p15-footer">
            <FreshnessIndicator at={state.generatedAt} />
            <div className="p15-footer-links">
              <Link href={COMMAND_SURFACE_ROUTES.personalSpiritual}>Spiritual entry</Link>
              <DeepEditLink href="https://www.notion.so" label="Open in Notion ↗" />
            </div>
          </footer>
        </div>
      ) : null}

      <RecordInspect record={inspect} open={Boolean(inspect)} onClose={() => setInspect(null)} contextLabel="Home" />
    </AppShell>
  );
}

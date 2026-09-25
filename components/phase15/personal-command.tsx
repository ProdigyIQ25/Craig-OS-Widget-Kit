"use client";

import { useState } from "react";
import Link from "next/link";
import { COMMAND_SURFACE_ROUTES } from "@/lib/phase15/routes";
import { PERSONAL_NAV } from "@/lib/phase15/nav";
import type { CommandRecord, PersonalCommandData } from "@/lib/phase15/ui-models";
import { destinationKeyFromKind } from "@/lib/phase15/record-detail";
import { CaptureCommand } from "./capture-command";
import { AskCommand } from "./ask-command";
import { AppShell, CommandHeader, ContextSwitcher, NavigationRail } from "./shell";
import {
  DeepEditLink,
  ErrorState,
  FreshnessIndicator,
  LoadingState,
  ModuleCard,
  RecordList,
  SectionHeader,
} from "./primitives";
import { RecordInspect } from "./record-inspect";
import { useAggregate } from "./use-aggregate";
import { EmptyState } from "./empty-state";

export type PersonalSurface =
  | "command"
  | "today"
  | "focus"
  | "goals"
  | "projects"
  | "growth"
  | "brand"
  | "weekly-reset"
  | "knowledge"
  | "spiritual";

const TITLES: Record<PersonalSurface, { title: string; subtitle: string }> = {
  command: { title: "Personal Command", subtitle: "Now. Focus. Outcomes. Review." },
  today: { title: "Today", subtitle: "One clear execution path for the day." },
  focus: { title: "Focus", subtitle: "Goal → Project → Task. Quiet work only." },
  goals: { title: "Goals", subtitle: "Outcomes first." },
  projects: { title: "Projects", subtitle: "Multi-step personal work." },
  growth: { title: "Growth", subtitle: "Learning drawn from Personal Knowledge." },
  brand: { title: "Brand", subtitle: "Brand notes, kept intentional." },
  "weekly-reset": { title: "Weekly Reset", subtitle: "Clear. Reorient. Resolve. Choose." },
  knowledge: { title: "Knowledge", subtitle: "Notes you can operate from." },
  spiritual: { title: "Spiritual", subtitle: "Protected entry. Sensitive records stay out of general aggregates." },
};

function toRecords(
  items: Array<{ id: string; title: string; notionUrl: string; status?: string; dueDate?: string; priority?: string; summary?: string; type?: string }>,
  kind: string,
): CommandRecord[] {
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    kind,
    detail: [item.dueDate, item.priority, item.summary, item.type].filter(Boolean).join(" · ") || undefined,
    status: item.status,
    notionUrl: item.notionUrl,
    context: "personal" as const,
    tone: item.priority === "High" ? ("attention" as const) : ("neutral" as const),
    destinationKey: destinationKeyFromKind(kind, "personal") ?? undefined,
  }));
}

export function PersonalCommandSurface({ surface }: { surface: PersonalSurface }) {
  const href =
    surface === "command"
      ? COMMAND_SURFACE_ROUTES.personal
      : surface === "weekly-reset"
        ? COMMAND_SURFACE_ROUTES.personalWeeklyReset
        : `/personal/${surface}`;
  const meta = TITLES[surface];
  const { state, retry } = useAggregate<PersonalCommandData>("/api/os/personal");
  const [inspect, setInspect] = useState<CommandRecord | null>(null);
  const data = state.status === "ready" ? state.data : null;
  const todayRecords = data ? toRecords(data.today.items, "Task") : [];

  return (
    <AppShell context={surface === "spiritual" ? "spiritual" : "personal"}>
      <CommandHeader
        eyebrow="Personal OS"
        title={meta.title}
        subtitle={meta.subtitle}
        actions={
          <div className="p15-header-actions">
            <AskCommand surface={surface === "spiritual" ? "spiritual" : "personal"} />
            <CaptureCommand surface={surface === "spiritual" ? "spiritual" : "personal"} />
          </div>
        }
      />
      <ContextSwitcher current="personal" />
      <NavigationRail items={PERSONAL_NAV} currentHref={href} />

      {state.status === "loading" ? <LoadingState label="Loading personal operating state" /> : null}
      {state.status === "error" ? <ErrorState detail={state.error.message} onRetry={retry} /> : null}

      {data ? (
        <div className="p15-surface p15-enter">
          {surface === "command" ? (
            <>
              <section className="p15-primary p15-primary-personal" aria-labelledby="personal-now">
                <div className="p15-primary-copy">
                  <p className="p15-eyebrow">Now</p>
                  <h2 id="personal-now">{todayRecords[0]?.title ?? "Today is clear"}</h2>
                  <p className="p15-lead">
                    {todayRecords[0]?.detail ?? data.today.body ?? "No personal tasks require attention right now."}
                  </p>
                  <Link className="p15-inline-link" href={COMMAND_SURFACE_ROUTES.personalToday}>
                    Open Today
                  </Link>
                </div>
                <RecordList
                  records={todayRecords.slice(0, 4)}
                  empty={data.today.body ?? "No tasks require attention."}
                  emptyContext="personal"
                  emptyBelongs="Nothing needs you today."
                  emptyWhy="No personal tasks require attention right now."
                  emptyNext="When a commitment is real, it will appear here."
                  onInspect={setInspect}
                />
              </section>

              <section className="p15-home-secondary">
                <article className="p15-focus-hero">
                  <p className="p15-eyebrow">Focus</p>
                  <h2>{data.focus.items.goal?.title ?? "No active goal"}</h2>
                  <p className="p15-lead">{data.focus.items.project?.title ?? data.focus.body}</p>
                  <Link className="p15-inline-link" href={COMMAND_SURFACE_ROUTES.personalFocus}>
                    Enter Focus
                  </Link>
                </article>
                <div className="p15-lane-pair">
                  <Link className="p15-lane" href={COMMAND_SURFACE_ROUTES.personalGoals}>
                    <p className="p15-eyebrow">Goals</p>
                    <strong>{data.goals.items[0]?.title ?? "Name the outcome"}</strong>
                    <span>{data.goals.items[0]?.measureOfSuccess ?? "Outcomes before projects"}</span>
                  </Link>
                  <Link className="p15-lane" href={COMMAND_SURFACE_ROUTES.personalProjects}>
                    <p className="p15-eyebrow">Projects</p>
                    <strong>{data.projects.items[0]?.title ?? "No project in motion"}</strong>
                    <span>{data.projects.items[0]?.status ?? "Multi-step work only"}</span>
                  </Link>
                </div>
              </section>

              <section className="p15-movement">
                <SectionHeader eyebrow="Review" title="Growth, brand, knowledge, reset" />
                <div className="p15-compact-links">
                  <Link href={COMMAND_SURFACE_ROUTES.personalGrowth}>Growth</Link>
                  <Link href={COMMAND_SURFACE_ROUTES.personalBrand}>Brand</Link>
                  <Link href={COMMAND_SURFACE_ROUTES.personalKnowledge}>Knowledge</Link>
                  <Link href={COMMAND_SURFACE_ROUTES.personalWeeklyReset}>Weekly Reset</Link>
                </div>
              </section>
            </>
          ) : null}

          {surface === "today" ? (
            <section className="p15-today-exec">
              <header className="p15-today-head">
                <div>
                  <p className="p15-eyebrow">Today&apos;s attention</p>
                  <h2>{todayRecords[0]?.title ?? "Nothing is due for attention"}</h2>
                  <p className="p15-lead">{todayRecords[0]?.detail ?? data.today.body ?? "One clear execution path for the day."}</p>
                </div>
                <Link className="p15-inline-link" href={COMMAND_SURFACE_ROUTES.personalFocus}>
                  Move into Focus
                </Link>
              </header>
              <div className="p15-today-body">
                <article className="p15-context-card">
                  <p className="p15-eyebrow">Current work</p>
                  <strong>{data.focus.items.project?.title ?? "No active project"}</strong>
                  <p>{data.focus.items.goal?.title ?? "Today stays useful even when the project lane is empty."}</p>
                  <Link className="p15-inline-link" href={COMMAND_SURFACE_ROUTES.personalProjects}>
                    Review projects
                  </Link>
                </article>
                <div className="p15-today-queue">
                  <p className="p15-kicker">Next actions</p>
                  <RecordList
                    records={todayRecords}
                    empty={data.today.body ?? "Today is clear."}
                    emptyContext="personal"
                    emptyBelongs="Nothing is due for attention."
                    emptyWhy="This store is reachable and has no tasks requiring you right now."
                    emptyNext="Add only what you intend to finish."
                    onInspect={setInspect}
                  />
                  <div className="p15-today-foot">
                    <Link className="p15-inline-link" href={COMMAND_SURFACE_ROUTES.personalWeeklyReset}>
                      Weekly Reset
                    </Link>
                    <DeepEditLink href="https://www.notion.so" label="Open tasks in Notion ↗" />
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {surface === "focus" ? (
            <section className="p15-focus-stack">
              <article className="p15-focus-hero p15-focus-quiet">
                <p className="p15-eyebrow">Goal</p>
                <h2>{data.focus.items.goal?.title ?? "Choose one goal"}</h2>
                <p className="p15-lead">{data.focus.items.goal?.measureOfSuccess ?? data.focus.body}</p>
                {!data.focus.items.goal ? (
                  <Link className="p15-inline-link" href={COMMAND_SURFACE_ROUTES.personalGoals}>
                    Review goals
                  </Link>
                ) : null}
              </article>
              <div className="p15-focus-steps">
                <article className="p15-context-card">
                  <p className="p15-eyebrow">Project</p>
                  <strong>{data.focus.items.project?.title ?? "No active project"}</strong>
                  <p>{data.focus.items.project?.status ?? "The project should serve the goal."}</p>
                </article>
                <div>
                  <p className="p15-kicker">Tasks</p>
                  <RecordList
                    records={toRecords(data.focus.items.tasks, "Task")}
                    empty="No focus tasks yet."
                    emptyContext="personal"
                    emptyBelongs="Focus stays narrow."
                    emptyWhy="No supporting tasks are attached to the current objective."
                    emptyNext="Add the next smallest task when the work is clear."
                    onInspect={setInspect}
                  />
                </div>
              </div>
            </section>
          ) : null}

          {surface === "goals" ? (
            <section>
              <SectionHeader eyebrow="Goals" title="Personal outcomes" />
              <RecordList
                records={toRecords(data.goals.items, "Goal")}
                empty={data.goals.body ?? "No personal goals."}
                emptyContext="personal"
                emptyBelongs="No personal goals are loaded."
                emptyWhy="Outcomes appear here once they are named."
                emptyNext="Add a goal when you can name the result."
                onInspect={setInspect}
              />
            </section>
          ) : null}

          {surface === "projects" ? (
            <section>
              <SectionHeader eyebrow="Projects" title="Personal projects" />
              <RecordList
                records={toRecords(data.projects.items, "Project")}
                empty={data.projects.body ?? "No personal projects."}
                emptyContext="personal"
                emptyBelongs="No personal projects are loaded."
                emptyWhy="Projects belong to multi-step work."
                emptyNext="Open a project only when the work has more than one step."
                onInspect={setInspect}
              />
            </section>
          ) : null}

          {surface === "growth" || surface === "brand" || surface === "knowledge" ? (
            <section>
              <SectionHeader
                eyebrow={surface}
                title={surface === "growth" ? "Learning and reflection" : surface === "brand" ? "Brand knowledge" : "Personal Knowledge"}
              />
              <RecordList
                records={toRecords(
                  surface === "growth" ? data.growth.items : surface === "brand" ? data.brand.items : data.knowledge.items,
                  "Knowledge",
                )}
                empty="No records."
                emptyContext="personal"
                emptyBelongs={surface === "growth" ? "Growth is empty." : surface === "brand" ? "Brand is empty." : "No knowledge records."}
                emptyWhy="Capture only what you will reuse."
                emptyNext="Open Notion when an insight is worth keeping."
                onInspect={setInspect}
              />
            </section>
          ) : null}

          {surface === "weekly-reset" ? (
            <section className="p15-reset-grid">
              {[
                ["Clear", "Release what no longer belongs in the week."],
                ["Reorient", "Return to the goal that still matters."],
                ["Resolve", "Close decisions that have been waiting."],
                ["Choose", "Pick the one focus that earns next week."],
              ].map(([step, body]) => (
                <ModuleCard key={step} eyebrow="Weekly Reset" title={step} body={body} />
              ))}
            </section>
          ) : null}

          {surface === "spiritual" ? (
            <section className="p15-spiritual">
              <EmptyState
                context="spiritual"
                belongs="Spiritual entry is protected."
                whyEmpty="Sensitive spiritual records never appear in general Personal aggregates or Home summaries."
                nextAction="Open the Spiritual Center in Notion only when you intend to pray or journal."
              />
              <div className="p15-actions">
                <DeepEditLink href="https://www.notion.so" label="Open Spiritual Center in Notion ↗" />
              </div>
            </section>
          ) : null}

          <footer className="p15-footer">
            <FreshnessIndicator at={state.generatedAt} />
            <DeepEditLink href="https://www.notion.so" />
          </footer>
        </div>
      ) : null}

      <RecordInspect record={inspect} open={Boolean(inspect)} onClose={() => setInspect(null)} contextLabel="Personal" surface="personal" />
    </AppShell>
  );
}

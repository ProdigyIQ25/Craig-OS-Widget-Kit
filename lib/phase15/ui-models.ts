/**
 * Command-surface view models. UI binds to these shapes, never to raw Notion properties.
 * Synthetic fixtures are allowed only in tests.
 */

import type {
  CompanySummary,
  DecisionSummary,
  GoalSummary,
  IssueSummary,
  KnowledgeSummary,
  OpportunitySummary,
  PersonSummary,
  ProjectSummary,
  TaskSummary,
} from "./semantic";
import { PHASE15_CONTRACT_VERSION } from "./semantic";

export type ModuleState = "loading" | "empty" | "populated" | "unavailable" | "degraded";

export type CommandRecord = {
  id: string;
  title: string;
  kind: string;
  detail?: string;
  status?: string;
  tone?: "neutral" | "attention" | "critical" | "healthy";
  notionUrl: string;
  context: "personal" | "business";
};

export type ModulePayload<T = CommandRecord[]> = {
  state: ModuleState;
  title: string;
  body?: string;
  items: T;
  deepEditUrl?: string;
  retryable?: boolean;
};

export type HomeCommandData = {
  context: "home";
  ownerPrivate: true;
  today: ModulePayload;
  focus: ModulePayload;
  requiresAttention: ModulePayload;
  quickCapture: ModulePayload<{ kind: string; label: string; href: string }[]>;
  personalCommand: ModulePayload;
  businessCommand: ModulePayload;
  activeProjects: ModulePayload;
  openDecisions: ModulePayload;
  revenueMovement: ModulePayload;
  weeklyReset: ModulePayload;
  askCraigOs: ModulePayload<{ label: string; href: string; available: boolean }[]>;
  utility: ModulePayload<{ label: string; href: string }[]>;
};

export type PersonalCommandData = {
  context: "personal";
  today: ModulePayload<TaskSummary[]>;
  focus: ModulePayload<{
    goal?: GoalSummary | null;
    project?: ProjectSummary | null;
    tasks: TaskSummary[];
  }>;
  goals: ModulePayload<GoalSummary[]>;
  projects: ModulePayload<ProjectSummary[]>;
  growth: ModulePayload<KnowledgeSummary[]>;
  brand: ModulePayload<KnowledgeSummary[]>;
  weeklyReset: ModulePayload;
  knowledge: ModulePayload<KnowledgeSummary[]>;
  spiritualEntry: ModulePayload<{ label: string; href: string }[]>;
};

export type BusinessCommandData = {
  context: "business";
  executive: ModulePayload;
  revenue: ModulePayload<OpportunitySummary[]>;
  projects: ModulePayload<ProjectSummary[]>;
  clients: ModulePayload<(CompanySummary | PersonSummary)[]>;
  decisions: ModulePayload<DecisionSummary[]>;
  issues: ModulePayload<IssueSummary[]>;
  knowledge: ModulePayload<KnowledgeSummary[]>;
  workforce: ModulePayload;
};

export type AggregateEnvelope<T> =
  | {
      ok: true;
      data: T;
      source: "notion" | "fixture";
      version: typeof PHASE15_CONTRACT_VERSION;
      generatedAt: string;
      upstream: "AVAILABLE";
      error: null;
    }
  | {
      ok: false;
      data: null;
      source: "system";
      version: typeof PHASE15_CONTRACT_VERSION;
      generatedAt: string;
      upstream: "UNBOUND" | "UPSTREAM_UNAVAILABLE";
      error: { code: string; message: string };
    };

export function emptyModule(title: string, body: string, deepEditUrl?: string): ModulePayload {
  return { state: "empty", title, body, items: [], deepEditUrl };
}

export function unavailableModule(title: string, message: string): ModulePayload {
  return { state: "unavailable", title, body: message, items: [], retryable: true };
}

export function populatedModule(title: string, items: CommandRecord[], deepEditUrl?: string): ModulePayload {
  return { state: items.length ? "populated" : "empty", title, items, deepEditUrl };
}

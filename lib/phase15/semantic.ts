/**
 * Phase 15 semantic read models.
 * Command-surface views depend on these types, never on raw Notion property names.
 * Canonical Notion IDs and URLs are preserved when a live record is bound.
 */

export const PHASE15_CONTRACT_VERSION = "15.0.0-foundation" as const;

export type OsContext = "personal" | "business";

export type EvidenceClass =
  | "FACT"
  | "DAVID_DECISION"
  | "DAVID_COMMITMENT"
  | "SIGNAL"
  | "ASSUMPTION"
  | "CHATGPT_ANALYSIS"
  | "RECOMMENDATION";

export type RecordRef = {
  id: string;
  notionUrl: string;
};

export type TaskSummary = RecordRef & {
  title: string;
  context: OsContext;
  status?: string;
  dueDate?: string;
  priority?: string;
  relatedProjectId?: string;
};

export type GoalSummary = RecordRef & {
  title: string;
  context: OsContext;
  status?: string;
  targetDate?: string;
  measureOfSuccess?: string;
};

export type ProjectSummary = RecordRef & {
  title: string;
  context: OsContext;
  status?: string;
  relatedGoalId?: string;
  startDate?: string;
  targetDate?: string;
};

export type DecisionSummary = RecordRef & {
  title: string;
  context: OsContext;
  status?: string;
  outcome?: string;
  decisionDate?: string;
  relatedProjectId?: string;
  evidenceClass: "DAVID_DECISION" | "FACT";
};

export type KnowledgeSummary = RecordRef & {
  title: string;
  context: OsContext;
  type?: "Note" | "Meeting" | "Insight" | "Watch" | "Reference";
  summary?: string;
  observedDate?: string;
};

export type OpportunitySummary = RecordRef & {
  title: string;
  context: "business";
  stage?: string;
  relatedCompanyId?: string;
  value?: number;
  followUpDate?: string;
};

export type IssueSummary = RecordRef & {
  title: string;
  context: "business";
  type?: "Problem" | "Risk" | "Blocker" | "Escalation";
  status?: string;
  severity?: string;
  relatedProjectId?: string;
};

export type CompanySummary = RecordRef & {
  title: string;
  context: "business";
  domain?: string;
  relationship?: string;
  status?: string;
};

export type PersonSummary = RecordRef & {
  title: string;
  context: "business";
  email?: string;
  role?: string;
  relatedCompanyId?: string;
  status?: string;
  followUpDate?: string;
};

/** Spiritual records are not summary types. They never appear on Home or general Personal aggregates. */
export type SpiritualDestination = "prayer" | "spiritual-journal";

export type CaptureKind = "task" | "decision" | "knowledge" | "opportunity" | "issue" | "note";

export type CaptureContext = OsContext | "spiritual";

export function isRecommendation(value: EvidenceClass): boolean {
  return value === "RECOMMENDATION" || value === "CHATGPT_ANALYSIS" || value === "ASSUMPTION";
}

export function recommendationMayBecomeDecision(_value: EvidenceClass): false {
  return false;
}

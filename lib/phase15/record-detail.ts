/**
 * BU-15.9 record detail contracts — client-safe.
 * Mutations hand off to governed RECORD_UPDATE; drawer never writes Notion directly.
 */

import {
  type CaptureContext,
  type CaptureDestinationKey,
  isSpiritualDestination,
} from "./governed-action";

export const RECORD_DETAIL_VERSION = "15.9.0-record" as const;

export type RecordDetailErrorCode =
  | "RECORD_NOT_FOUND"
  | "UPSTREAM_UNAVAILABLE"
  | "ACCESS_DENIED"
  | "EDIT_NOT_ALLOWED"
  | "VALIDATION_FAILED"
  | "MUTATION_FAILED"
  | "READ_BACK_FAILED"
  | "CONTEXT_REQUIRED"
  | "CROSS_CONTEXT"
  | "RECORD_DESTINATION_MISMATCH"
  | "DESTINATION_UNBOUND";

export type RecordQuickEditField = "status" | "priority" | "dueDate" | "stage";

export type RecordRelationship = {
  label: string;
  recordId?: string;
  title?: string;
};

export type RecordAllowedActions = {
  quickEdit: boolean;
  fields: RecordQuickEditField[];
  deepEdit: true;
};

export type RecordDetail = {
  recordId: string;
  destinationKey: CaptureDestinationKey;
  context: CaptureContext;
  recordType: string;
  title: string;
  status?: string;
  priority?: string;
  stage?: string;
  dueDate?: string;
  summary?: string;
  relationships: RecordRelationship[];
  deepEditUrl: string;
  allowedActions: RecordAllowedActions;
  sensitivity: "standard" | "spiritual";
  version: typeof RECORD_DETAIL_VERSION;
};

const KIND_TO_DESTINATION: Record<string, (context: "personal" | "business" | "spiritual") => CaptureDestinationKey | null> = {
  task: (ctx) => (ctx === "business" ? "business.tasks" : ctx === "personal" ? "personal.tasks" : null),
  tasks: (ctx) => (ctx === "business" ? "business.tasks" : ctx === "personal" ? "personal.tasks" : null),
  goal: (ctx) => (ctx === "business" ? "business.goals" : ctx === "personal" ? "personal.goals" : null),
  goals: (ctx) => (ctx === "business" ? "business.goals" : ctx === "personal" ? "personal.goals" : null),
  project: (ctx) => (ctx === "business" ? "business.projects" : ctx === "personal" ? "personal.projects" : null),
  projects: (ctx) => (ctx === "business" ? "business.projects" : ctx === "personal" ? "personal.projects" : null),
  decision: (ctx) => (ctx === "business" ? "business.decisions" : ctx === "personal" ? "personal.decisions" : null),
  decisions: (ctx) => (ctx === "business" ? "business.decisions" : ctx === "personal" ? "personal.decisions" : null),
  knowledge: (ctx) => (ctx === "business" ? "business.knowledge" : ctx === "personal" ? "personal.knowledge" : null),
  opportunity: () => "business.opportunities",
  opportunities: () => "business.opportunities",
  issue: () => "business.issues",
  issues: () => "business.issues",
  company: () => "business.companies",
  companies: () => "business.companies",
  person: () => "business.people",
  people: () => "business.people",
  prayer: () => "personal.prayer",
  "spiritual journal": () => "personal.spiritual-journal",
  "spiritual-journal": () => "personal.spiritual-journal",
};

export function destinationKeyFromKind(
  kind: string,
  context: "personal" | "business" | "spiritual",
): CaptureDestinationKey | null {
  const key = kind.trim().toLowerCase();
  const mapper = KIND_TO_DESTINATION[key];
  if (!mapper) return null;
  return mapper(context);
}

export function recordAccessAllowed(input: {
  destinationKey: CaptureDestinationKey;
  context: CaptureContext;
  explicitSpiritual?: boolean;
}): { ok: true } | { ok: false; code: RecordDetailErrorCode; message: string } {
  if (isSpiritualDestination(input.destinationKey)) {
    if (input.context === "business") {
      return { ok: false, code: "ACCESS_DENIED", message: "Business cannot open Prayer or Spiritual Journal." };
    }
    if (input.context === "spiritual") return { ok: true };
    if (input.context === "personal" && input.explicitSpiritual === true) return { ok: true };
    return {
      ok: false,
      code: "ACCESS_DENIED",
      message: "Prayer and Spiritual Journal require explicit spiritual context.",
    };
  }
  if (input.context === "personal" && input.destinationKey.startsWith("business.")) {
    return { ok: false, code: "CROSS_CONTEXT", message: "Personal drawer cannot open Business records." };
  }
  if (input.context === "business" && input.destinationKey.startsWith("personal.")) {
    return { ok: false, code: "CROSS_CONTEXT", message: "Business drawer cannot open Personal records." };
  }
  if (input.context === "spiritual" && !isSpiritualDestination(input.destinationKey)) {
    return { ok: false, code: "CROSS_CONTEXT", message: "Spiritual context is limited to Prayer and Spiritual Journal." };
  }
  return { ok: true };
}

export function quickEditFieldsFor(destinationKey: CaptureDestinationKey): RecordQuickEditField[] {
  switch (destinationKey) {
    case "personal.tasks":
    case "business.tasks":
      return ["status", "priority", "dueDate"];
    case "business.opportunities":
      return ["stage", "dueDate"];
    case "business.issues":
      return ["status", "priority"];
    case "personal.projects":
    case "business.projects":
    case "personal.goals":
    case "business.goals":
    case "personal.decisions":
    case "business.decisions":
      return ["status"];
    default:
      return [];
  }
}

export function allowedActionsFor(destinationKey: CaptureDestinationKey): RecordAllowedActions {
  const fields = quickEditFieldsFor(destinationKey);
  return { quickEdit: fields.length > 0, fields, deepEdit: true };
}

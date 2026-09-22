/**
 * Governed action contract for BU-15.7 capture.
 * Client-safe types and destination policy. No Notion IDs or tokens.
 */

import { CANONICAL_DATABASES } from "./databases";
import type { CaptureContext, EvidenceClass } from "./semantic";

export type { CaptureContext };

export const GOVERNED_ACTION_VERSION = "15.7.0-capture" as const;

export type GovernedExecutionState =
  | "DRAFT"
  | "VALIDATED"
  | "AWAITING_AUTHORIZATION"
  | "AUTHORIZED"
  | "EXECUTING"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED";

export type CaptureDestinationKey =
  | "personal.goals"
  | "personal.projects"
  | "personal.tasks"
  | "personal.decisions"
  | "personal.knowledge"
  | "personal.prayer"
  | "personal.spiritual-journal"
  | "business.goals"
  | "business.projects"
  | "business.tasks"
  | "business.decisions"
  | "business.knowledge"
  | "business.companies"
  | "business.people"
  | "business.opportunities"
  | "business.issues";

export type GovernedCapturePayload = {
  title: string;
  status?: string;
  summary?: string;
  dueDate?: string;
  priority?: string;
  stage?: string;
  type?: string;
  severity?: string;
  domain?: string;
  email?: string;
  role?: string;
  relationship?: string;
  value?: string;
  relatedProjectId?: string;
  relatedGoalId?: string;
  relatedCompanyId?: string;
  relatedPersonId?: string;
};

export type GovernedCaptureRequest = {
  actionId: "CAPTURE_CREATE";
  context: CaptureContext;
  destinationKey: CaptureDestinationKey;
  payload: GovernedCapturePayload;
  evidence: EvidenceClass;
  searchedBeforeCreate: boolean;
  authorized: boolean;
  idempotencyKey: string;
  explicitSpiritualSave?: boolean;
};

export type MutationPreviewField = {
  label: string;
  value: string;
  source: "user" | "system";
};

export type MutationPreview = {
  destinationKey: CaptureDestinationKey;
  destinationLabel: string;
  recordType: string;
  context: CaptureContext;
  title: string;
  fields: MutationPreviewField[];
  relationships: string[];
  sensitivity: "standard" | "spiritual";
};

export type CaptureDestinationOption = {
  key: CaptureDestinationKey;
  label: string;
  context: CaptureContext;
  sensitivity: "standard" | "spiritual";
  titleProperty: string;
};

const PERSONAL_STANDARD: CaptureDestinationKey[] = [
  "personal.goals",
  "personal.projects",
  "personal.tasks",
  "personal.decisions",
  "personal.knowledge",
];

const BUSINESS_STANDARD: CaptureDestinationKey[] = [
  "business.goals",
  "business.projects",
  "business.tasks",
  "business.decisions",
  "business.knowledge",
  "business.companies",
  "business.people",
  "business.opportunities",
  "business.issues",
];

const SPIRITUAL: CaptureDestinationKey[] = ["personal.prayer", "personal.spiritual-journal"];

function optionFor(key: CaptureDestinationKey): CaptureDestinationOption | null {
  const database = CANONICAL_DATABASES.find((item) => item.key === key);
  if (!database) return null;
  return {
    key,
    label: database.name,
    context: database.sensitivity === "spiritual" ? "spiritual" : database.context,
    sensitivity: database.sensitivity,
    titleProperty: database.titleProperty,
  };
}

export function personalCaptureTargets(): CaptureDestinationOption[] {
  return PERSONAL_STANDARD.map(optionFor).filter((item): item is CaptureDestinationOption => Boolean(item));
}

export function businessCaptureTargets(): CaptureDestinationOption[] {
  return BUSINESS_STANDARD.map(optionFor).filter((item): item is CaptureDestinationOption => Boolean(item));
}

export function spiritualCaptureTargets(): CaptureDestinationOption[] {
  return SPIRITUAL.map(optionFor).filter((item): item is CaptureDestinationOption => Boolean(item));
}

export function destinationsForContext(context: CaptureContext, includeSpiritual = false): CaptureDestinationOption[] {
  if (context === "personal") {
    return includeSpiritual ? [...personalCaptureTargets(), ...spiritualCaptureTargets()] : personalCaptureTargets();
  }
  if (context === "business") return businessCaptureTargets();
  return spiritualCaptureTargets();
}

export function isSpiritualDestination(key: CaptureDestinationKey): boolean {
  return key === "personal.prayer" || key === "personal.spiritual-journal";
}

export function validateCapturePayload(input: {
  context: CaptureContext;
  destinationKey: CaptureDestinationKey;
  payload: GovernedCapturePayload;
  explicitSpiritualSave?: boolean;
}): { ok: true } | { ok: false; code: string; message: string } {
  const option = optionFor(input.destinationKey);
  if (!option) return { ok: false, code: "DESTINATION_UNKNOWN", message: "Unknown capture destination." };

  if (isSpiritualDestination(input.destinationKey)) {
    if (input.context !== "spiritual" || input.explicitSpiritualSave !== true) {
      return {
        ok: false,
        code: "SPIRITUAL_INTENT_REQUIRED",
        message: "Prayer and Spiritual Journal require explicit spiritual save intent.",
      };
    }
  } else if (input.context === "personal" && !input.destinationKey.startsWith("personal.")) {
    return { ok: false, code: "CROSS_CONTEXT", message: "Personal capture cannot target Business stores." };
  } else if (input.context === "business" && !input.destinationKey.startsWith("business.")) {
    return { ok: false, code: "CROSS_CONTEXT", message: "Business capture cannot target Personal stores." };
  } else if (input.context === "spiritual") {
    return { ok: false, code: "SPIRITUAL_INTENT_REQUIRED", message: "Spiritual context may only target Prayer or Spiritual Journal." };
  }

  const title = input.payload.title?.trim();
  if (!title) return { ok: false, code: "VALIDATION_ERROR", message: "A title is required." };
  if (title.length > 200) return { ok: false, code: "VALIDATION_ERROR", message: "Title must be 200 characters or fewer." };

  return { ok: true };
}

export function buildMutationPreview(input: {
  context: CaptureContext;
  destinationKey: CaptureDestinationKey;
  payload: GovernedCapturePayload;
}): MutationPreview | null {
  const option = optionFor(input.destinationKey);
  if (!option) return null;
  const fields: MutationPreviewField[] = [
    { label: option.titleProperty, value: input.payload.title.trim(), source: "user" },
  ];
  if (input.payload.status) fields.push({ label: "Status", value: input.payload.status, source: "user" });
  if (input.payload.summary) fields.push({ label: "Summary", value: input.payload.summary, source: "user" });
  if (input.payload.dueDate) fields.push({ label: "Due Date", value: input.payload.dueDate, source: "user" });
  if (input.payload.priority) fields.push({ label: "Priority", value: input.payload.priority, source: "user" });
  if (input.payload.stage) fields.push({ label: "Stage", value: input.payload.stage, source: "user" });
  if (input.payload.type) fields.push({ label: "Type", value: input.payload.type, source: "user" });
  if (input.payload.severity) fields.push({ label: "Severity", value: input.payload.severity, source: "user" });
  if (input.payload.value) fields.push({ label: "Value", value: input.payload.value, source: "user" });
  if (input.payload.domain) fields.push({ label: "Domain", value: input.payload.domain, source: "user" });
  if (input.payload.email) fields.push({ label: "Email", value: input.payload.email, source: "user" });
  if (input.payload.role) fields.push({ label: "Role", value: input.payload.role, source: "user" });
  if (input.payload.relationship) fields.push({ label: "Relationship", value: input.payload.relationship, source: "user" });

  const relationships: string[] = [];
  if (input.payload.relatedProjectId) relationships.push("Project relation (same context)");
  if (input.payload.relatedGoalId) relationships.push("Goal relation (same context)");
  if (input.payload.relatedCompanyId) relationships.push("Company relation (business)");
  if (input.payload.relatedPersonId) relationships.push("Person relation (business)");

  return {
    destinationKey: input.destinationKey,
    destinationLabel: option.label,
    recordType: option.label.replace(/^Personal |^Business /, ""),
    context: input.context,
    title: input.payload.title.trim(),
    fields,
    relationships,
    sensitivity: option.sensitivity,
  };
}

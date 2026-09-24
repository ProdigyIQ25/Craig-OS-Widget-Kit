/**
 * BU-15.9 governed record update — additive parallel to BU-15.7 Capture create.
 * Does not modify GovernedCaptureRequest. Writes still require authorizeWrite + CSRF.
 */

import {
  type CaptureContext,
  type CaptureDestinationKey,
  type MutationPreview,
  type MutationPreviewField,
  isSpiritualDestination,
} from "./governed-action";
import { CANONICAL_DATABASES } from "./databases";
import { allowedActionsFor, type RecordQuickEditField } from "./record-detail";

export const GOVERNED_UPDATE_VERSION = "15.9.0-update" as const;

export type GovernedUpdatePatch = {
  status?: string;
  priority?: string;
  dueDate?: string;
  stage?: string;
};

export type GovernedRecordUpdateRequest = {
  actionId: "RECORD_UPDATE";
  recordId: string;
  context: CaptureContext;
  destinationKey: CaptureDestinationKey;
  patch: GovernedUpdatePatch;
  /** Prior observed values for stale-edit awareness (optional). */
  baseline?: GovernedUpdatePatch & { title?: string };
  evidence: "DAVID_DECISION" | "DAVID_COMMITMENT" | "FACT";
  searchedBeforeCreate: boolean;
  authorized: boolean;
  idempotencyKey: string;
  explicitSpiritualSave?: boolean;
};

function optionLabel(key: CaptureDestinationKey): string {
  return CANONICAL_DATABASES.find((item) => item.key === key)?.name ?? key;
}

export function validateRecordUpdate(input: {
  context: CaptureContext;
  destinationKey: CaptureDestinationKey;
  recordId: string;
  patch: GovernedUpdatePatch;
  explicitSpiritualSave?: boolean;
}): { ok: true; fields: RecordQuickEditField[] } | { ok: false; code: string; message: string } {
  if (!input.recordId?.trim() || input.recordId.trim().length < 8) {
    return { ok: false, code: "VALIDATION_FAILED", message: "A record id is required." };
  }

  if (isSpiritualDestination(input.destinationKey)) {
    if (input.context !== "spiritual" || input.explicitSpiritualSave !== true) {
      return {
        ok: false,
        code: "SPIRITUAL_INTENT_REQUIRED",
        message: "Spiritual record edits require explicit spiritual authorization.",
      };
    }
  } else if (input.context === "personal" && !input.destinationKey.startsWith("personal.")) {
    return { ok: false, code: "CROSS_CONTEXT", message: "Personal cannot edit Business records." };
  } else if (input.context === "business" && !input.destinationKey.startsWith("business.")) {
    return { ok: false, code: "CROSS_CONTEXT", message: "Business cannot edit Personal records." };
  } else if (input.context === "spiritual") {
    return { ok: false, code: "SPIRITUAL_INTENT_REQUIRED", message: "Spiritual context may only edit Prayer or Spiritual Journal." };
  }

  const allowed = allowedActionsFor(input.destinationKey).fields;
  if (!allowed.length) {
    return { ok: false, code: "EDIT_NOT_ALLOWED", message: "This record class supports deep edit in Notion only." };
  }

  const requested = (Object.keys(input.patch) as (keyof GovernedUpdatePatch)[]).filter(
    (key) => typeof input.patch[key] === "string" && Boolean(input.patch[key]?.trim()),
  ) as RecordQuickEditField[];

  if (!requested.length) {
    return { ok: false, code: "VALIDATION_FAILED", message: "At least one editable field is required." };
  }

  for (const field of requested) {
    if (!allowed.includes(field)) {
      return { ok: false, code: "EDIT_NOT_ALLOWED", message: `Field ${field} is not editable for this record.` };
    }
    const value = input.patch[field]?.trim() ?? "";
    if (value.length > 200) {
      return { ok: false, code: "VALIDATION_FAILED", message: `${field} must be 200 characters or fewer.` };
    }
    if (field === "dueDate" && value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return { ok: false, code: "VALIDATION_FAILED", message: "Due date must be YYYY-MM-DD." };
    }
  }

  return { ok: true, fields: requested };
}

export function buildUpdatePreview(input: {
  context: CaptureContext;
  destinationKey: CaptureDestinationKey;
  title: string;
  patch: GovernedUpdatePatch;
  baseline?: GovernedUpdatePatch;
}): MutationPreview | null {
  const label = optionLabel(input.destinationKey);
  const fields: MutationPreviewField[] = [];
  const push = (name: string, next?: string, prior?: string) => {
    if (!next?.trim()) return;
    const value = prior?.trim() && prior.trim() !== next.trim() ? `${prior.trim()} → ${next.trim()}` : next.trim();
    fields.push({ label: name, value, source: "user" });
  };
  push("Status", input.patch.status, input.baseline?.status);
  push("Priority", input.patch.priority, input.baseline?.priority);
  push("Due Date", input.patch.dueDate, input.baseline?.dueDate);
  push("Stage", input.patch.stage, input.baseline?.stage);
  if (!fields.length) return null;

  return {
    destinationKey: input.destinationKey,
    destinationLabel: label,
    recordType: label.replace(/^Personal |^Business /, ""),
    context: input.context,
    title: input.title.trim() || label,
    fields,
    relationships: [],
    sensitivity: isSpiritualDestination(input.destinationKey) ? "spiritual" : "standard",
  };
}

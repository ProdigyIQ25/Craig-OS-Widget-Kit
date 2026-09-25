import "server-only";
import { actionRegistry, type ActionId } from "@/lib/actions/registry";

export class ActionValidationError extends Error {
  code = "VALIDATION_ERROR" as const;
}

const topLevelKeys = new Set(["actionId", "idempotencyKey", "input"]);
const safeKey = /^[A-Za-z0-9:_-]{16,128}$/;
const isoDate = /^\d{4}-\d{2}-\d{2}$/;

export function validateActionPayload(expectedId: ActionId, value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ActionValidationError("Invalid request body.");
  const body = value as Record<string, unknown>;
  if (Object.keys(body).some(key => !topLevelKeys.has(key))) throw new ActionValidationError("Unexpected request field.");
  if (body.actionId !== expectedId) throw new ActionValidationError("Action mismatch.");
  if (typeof body.idempotencyKey !== "string" || !safeKey.test(body.idempotencyKey)) throw new ActionValidationError("Invalid idempotency key.");
  if (!body.input || typeof body.input !== "object" || Array.isArray(body.input)) throw new ActionValidationError("Invalid action input.");
  const input = body.input as Record<string, unknown>;
  const definition = actionRegistry[expectedId];
  const allowed = new Map(definition.fields.map(field => [field.key, field]));
  if (Object.keys(input).some(key => !allowed.has(key))) throw new ActionValidationError("Unexpected action field.");
  const normalized: Record<string, string> = {};
  for (const field of definition.fields) {
    const raw = input[field.key];
    if (raw === undefined || raw === null || raw === "") {
      if (field.required) throw new ActionValidationError(`${field.label} is required.`);
      continue;
    }
    if (typeof raw !== "string") throw new ActionValidationError(`${field.label} must be text.`);
    const content = raw.trim();
    if (!content && field.required) throw new ActionValidationError(`${field.label} is required.`);
    if (!content) continue;
    if (field.maxLength && content.length > field.maxLength) throw new ActionValidationError(`${field.label} is too long.`);
    if (field.kind === "date") {
      const parsed=new Date(`${content}T00:00:00Z`);
      if (!isoDate.test(content) || Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0,10)!==content) throw new ActionValidationError(`${field.label} must be a valid date.`);
    }
    if (field.kind === "url") {
      let parsed: URL;
      try { parsed = new URL(content); } catch { throw new ActionValidationError(`${field.label} must be a valid HTTPS URL.`); }
      if (parsed.protocol !== "https:" || parsed.username || parsed.password) throw new ActionValidationError(`${field.label} must be a valid HTTPS URL.`);
    }
    if (field.kind === "select" && field.options && !field.options.includes(content)) throw new ActionValidationError(`${field.label} is not an allowed value.`);
    normalized[field.key] = content;
  }
  return { actionId: expectedId, idempotencyKey: body.idempotencyKey, input: normalized };
}

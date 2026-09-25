import { CANONICAL_DATABASES, databasesForContext, spiritualDatabases } from "./databases";
import type { CaptureKind } from "./semantic";

export const SPIRITUAL_LEAK_KEYS = [
  "prayer",
  "prayers",
  "spiritualJournal",
  "spiritual-journal",
  "journalEntry",
  "reflection",
] as const;

export type PrivacyViolation = {
  code: "CROSS_CONTEXT" | "SPIRITUAL_LEAK" | "CAPTURE_DESTINATION_FORBIDDEN" | "CONTEXT_REQUIRED";
  detail: string;
};

export function publicDatabases(context: "home"): { personal: string[]; business: string[] };
export function publicDatabases(context: "personal" | "business"): string[];
export function publicDatabases(context: "personal" | "business" | "home") {
  if (context === "home") {
    return {
      personal: databasesForContext("personal", false).map((database) => database.key),
      business: databasesForContext("business", false).map((database) => database.key),
    };
  }
  return databasesForContext(context, false).map((database) => database.key);
}

export function spiritualKeysExcludedFromPublicSurfaces(): string[] {
  return spiritualDatabases().map((database) => database.key);
}

export function findSpiritualLeak(value: unknown, path = "$"): PrivacyViolation | null {
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const found = findSpiritualLeak(value[index], `${path}[${index}]`);
      if (found) return found;
    }
    return null;
  }
  if (!value || typeof value !== "object") return null;
  for (const [key, child] of Object.entries(value)) {
    if ((SPIRITUAL_LEAK_KEYS as readonly string[]).includes(key)) {
      return { code: "SPIRITUAL_LEAK", detail: `${path}.${key}` };
    }
    if (typeof child === "string" && /personal\.prayer|personal\.spiritual-journal/i.test(child)) {
      return { code: "SPIRITUAL_LEAK", detail: `${path}.${key}` };
    }
    const found = findSpiritualLeak(child, `${path}.${key}`);
    if (found) return found;
  }
  return null;
}

const BUSINESS_ONLY: ReadonlySet<CaptureKind> = new Set(["opportunity", "issue"]);

export function captureDestination(input: {
  kind: CaptureKind;
  context?: "personal" | "business" | "spiritual" | null;
}): { ok: true; databaseKey: string } | { ok: false; violation: PrivacyViolation } {
  if (!input.context) {
    return { ok: false, violation: { code: "CONTEXT_REQUIRED", detail: "Capture requires an explicit context." } };
  }
  if (input.context === "spiritual") {
    return {
      ok: false,
      violation: { code: "CAPTURE_DESTINATION_FORBIDDEN", detail: "Spiritual writes are not part of general capture." },
    };
  }
  if (input.context === "personal" && BUSINESS_ONLY.has(input.kind)) {
    return { ok: false, violation: { code: "CROSS_CONTEXT", detail: `${input.kind} is business-only.` } };
  }
  const databaseKey = input.kind === "note" || input.kind === "knowledge"
    ? `${input.context}.knowledge`
    : input.kind === "opportunity"
      ? "business.opportunities"
      : input.kind === "issue"
        ? "business.issues"
        : `${input.context}.${input.kind}s`;
  const database = CANONICAL_DATABASES.find((item) => item.key === databaseKey);
  if (!database || database.context !== input.context || database.sensitivity === "spiritual") {
    return { ok: false, violation: { code: "CAPTURE_DESTINATION_FORBIDDEN", detail: databaseKey } };
  }
  return { ok: true, databaseKey };
}

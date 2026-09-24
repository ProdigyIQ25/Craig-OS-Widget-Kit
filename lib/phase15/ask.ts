/**
 * BU-15.8 Ask Craig OS — client-safe contracts.
 * Mutations hand off to BU-15.7 GovernedCaptureRequest; Ask never writes Notion.
 */

import type { CaptureContext, CaptureDestinationKey, GovernedCapturePayload } from "./governed-action";
import { isSpiritualDestination } from "./governed-action";

export const ASK_CONTRACT_VERSION = "15.8.0-ask" as const;

export type AskSurfaceContext = "home" | "personal" | "business" | "spiritual";

export type AskErrorCode =
  | "MODEL_UNAVAILABLE"
  | "RETRIEVAL_UNAVAILABLE"
  | "NO_MATCHING_DATA"
  | "AUTHORIZATION_REQUIRED"
  | "ACTION_VALIDATION_FAILED"
  | "ACTION_EXECUTION_FAILED"
  | "CONTEXT_AMBIGUOUS"
  | "VALIDATION_ERROR"
  | "WRITE_NOT_AUTHORIZED";

export type AskIntentKind =
  | "attention"
  | "focus"
  | "goals"
  | "tasks"
  | "projects"
  | "decisions"
  | "opportunities"
  | "issues"
  | "knowledge"
  | "people"
  | "companies"
  | "search"
  | "prepare_capture"
  | "spiritual_retrieve"
  | "ambiguous";

export type AskCitation = {
  key: string;
  recordId: string;
  title: string;
  notionUrl: string;
  sourceLabel: string;
};

export type AskActionProposal = {
  authorizationState: "AWAITING_AUTHORIZATION";
  actionType: "CAPTURE_CREATE";
  context: CaptureContext;
  destinationKey: CaptureDestinationKey;
  destinationLabel: string;
  title: string;
  payload: GovernedCapturePayload;
  rationale: string;
  explicitSpiritualSave?: boolean;
};

export type AskRequest = {
  message: string;
  surface: AskSurfaceContext;
  /** Optional explicit override; otherwise derived from surface + language. */
  context?: AskSurfaceContext;
};

export type AskResponse = {
  ok: boolean;
  answer: string;
  intent: AskIntentKind;
  context: AskSurfaceContext;
  citations: AskCitation[];
  proposal: AskActionProposal | null;
  errorCode: AskErrorCode | null;
  provider: "deterministic" | "llm";
  version: typeof ASK_CONTRACT_VERSION;
};

const SPIRITUAL_RETRIEVE =
  /\b(prayer|prayers|spiritual\s+journal|journal(?:ed|ing)?\s+spiritually|my\s+prayers|show\s+me\s+.*prayer)\b/i;
const SPIRITUAL_CAPTURE =
  /\b(save|add|record|capture|create)\b.*\b(prayer|spiritual\s+journal|journal)\b|\b(as\s+a\s+prayer|to\s+my\s+(?:spiritual\s+)?journal)\b/i;

const CREATE =
  /\b(create|add|capture|save|record|log|make)\b/i;
const TASK = /\b(task|todo|to-?do)\b/i;
const DECISION = /\bdecision\b/i;
const GOAL = /\bgoal\b/i;
const PROJECT = /\bproject\b/i;
const KNOWLEDGE = /\b(knowledge|note|insight|what\s+do\s+i\s+know|summarize|find\s+what)\b/i;
const OPPORTUNITY = /\b(opportunity|opportunities|deal|pipeline)\b/i;
const ISSUE = /\b(issue|blocker|risk|escalation)\b/i;
const PEOPLE = /\b(people|person|contact|relationship)\b/i;
const COMPANY = /\b(compan(?:y|ies)|client|account)\b/i;
const ATTENTION = /\b(attention|require|needs?\s+me|what\s+should\s+i|stalled|overdue|due)\b/i;
const FOCUS = /\b(focus|work\s+on\s+next|priority)\b/i;
const BUSINESS_HINT = /\b(business|revenue|pipeline|client|opportunity|issue|company)\b/i;
const PERSONAL_HINT = /\b(personal|my\s+life|family)\b/i;

export function hasExplicitSpiritualRetrieveIntent(message: string): boolean {
  return SPIRITUAL_RETRIEVE.test(message) || SPIRITUAL_CAPTURE.test(message);
}

export function classifyAskIntent(message: string, surface: AskSurfaceContext): AskIntentKind {
  const text = message.trim();
  if (!text) return "ambiguous";

  if (SPIRITUAL_CAPTURE.test(text) || (SPIRITUAL_RETRIEVE.test(text) && CREATE.test(text))) {
    return "prepare_capture";
  }
  if (SPIRITUAL_RETRIEVE.test(text)) return "spiritual_retrieve";

  if (CREATE.test(text) && (TASK.test(text) || DECISION.test(text) || GOAL.test(text) || PROJECT.test(text) || KNOWLEDGE.test(text) || OPPORTUNITY.test(text) || ISSUE.test(text) || PEOPLE.test(text) || COMPANY.test(text) || /\bthis\b/i.test(text))) {
    return "prepare_capture";
  }

  if (OPPORTUNITY.test(text)) return "opportunities";
  if (ISSUE.test(text)) return "issues";
  if (PEOPLE.test(text)) return "people";
  if (COMPANY.test(text)) return "companies";
  if (DECISION.test(text)) return "decisions";
  if (GOAL.test(text)) return "goals";
  if (PROJECT.test(text)) return "projects";
  if (TASK.test(text) || /\bdue\b|\boverdue\b/i.test(text)) return "tasks";
  if (KNOWLEDGE.test(text)) return "knowledge";
  if (FOCUS.test(text)) return "focus";
  if (ATTENTION.test(text)) return "attention";
  if (/\babout\b|\bfind\b|\bsearch\b|\bregarding\b/i.test(text)) return "search";

  if (surface === "spiritual") return "spiritual_retrieve";
  return "attention";
}

export function resolveAskOperatingContext(
  message: string,
  surface: AskSurfaceContext,
  explicit?: AskSurfaceContext,
): AskSurfaceContext {
  if (explicit) return explicit;
  if (hasExplicitSpiritualRetrieveIntent(message) || SPIRITUAL_CAPTURE.test(message)) return "spiritual";
  if (surface === "spiritual") return "spiritual";
  if (surface === "business") return "business";
  if (surface === "personal") return "personal";
  // home
  if (BUSINESS_HINT.test(message) && !PERSONAL_HINT.test(message)) return "business";
  if (PERSONAL_HINT.test(message) && !BUSINESS_HINT.test(message)) return "personal";
  return "home";
}

/** Source keys Ask may query for a given operating context + intent. */
export function askRetrievalKeys(
  context: AskSurfaceContext,
  intent: AskIntentKind,
  message: string,
): string[] {
  const spiritualOk = context === "spiritual" && hasExplicitSpiritualRetrieveIntent(message);

  if (intent === "spiritual_retrieve" || intent === "prepare_capture") {
    if (spiritualOk || (context === "spiritual" && hasExplicitSpiritualRetrieveIntent(message))) {
      if (/\bjournals?\b/i.test(message) && !/\bprayers?\b/i.test(message)) return ["personal.spiritual-journal"];
      if (/\bprayers?\b/i.test(message) && !/\bjournals?\b/i.test(message)) return ["personal.prayer"];
      return ["personal.prayer", "personal.spiritual-journal"];
    }
  }

  if (context === "spiritual" && !spiritualOk) {
    return [];
  }

  const personalStandard = [
    "personal.goals",
    "personal.projects",
    "personal.tasks",
    "personal.decisions",
    "personal.knowledge",
  ];
  const businessStandard = [
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

  const byIntent: Partial<Record<AskIntentKind, string[]>> = {
    goals: context === "business" ? ["business.goals"] : context === "personal" ? ["personal.goals"] : ["personal.goals", "business.goals"],
    tasks: context === "business" ? ["business.tasks"] : context === "personal" ? ["personal.tasks"] : ["personal.tasks", "business.tasks"],
    projects: context === "business" ? ["business.projects"] : context === "personal" ? ["personal.projects"] : ["personal.projects", "business.projects"],
    decisions: context === "business" ? ["business.decisions"] : context === "personal" ? ["personal.decisions"] : ["personal.decisions", "business.decisions"],
    knowledge: context === "business" ? ["business.knowledge"] : context === "personal" ? ["personal.knowledge"] : ["personal.knowledge", "business.knowledge"],
    opportunities: ["business.opportunities"],
    issues: ["business.issues"],
    people: ["business.people"],
    companies: ["business.companies"],
    focus: context === "business" ? ["business.tasks", "business.projects"] : context === "personal" ? ["personal.tasks", "personal.projects"] : ["personal.tasks", "business.tasks"],
    attention:
      context === "business"
        ? ["business.tasks", "business.issues", "business.decisions", "business.opportunities"]
        : context === "personal"
          ? ["personal.tasks", "personal.decisions", "personal.projects"]
          : ["personal.tasks", "business.tasks", "business.issues", "personal.decisions", "business.decisions", "business.opportunities"],
    search:
      context === "business"
        ? businessStandard
        : context === "personal"
          ? personalStandard
          : [...personalStandard, ...businessStandard],
  };

  if (intent === "prepare_capture") return [];

  let keys = byIntent[intent] ?? (context === "business" ? businessStandard : context === "personal" ? personalStandard : [...personalStandard, ...businessStandard]);

  // Hard exclusions
  keys = keys.filter((key) => {
    if (isSpiritualDestination(key as CaptureDestinationKey)) return spiritualOk;
    if (context === "personal" && key.startsWith("business.")) return false;
    if (context === "business" && key.startsWith("personal.")) return false;
    return true;
  });

  return keys;
}

export function extractCaptureTitle(message: string): string {
  const trimmed = message.trim();
  const patterns = [
    /(?:create|add|capture|save|record|log|make)\s+(?:a\s+)?(?:personal\s+|business\s+)?(?:task|decision|goal|project|note|knowledge|opportunity|issue|prayer)\s*(?:to|for|about|titled|:)?\s*(.+)$/i,
    /(?:save|add)\s+(?:this\s+)?(?:as\s+)?(?:a\s+)?(?:prayer|spiritual\s+journal)\s*:?\s*(.+)$/i,
  ];
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match?.[1]?.trim()) return match[1].trim().slice(0, 200);
  }
  return trimmed.slice(0, 200);
}

export function proposeCaptureDestination(
  message: string,
  context: AskSurfaceContext,
): { context: CaptureContext; destinationKey: CaptureDestinationKey; destinationLabel: string; explicitSpiritualSave?: boolean } | null {
  const spiritualCapture = SPIRITUAL_CAPTURE.test(message);
  if (spiritualCapture || (context === "spiritual" && CREATE.test(message))) {
    if (/\bjournal\b/i.test(message)) {
      return {
        context: "spiritual",
        destinationKey: "personal.spiritual-journal",
        destinationLabel: "Spiritual Journal",
        explicitSpiritualSave: true,
      };
    }
    return {
      context: "spiritual",
      destinationKey: "personal.prayer",
      destinationLabel: "Prayer",
      explicitSpiritualSave: true,
    };
  }

  const captureContext: CaptureContext =
    context === "business" ? "business" : context === "spiritual" ? "spiritual" : "personal";

  if (captureContext === "spiritual") return null;

  if (context === "home") {
    const impliesBusiness =
      BUSINESS_HINT.test(message) ||
      OPPORTUNITY.test(message) ||
      ISSUE.test(message) ||
      PEOPLE.test(message) ||
      COMPANY.test(message);
    const impliesPersonal = PERSONAL_HINT.test(message);
    if (impliesBusiness && impliesPersonal) return null;
    if (impliesBusiness) return proposeForZone(message, "business");
    if (impliesPersonal) return proposeForZone(message, "personal");
    // Create without zone on Home requires explicit Personal/Business.
    if (
      CREATE.test(message) &&
      (TASK.test(message) ||
        DECISION.test(message) ||
        GOAL.test(message) ||
        PROJECT.test(message) ||
        KNOWLEDGE.test(message) ||
        /\bnote\b/i.test(message) ||
        /\bthis\b/i.test(message))
    ) {
      return null;
    }
    return null;
  }

  return proposeForZone(message, captureContext === "business" ? "business" : "personal");
}

function proposeForZone(
  message: string,
  zone: "personal" | "business",
): { context: CaptureContext; destinationKey: CaptureDestinationKey; destinationLabel: string } {
  // Task is the default create target — check before broader CRM nouns.
  if (TASK.test(message)) {
    return {
      context: zone,
      destinationKey: zone === "business" ? "business.tasks" : "personal.tasks",
      destinationLabel: zone === "business" ? "Business Tasks" : "Personal Tasks",
    };
  }
  if (OPPORTUNITY.test(message)) {
    return { context: "business", destinationKey: "business.opportunities", destinationLabel: "Opportunities" };
  }
  if (ISSUE.test(message)) {
    return { context: "business", destinationKey: "business.issues", destinationLabel: "Issues" };
  }
  if (PEOPLE.test(message)) {
    return { context: "business", destinationKey: "business.people", destinationLabel: "People" };
  }
  if (COMPANY.test(message)) {
    return { context: "business", destinationKey: "business.companies", destinationLabel: "Companies" };
  }
  if (DECISION.test(message)) {
    return {
      context: zone,
      destinationKey: zone === "business" ? "business.decisions" : "personal.decisions",
      destinationLabel: zone === "business" ? "Business Decisions" : "Personal Decisions",
    };
  }
  if (GOAL.test(message)) {
    return {
      context: zone,
      destinationKey: zone === "business" ? "business.goals" : "personal.goals",
      destinationLabel: zone === "business" ? "Business Goals" : "Personal Goals",
    };
  }
  if (PROJECT.test(message)) {
    return {
      context: zone,
      destinationKey: zone === "business" ? "business.projects" : "personal.projects",
      destinationLabel: zone === "business" ? "Business Projects" : "Personal Projects",
    };
  }
  if (KNOWLEDGE.test(message) || /\bnote\b/i.test(message)) {
    return {
      context: zone,
      destinationKey: zone === "business" ? "business.knowledge" : "personal.knowledge",
      destinationLabel: zone === "business" ? "Business Knowledge" : "Personal Knowledge",
    };
  }
  return {
    context: zone,
    destinationKey: zone === "business" ? "business.tasks" : "personal.tasks",
    destinationLabel: zone === "business" ? "Business Tasks" : "Personal Tasks",
  };
}

/** Record content is data, never authority — strip instruction-like phrases for display only. */
export function sanitizeRecordText(value: string): string {
  return value
    .replace(/^\s*(system|assistant)\s*:?\s*/gi, "")
    .replace(/\b(ignore previous(?:\s+instructions?)?|authorize write|bypass(?:\s+authorization)?)\b\s*:?\s*/gi, "")
    .trim()
    .slice(0, 300);
}

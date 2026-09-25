import type { EvidenceClass } from "./semantic";
import { isRecommendation } from "./semantic";

export const OPERATOR_RULES = [
  "READ_BEFORE_WRITE",
  "SEARCH_BEFORE_CREATE",
  "UPDATE_BEFORE_CREATE",
  "AVOID_DUPLICATES",
  "SMALLEST_SUPPORTED_CHANGE",
  "ZERO_INVENTION",
] as const;

export type OperatorRule = (typeof OPERATOR_RULES)[number];

export const EVIDENCE_CLASSES: readonly EvidenceClass[] = [
  "FACT",
  "DAVID_DECISION",
  "DAVID_COMMITMENT",
  "SIGNAL",
  "ASSUMPTION",
  "CHATGPT_ANALYSIS",
  "RECOMMENDATION",
];

export type OperatorDecision = {
  allowed: boolean;
  code: "ALLOWED" | "CONTEXT_REQUIRED" | "SPIRITUAL_INTENT_REQUIRED" | "RECOMMENDATION_IS_NOT_DECISION" | "WRITE_NOT_AUTHORIZED";
  rule?: OperatorRule;
};

export function separateRecommendationFromDecision(evidence: EvidenceClass): OperatorDecision {
  if (isRecommendation(evidence)) {
    return { allowed: false, code: "RECOMMENDATION_IS_NOT_DECISION", rule: "ZERO_INVENTION" };
  }
  return { allowed: true, code: "ALLOWED" };
}

/**
 * Operator gates for writes. BU-15.7 allows live writes only when
 * searchedBeforeCreate and confirmed authorization are both true.
 */
export function authorizeWrite(input: {
  evidence: EvidenceClass;
  context?: "personal" | "business" | "spiritual" | null;
  destination?: "prayer" | "spiritual-journal" | "standard";
  explicitSave?: boolean;
  searchedBeforeCreate?: boolean;
  confirmed?: boolean;
}): OperatorDecision {
  const separated = separateRecommendationFromDecision(input.evidence);
  if (!separated.allowed) return separated;
  if (!input.context) return { allowed: false, code: "CONTEXT_REQUIRED", rule: "ZERO_INVENTION" };
  if (input.destination === "prayer" || input.destination === "spiritual-journal") {
    if (input.context !== "spiritual" || input.explicitSave !== true) {
      return { allowed: false, code: "SPIRITUAL_INTENT_REQUIRED", rule: "ZERO_INVENTION" };
    }
  }
  if (input.searchedBeforeCreate !== true) {
    return { allowed: false, code: "WRITE_NOT_AUTHORIZED", rule: "SEARCH_BEFORE_CREATE" };
  }
  if (input.confirmed !== true) {
    return { allowed: false, code: "WRITE_NOT_AUTHORIZED", rule: "READ_BEFORE_WRITE" };
  }
  return { allowed: true, code: "ALLOWED", rule: "SMALLEST_SUPPORTED_CHANGE" };
}

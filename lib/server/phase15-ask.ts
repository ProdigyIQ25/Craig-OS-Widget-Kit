import "server-only";
import {
  ASK_CONTRACT_VERSION,
  askRetrievalKeys,
  classifyAskIntent,
  extractCaptureTitle,
  hasExplicitSpiritualRetrieveIntent,
  proposeCaptureDestination,
  resolveAskOperatingContext,
  type AskActionProposal,
  type AskRequest,
  type AskResponse,
} from "@/lib/phase15/ask";
import { CANONICAL_DATABASES } from "@/lib/phase15/databases";
import { createAskProvider } from "@/lib/server/phase15-ask-provider";
import { AskRetrievalError, retrieveAskRecords } from "@/lib/server/phase15-ask-retrieve";

function proposalFromMessage(message: string, operating: AskRequest["surface"]): AskActionProposal | null {
  const resolved = proposeCaptureDestination(message, operating);
  if (!resolved) return null;

  const database = CANONICAL_DATABASES.find((item) => item.key === resolved.destinationKey);
  const title = extractCaptureTitle(message);
  if (!title) return null;

  return {
    authorizationState: "AWAITING_AUTHORIZATION",
    actionType: "CAPTURE_CREATE",
    context: resolved.context,
    destinationKey: resolved.destinationKey,
    destinationLabel: resolved.destinationLabel || database?.name || resolved.destinationKey,
    title,
    payload: { title },
    rationale: "Prepared from your Ask request. No write occurs until you authorize through Capture.",
    explicitSpiritualSave: resolved.explicitSpiritualSave,
  };
}

export async function runAskCraigOs(request: AskRequest): Promise<AskResponse> {
  const message = request.message?.trim() ?? "";
  if (!message) {
    return {
      ok: false,
      answer: "Ask a specific operating question, or request a capture to prepare.",
      intent: "ambiguous",
      context: request.surface,
      citations: [],
      proposal: null,
      errorCode: "VALIDATION_ERROR",
      provider: "deterministic",
      version: ASK_CONTRACT_VERSION,
    };
  }

  const context = resolveAskOperatingContext(message, request.surface, request.context);
  const intent = classifyAskIntent(message, context);

  if (intent === "prepare_capture") {
    if (context === "home" && !proposeCaptureDestination(message, "home")) {
      return {
        ok: false,
        answer: "That create request is ambiguous between Personal and Business. Specify the context, then authorize through Capture.",
        intent,
        context,
        citations: [],
        proposal: null,
        errorCode: "CONTEXT_AMBIGUOUS",
        provider: "deterministic",
        version: ASK_CONTRACT_VERSION,
      };
    }

    const proposal = proposalFromMessage(message, context);
    if (!proposal) {
      return {
        ok: false,
        answer: "I could prepare a capture, but the destination is ambiguous. Specify Personal or Business (or explicit spiritual intent).",
        intent,
        context,
        citations: [],
        proposal: null,
        errorCode: "CONTEXT_AMBIGUOUS",
        provider: "deterministic",
        version: ASK_CONTRACT_VERSION,
      };
    }

    if (
      (proposal.destinationKey === "personal.prayer" || proposal.destinationKey === "personal.spiritual-journal") &&
      !hasExplicitSpiritualRetrieveIntent(message) &&
      !proposal.explicitSpiritualSave
    ) {
      return {
        ok: false,
        answer: "Spiritual stores require explicit intent before preparation.",
        intent,
        context,
        citations: [],
        proposal: null,
        errorCode: "AUTHORIZATION_REQUIRED",
        provider: "deterministic",
        version: ASK_CONTRACT_VERSION,
      };
    }

    return {
      ok: true,
      answer: `Prepared a governed capture proposal for ${proposal.destinationLabel}. Review and authorize to write — nothing has been saved yet.`,
      intent,
      context,
      citations: [],
      proposal,
      errorCode: "AUTHORIZATION_REQUIRED",
      provider: "deterministic",
      version: ASK_CONTRACT_VERSION,
    };
  }

  if (intent === "spiritual_retrieve" && !hasExplicitSpiritualRetrieveIntent(message) && context !== "spiritual") {
    return {
      ok: false,
      answer: "Prayer and Spiritual Journal stay protected. Ask explicitly if you want those records.",
      intent,
      context,
      citations: [],
      proposal: null,
      errorCode: "AUTHORIZATION_REQUIRED",
      provider: "deterministic",
      version: ASK_CONTRACT_VERSION,
    };
  }

  if (intent === "spiritual_retrieve" && context !== "spiritual" && !hasExplicitSpiritualRetrieveIntent(message)) {
    return {
      ok: false,
      answer: "Spiritual retrieval requires explicit spiritual intent.",
      intent,
      context,
      citations: [],
      proposal: null,
      errorCode: "AUTHORIZATION_REQUIRED",
      provider: "deterministic",
      version: ASK_CONTRACT_VERSION,
    };
  }

  // Generic knowledge/search must never pull spiritual stores — askRetrievalKeys already enforces.
  const keys = askRetrievalKeys(context === "spiritual" && hasExplicitSpiritualRetrieveIntent(message) ? "spiritual" : context, intent, message);

  if (intent === "spiritual_retrieve" && !hasExplicitSpiritualRetrieveIntent(message)) {
    return {
      ok: false,
      answer: "Spiritual retrieval requires explicit intent.",
      intent,
      context,
      citations: [],
      proposal: null,
      errorCode: "AUTHORIZATION_REQUIRED",
      provider: "deterministic",
      version: ASK_CONTRACT_VERSION,
    };
  }

  try {
    const { records, unavailable } = await retrieveAskRecords(keys);
    if (!records.length && unavailable.length && unavailable.length === keys.length) {
      return {
        ok: false,
        answer: "Craig OS could not reach the needed records right now.",
        intent,
        context,
        citations: [],
        proposal: null,
        errorCode: "RETRIEVAL_UNAVAILABLE",
        provider: "deterministic",
        version: ASK_CONTRACT_VERSION,
      };
    }

    const provider = createAskProvider();
    const composed = await provider.compose({ message, intent, context, records });

    if (!records.length) {
      return {
        ok: true,
        answer: composed.answer,
        intent,
        context,
        citations: [],
        proposal: null,
        errorCode: "NO_MATCHING_DATA",
        provider: composed.provider,
        version: ASK_CONTRACT_VERSION,
      };
    }

    return {
      ok: true,
      answer: composed.answer,
      intent,
      context,
      citations: composed.citations,
      proposal: null,
      errorCode: null,
      provider: composed.provider,
      version: ASK_CONTRACT_VERSION,
    };
  } catch (error) {
    if (error instanceof AskRetrievalError && error.code === "NOT_CONFIGURED") {
      return {
        ok: false,
        answer: "Read credentials are not configured for Ask retrieval.",
        intent,
        context,
        citations: [],
        proposal: null,
        errorCode: "RETRIEVAL_UNAVAILABLE",
        provider: "deterministic",
        version: ASK_CONTRACT_VERSION,
      };
    }
    return {
      ok: false,
      answer: "Retrieval failed before an answer could be grounded.",
      intent,
      context,
      citations: [],
      proposal: null,
      errorCode: "RETRIEVAL_UNAVAILABLE",
      provider: "deterministic",
      version: ASK_CONTRACT_VERSION,
    };
  }
}

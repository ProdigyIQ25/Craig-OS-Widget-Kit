import "server-only";
import type { AskCitation, AskIntentKind, AskSurfaceContext } from "@/lib/phase15/ask";
import type { Phase15AskRecord } from "@/lib/server/phase15-ask-retrieve";

export type AskProviderInput = {
  message: string;
  intent: AskIntentKind;
  context: AskSurfaceContext;
  records: Phase15AskRecord[];
};

export type AskProviderResult = {
  answer: string;
  citations: AskCitation[];
  provider: "deterministic" | "llm";
};

export interface AskProvider {
  compose(input: AskProviderInput): Promise<AskProviderResult>;
}

function toCitations(records: Phase15AskRecord[], limit = 8): AskCitation[] {
  return records.slice(0, limit).map((record) => ({
    key: record.key,
    recordId: record.recordId,
    title: record.title,
    notionUrl: record.notionUrl,
    sourceLabel: record.sourceLabel,
  }));
}

function rankRecords(records: Phase15AskRecord[], message: string): Phase15AskRecord[] {
  const needle = message.toLowerCase();
  return [...records].sort((a, b) => {
    const aHit = needle && a.title.toLowerCase().includes(needle) ? 1 : 0;
    const bHit = needle && b.title.toLowerCase().includes(needle) ? 1 : 0;
    if (aHit !== bHit) return bHit - aHit;
    return a.title.localeCompare(b.title);
  });
}

export class DeterministicAskProvider implements AskProvider {
  async compose(input: AskProviderInput): Promise<AskProviderResult> {
    const ranked = rankRecords(input.records, input.message);
    const citations = toCitations(ranked);
    const contextLabel =
      input.context === "home"
        ? "operating"
        : input.context === "spiritual"
          ? "spiritual"
          : input.context;

    if (!ranked.length) {
      return {
        provider: "deterministic",
        citations: [],
        answer: `No matching ${contextLabel} records were found for that question.`,
      };
    }

    const lines = ranked.slice(0, 6).map((record, index) => {
      const meta = [record.status, record.detail].filter(Boolean).join(" · ");
      return `${index + 1}. ${record.title}${meta ? ` — ${meta}` : ""} (${record.sourceLabel})`;
    });

    const lead =
      input.intent === "attention"
        ? `Here is what currently requires attention in your ${contextLabel} context:`
        : input.intent === "focus"
          ? `Suggested focus candidates from your ${contextLabel} records:`
          : input.intent === "spiritual_retrieve"
            ? "Here are the spiritual records matching your explicit request:"
            : `Grounded from your ${contextLabel} Craig OS records:`;

    return {
      provider: "deterministic",
      citations,
      answer: `${lead}\n\n${lines.join("\n")}`,
    };
  }
}

/** Optional LLM path: only used when a key is present; never granted write tools. */
export class OptionalLlmAskProvider implements AskProvider {
  private fallback = new DeterministicAskProvider();

  async compose(input: AskProviderInput): Promise<AskProviderResult> {
    const key = process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY;
    if (!key) return this.fallback.compose(input);
    // Provider boundary reserved — refine phrasing only after deterministic grounding.
    // Until wired, fall back so certification does not require an LLM key.
    const grounded = await this.fallback.compose(input);
    return { ...grounded, provider: "deterministic" };
  }
}

export function createAskProvider(): AskProvider {
  return new OptionalLlmAskProvider();
}

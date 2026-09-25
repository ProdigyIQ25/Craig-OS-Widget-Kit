import "server-only";
import { resolveDataSourceId, templateSource } from "@/lib/phase15/template-sources";
import { sanitizeRecordText, type AskCitation } from "@/lib/phase15/ask";

const NOTION_VERSION = "2025-09-03";

export type Phase15AskRecord = AskCitation & {
  status?: string;
  detail?: string;
};

export class AskRetrievalError extends Error {
  code: "RETRIEVAL_UNAVAILABLE" | "NOT_CONFIGURED";
  constructor(code: "RETRIEVAL_UNAVAILABLE" | "NOT_CONFIGURED", message: string) {
    super(message);
    this.code = code;
  }
}

function titleFromProperties(properties: Record<string, unknown> | undefined): string {
  if (!properties) return "Untitled";
  for (const value of Object.values(properties)) {
    if (!value || typeof value !== "object") continue;
    const prop = value as { type?: string; title?: { plain_text?: string }[] };
    if (prop.type === "title" && Array.isArray(prop.title)) {
      const text = prop.title.map((part) => part.plain_text ?? "").join("").trim();
      if (text) return sanitizeRecordText(text);
    }
  }
  return "Untitled";
}

function selectFromProperties(properties: Record<string, unknown> | undefined, name: string): string | undefined {
  if (!properties) return undefined;
  const prop = properties[name] as { type?: string; select?: { name?: string } | null } | undefined;
  if (prop?.type === "select" && prop.select?.name) return prop.select.name;
  return undefined;
}

function richTextFromProperties(properties: Record<string, unknown> | undefined, name: string): string | undefined {
  if (!properties) return undefined;
  const prop = properties[name] as { type?: string; rich_text?: { plain_text?: string }[] } | undefined;
  if (prop?.type === "rich_text" && Array.isArray(prop.rich_text)) {
    const text = prop.rich_text.map((part) => part.plain_text ?? "").join("").trim();
    return text ? sanitizeRecordText(text) : undefined;
  }
  return undefined;
}

function readTokens(env: Record<string, string | undefined>): string[] {
  // Prefer dedicated read credential; also try Action Layer token for
  // query-only access when that integration holds the Phase 15 connections.
  const tokens: string[] = [];
  if (env.NOTION_TOKEN) tokens.push(env.NOTION_TOKEN);
  if (env.NOTION_ACTION_TOKEN && env.NOTION_ACTION_TOKEN !== env.NOTION_TOKEN) {
    tokens.push(env.NOTION_ACTION_TOKEN);
  }
  return tokens;
}

async function queryDataSourceOnce(
  dataSourceId: string,
  token: string,
  pageSize: number,
  withArchivedFilter: boolean,
): Promise<Response> {
  return fetch(`https://api.notion.com/v1/data_sources/${dataSourceId}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...(withArchivedFilter
        ? { filter: { property: "Archived", checkbox: { equals: false } } }
        : {}),
      page_size: pageSize,
    }),
    cache: "no-store",
  });
}

export async function queryPhase15DataSource(
  key: string,
  options: { pageSize?: number; env?: Record<string, string | undefined> } = {},
): Promise<Phase15AskRecord[]> {
  const env = options.env ?? process.env;
  const tokens = readTokens(env);
  if (!tokens.length) throw new AskRetrievalError("NOT_CONFIGURED", "Read-only Notion access is not configured.");

  const source = templateSource(key);
  const dataSourceId = resolveDataSourceId(key, env);
  if (!source || !dataSourceId) {
    throw new AskRetrievalError("RETRIEVAL_UNAVAILABLE", `Canonical source ${key} is not bound.`);
  }

  const pageSize = Math.min(options.pageSize ?? 20, 25);
  let lastStatus = 0;

  for (const token of tokens) {
    for (const withFilter of [true, false]) {
      const response = await queryDataSourceOnce(dataSourceId, token, pageSize, withFilter);
      lastStatus = response.status;
      if (!response.ok) continue;

      const payload = (await response.json()) as {
        results?: {
          id?: string;
          url?: string;
          properties?: Record<string, unknown>;
        }[];
      };

      return (payload.results ?? []).map((row) => {
        const id = row.id ?? "unknown";
        const title = titleFromProperties(row.properties);
        const status =
          selectFromProperties(row.properties, "Status") ??
          selectFromProperties(row.properties, "Stage") ??
          selectFromProperties(row.properties, "State");
        const detail =
          richTextFromProperties(row.properties, "Summary") ??
          richTextFromProperties(row.properties, "Next Action") ??
          richTextFromProperties(row.properties, "Outcome");
        return {
          key,
          recordId: id,
          title,
          notionUrl: row.url ?? `https://app.notion.com/${id.replace(/-/g, "")}`,
          sourceLabel: source.logicalName,
          status,
          detail,
        };
      });
    }
  }

  throw new AskRetrievalError("RETRIEVAL_UNAVAILABLE", `Source ${key} returned ${lastStatus}.`);
}

export async function retrieveAskRecords(
  keys: string[],
  options: { pageSize?: number; env?: Record<string, string | undefined> } = {},
): Promise<{ records: Phase15AskRecord[]; unavailable: string[] }> {
  const records: Phase15AskRecord[] = [];
  const unavailable: string[] = [];
  for (const key of keys) {
    try {
      const rows = await queryPhase15DataSource(key, options);
      records.push(...rows);
    } catch (error) {
      if (error instanceof AskRetrievalError && error.code === "NOT_CONFIGURED") throw error;
      unavailable.push(key);
    }
  }
  return { records, unavailable };
}

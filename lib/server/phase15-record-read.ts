import "server-only";
import type { CaptureContext, CaptureDestinationKey } from "@/lib/phase15/governed-action";
import { isSpiritualDestination } from "@/lib/phase15/governed-action";
import {
  RECORD_DETAIL_VERSION,
  allowedActionsFor,
  recordAccessAllowed,
  type RecordDetail,
  type RecordDetailErrorCode,
  type RecordRelationship,
} from "@/lib/phase15/record-detail";
import { templateSource } from "@/lib/phase15/template-sources";
import { sanitizeRecordText } from "@/lib/phase15/ask";

const NOTION_VERSION = "2025-09-03";

export class Phase15RecordReadError extends Error {
  constructor(
    message: string,
    public readonly code: RecordDetailErrorCode,
    public readonly upstreamStatus?: number,
  ) {
    super(message);
  }
}

function readTokens(env: Record<string, string | undefined>): string[] {
  const tokens: string[] = [];
  if (env.NOTION_TOKEN) tokens.push(env.NOTION_TOKEN);
  if (env.NOTION_ACTION_TOKEN && env.NOTION_ACTION_TOKEN !== env.NOTION_TOKEN) {
    tokens.push(env.NOTION_ACTION_TOKEN);
  }
  return tokens;
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

function dateFromProperties(properties: Record<string, unknown> | undefined, name: string): string | undefined {
  if (!properties) return undefined;
  const prop = properties[name] as { type?: string; date?: { start?: string } | null } | undefined;
  if (prop?.type === "date" && prop.date?.start) return prop.date.start.slice(0, 10);
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

function relationIds(properties: Record<string, unknown> | undefined, name: string): string[] {
  if (!properties) return [];
  const prop = properties[name] as { type?: string; relation?: { id?: string }[] } | undefined;
  if (prop?.type !== "relation" || !Array.isArray(prop.relation)) return [];
  return prop.relation.map((item) => item.id).filter((id): id is string => Boolean(id));
}

async function fetchNotionPage(recordId: string, token: string): Promise<Response> {
  return fetch(`https://api.notion.com/v1/pages/${recordId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
    },
    cache: "no-store",
  });
}

export async function readPhase15Record(input: {
  recordId: string;
  destinationKey: CaptureDestinationKey;
  context: CaptureContext;
  explicitSpiritual?: boolean;
  env?: Record<string, string | undefined>;
}): Promise<RecordDetail> {
  const env = input.env ?? process.env;
  const access = recordAccessAllowed({
    destinationKey: input.destinationKey,
    context: input.context,
    explicitSpiritual: input.explicitSpiritual === true || input.context === "spiritual",
  });
  if (!access.ok) {
    throw new Phase15RecordReadError(access.message, access.code);
  }

  const source = templateSource(input.destinationKey);
  if (!source) {
    throw new Phase15RecordReadError("Destination is not mapped.", "ACCESS_DENIED");
  }

  const tokens = readTokens(env);
  if (!tokens.length) {
    throw new Phase15RecordReadError("Read credentials are not configured.", "UPSTREAM_UNAVAILABLE");
  }

  let lastStatus = 0;
  type NotionPage = {
    id?: string;
    url?: string;
    properties?: Record<string, unknown>;
    parent?: { type?: string; data_source_id?: string; database_id?: string };
  };
  let page: NotionPage | null = null;

  for (const token of tokens) {
    const response = await fetchNotionPage(input.recordId, token);
    lastStatus = response.status;
    if (response.status === 404) continue;
    if (!response.ok) continue;
    page = (await response.json()) as NotionPage;
    break;
  }

  if (lastStatus === 404 && !page) {
    throw new Phase15RecordReadError("Record was not found.", "RECORD_NOT_FOUND", 404);
  }

  if (!page?.id || !page.properties) {
    throw new Phase15RecordReadError(`Upstream returned ${lastStatus || "error"}.`, "UPSTREAM_UNAVAILABLE", lastStatus);
  }

  const properties = page.properties;
  const status =
    selectFromProperties(properties, "Status") ??
    selectFromProperties(properties, "State") ??
    selectFromProperties(properties, "Stage");
  const priority = selectFromProperties(properties, "Priority") ?? selectFromProperties(properties, "Severity");
  const stage = selectFromProperties(properties, "Stage");
  const dueDate =
    dateFromProperties(properties, "Due Date") ??
    dateFromProperties(properties, "Follow-Up Date") ??
    dateFromProperties(properties, "Target Date") ??
    dateFromProperties(properties, "Date") ??
    dateFromProperties(properties, "Entry Date");
  const summary =
    richTextFromProperties(properties, "Summary") ??
    richTextFromProperties(properties, "Notes") ??
    richTextFromProperties(properties, "Reflection") ??
    richTextFromProperties(properties, "Rationale") ??
    richTextFromProperties(properties, "Next Action") ??
    richTextFromProperties(properties, "Theme") ??
    richTextFromProperties(properties, "Resolution");

  const relationships: RecordRelationship[] = [];
  const pushRelation = (label: string, ids: string[]) => {
    for (const id of ids.slice(0, 5)) {
      relationships.push({ label, recordId: id });
    }
  };
  pushRelation("Project", relationIds(properties, "Project"));
  pushRelation("Goal", relationIds(properties, "Goal"));
  pushRelation("Company", relationIds(properties, "Company"));
  pushRelation("Person", relationIds(properties, "Primary Contact"));
  pushRelation("Opportunity", relationIds(properties, "Opportunity"));
  pushRelation("Issue", relationIds(properties, "Issue"));

  // Never attach spiritual stores as relation previews.
  const safeRelationships = isSpiritualDestination(input.destinationKey)
    ? relationships
    : relationships.filter((item) => item.label !== "Prayer" && item.label !== "Spiritual Journal");

  const compactId = page.id.replaceAll("-", "");
  return {
    recordId: page.id,
    destinationKey: input.destinationKey,
    context: input.context,
    recordType: source.logicalName,
    title: titleFromProperties(properties),
    status: status ? sanitizeRecordText(status) : undefined,
    priority: priority ? sanitizeRecordText(priority) : undefined,
    stage: stage ? sanitizeRecordText(stage) : undefined,
    dueDate,
    summary,
    relationships: safeRelationships,
    deepEditUrl: page.url ?? `https://www.notion.so/${compactId}`,
    allowedActions: allowedActionsFor(input.destinationKey),
    sensitivity: source.sensitivity,
    version: RECORD_DETAIL_VERSION,
  };
}

import "server-only";
import type { CaptureDestinationKey, GovernedCapturePayload } from "@/lib/phase15/governed-action";
import { resolveDataSourceId, templateSource } from "@/lib/phase15/template-sources";

export class Phase15CaptureWriteError extends Error {
  constructor(
    message: string,
    public readonly code: "UPSTREAM_UNAVAILABLE" | "WRITE_FAILED" | "DESTINATION_UNBOUND",
    public readonly upstreamStatus?: number,
    public readonly upstreamHint?: string,
  ) {
    super(message);
  }
}

type NotionProperty =
  | { title: Array<{ text: { content: string } }> }
  | { rich_text: Array<{ text: { content: string } }> }
  | { select: { name: string } }
  | { date: { start: string } }
  | { number: number }
  | { url: string }
  | { email: string }
  | { checkbox: boolean }
  | { relation: Array<{ id: string }> };

function titleProp(content: string): NotionProperty {
  return { title: [{ text: { content: content.slice(0, 2000) } }] };
}

function textProp(content: string): NotionProperty {
  return { rich_text: [{ text: { content: content.slice(0, 2000) } }] };
}

function selectProp(name: string): NotionProperty {
  return { select: { name } };
}

function dateProp(start: string): NotionProperty {
  return { date: { start } };
}

function relationProp(id: string): NotionProperty {
  return { relation: [{ id }] };
}

function buildProperties(
  destinationKey: CaptureDestinationKey,
  payload: GovernedCapturePayload,
  titleProperty: string,
  propertyTypes: Readonly<Record<string, string>>,
): Record<string, NotionProperty> {
  const properties: Record<string, NotionProperty> = {
    [titleProperty]: titleProp(payload.title.trim()),
  };

  if (propertyTypes.Status === "select" && payload.status?.trim()) {
    properties.Status = selectProp(payload.status.trim());
  }
  if (propertyTypes.Archived === "checkbox") {
    properties.Archived = { checkbox: false };
  }

  if (payload.summary) {
    if (propertyTypes.Summary === "text") properties.Summary = textProp(payload.summary);
    else if (propertyTypes.Notes === "text") properties.Notes = textProp(payload.summary);
    else if (propertyTypes.Reflection === "text") properties.Reflection = textProp(payload.summary);
    else if (propertyTypes.Rationale === "text") properties.Rationale = textProp(payload.summary);
    else if (propertyTypes.Theme === "text") properties.Theme = textProp(payload.summary);
    else if (propertyTypes.Resolution === "text") properties.Resolution = textProp(payload.summary);
    else if (propertyTypes["Next Action"] === "text") properties["Next Action"] = textProp(payload.summary);
    else if (propertyTypes["Measure of Success"] === "text") properties["Measure of Success"] = textProp(payload.summary);
  }

  if (payload.dueDate) {
    if (propertyTypes["Due Date"] === "date") properties["Due Date"] = dateProp(payload.dueDate);
    else if (propertyTypes["Target Date"] === "date") properties["Target Date"] = dateProp(payload.dueDate);
    else if (propertyTypes["Follow-Up Date"] === "date") properties["Follow-Up Date"] = dateProp(payload.dueDate);
    else if (propertyTypes.Date === "date") properties.Date = dateProp(payload.dueDate);
    else if (propertyTypes["Entry Date"] === "date") properties["Entry Date"] = dateProp(payload.dueDate);
    else if (propertyTypes["Decision Date"] === "date") properties["Decision Date"] = dateProp(payload.dueDate);
    else if (propertyTypes["Observed Date"] === "date") properties["Observed Date"] = dateProp(payload.dueDate);
  }

  if (payload.priority && propertyTypes.Priority === "select") properties.Priority = selectProp(payload.priority);
  if (payload.stage && propertyTypes.Stage === "select") properties.Stage = selectProp(payload.stage);
  if (payload.type && propertyTypes.Type === "select") properties.Type = selectProp(payload.type);
  if (payload.severity && propertyTypes.Severity === "select") properties.Severity = selectProp(payload.severity);
  if (payload.relationship && propertyTypes.Relationship === "select") {
    properties.Relationship = selectProp(payload.relationship);
  }
  if (payload.domain && propertyTypes.Domain === "url") properties.Domain = { url: payload.domain };
  if (payload.email && propertyTypes.Email === "email") properties.Email = { email: payload.email };
  if (payload.role && propertyTypes.Role === "text") properties.Role = textProp(payload.role);
  if (payload.value && propertyTypes.Value === "number") {
    const number = Number(payload.value);
    if (Number.isFinite(number)) properties.Value = { number };
  }

  if (payload.relatedProjectId && propertyTypes.Project === "relation") {
    properties.Project = relationProp(payload.relatedProjectId);
  }
  if (payload.relatedGoalId && propertyTypes.Goal === "relation") {
    properties.Goal = relationProp(payload.relatedGoalId);
  }
  if (payload.relatedCompanyId && propertyTypes.Company === "relation") {
    properties.Company = relationProp(payload.relatedCompanyId);
  }
  if (payload.relatedPersonId && propertyTypes["Primary Contact"] === "relation") {
    properties["Primary Contact"] = relationProp(payload.relatedPersonId);
  } else if (payload.relatedPersonId && destinationKey === "business.people") {
    // no self-relation
  }

  if (destinationKey === "personal.prayer" && propertyTypes.State === "select" && payload.status?.trim()) {
    properties.State = selectProp(payload.status.trim());
  }

  return properties;
}

export async function createPhase15CaptureRecord(input: {
  destinationKey: CaptureDestinationKey;
  payload: GovernedCapturePayload;
  titleProperty: string;
}) {
  const token = process.env.NOTION_ACTION_TOKEN;
  if (!token) {
    throw new Phase15CaptureWriteError("Write connection is not configured.", "UPSTREAM_UNAVAILABLE");
  }

  const source = templateSource(input.destinationKey);
  if (!source) {
    throw new Phase15CaptureWriteError("Destination is not mapped.", "DESTINATION_UNBOUND");
  }

  const dataSourceId = resolveDataSourceId(input.destinationKey);
  if (!dataSourceId) {
    throw new Phase15CaptureWriteError("Destination data source is unbound.", "DESTINATION_UNBOUND");
  }

  const properties = buildProperties(
    input.destinationKey,
    input.payload,
    input.titleProperty,
    source.properties,
  );

  const response = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": "2025-09-03",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      parent: { type: "data_source_id", data_source_id: dataSourceId },
      properties,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const upstreamBody = await response.text().catch(() => "");
    const hint = upstreamBody
      .replace(/secret_[a-zA-Z0-9]+/g, "[redacted]")
      .replace(/ntn_[a-zA-Z0-9]+/g, "[redacted]")
      .slice(0, 280);
    throw new Phase15CaptureWriteError(
      `Notion create failed (${response.status}).`,
      "WRITE_FAILED",
      response.status,
      hint,
    );
  }

  const page = (await response.json()) as { id?: string; url?: string; created_time?: string };
  if (!page.id) {
    throw new Phase15CaptureWriteError("Notion returned an incomplete creation response.", "WRITE_FAILED");
  }

  const compactId = page.id.replaceAll("-", "");
  return {
    ok: true as const,
    destinationKey: input.destinationKey,
    recordId: page.id,
    recordUrl: page.url ?? `https://www.notion.so/${compactId}`,
    createdAt: page.created_time ?? new Date().toISOString(),
    title: input.payload.title.trim(),
  };
}

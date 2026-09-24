import "server-only";
import type { CaptureDestinationKey } from "@/lib/phase15/governed-action";
import type { GovernedUpdatePatch } from "@/lib/phase15/governed-update";
import { resolveDataSourceId, templateSource } from "@/lib/phase15/template-sources";
import { readPhase15Record } from "@/lib/server/phase15-record-read";
import type { CaptureContext } from "@/lib/phase15/governed-action";

const NOTION_VERSION = "2025-09-03";

export class Phase15RecordUpdateError extends Error {
  constructor(
    message: string,
    public readonly code: "UPSTREAM_UNAVAILABLE" | "WRITE_FAILED" | "DESTINATION_UNBOUND" | "MUTATION_FAILED" | "READ_BACK_FAILED",
    public readonly upstreamStatus?: number,
    public readonly upstreamHint?: string,
  ) {
    super(message);
  }
}

type NotionProperty =
  | { select: { name: string } }
  | { date: { start: string } };

function buildUpdateProperties(
  destinationKey: CaptureDestinationKey,
  patch: GovernedUpdatePatch,
  propertyTypes: Readonly<Record<string, string>>,
): Record<string, NotionProperty> {
  const properties: Record<string, NotionProperty> = {};

  if (patch.status?.trim()) {
    if (destinationKey === "personal.prayer" && propertyTypes.State === "select") {
      properties.State = { select: { name: patch.status.trim() } };
    } else if (propertyTypes.Status === "select") {
      properties.Status = { select: { name: patch.status.trim() } };
    }
  }

  if (patch.priority?.trim()) {
    if (propertyTypes.Priority === "select") {
      properties.Priority = { select: { name: patch.priority.trim() } };
    } else if (propertyTypes.Severity === "select") {
      properties.Severity = { select: { name: patch.priority.trim() } };
    }
  }

  if (patch.stage?.trim() && propertyTypes.Stage === "select") {
    properties.Stage = { select: { name: patch.stage.trim() } };
  }

  if (patch.dueDate?.trim()) {
    if (propertyTypes["Due Date"] === "date") properties["Due Date"] = { date: { start: patch.dueDate.trim() } };
    else if (propertyTypes["Follow-Up Date"] === "date") {
      properties["Follow-Up Date"] = { date: { start: patch.dueDate.trim() } };
    } else if (propertyTypes["Target Date"] === "date") {
      properties["Target Date"] = { date: { start: patch.dueDate.trim() } };
    }
  }

  return properties;
}

export async function updatePhase15Record(input: {
  recordId: string;
  destinationKey: CaptureDestinationKey;
  context: CaptureContext;
  patch: GovernedUpdatePatch;
  explicitSpiritualSave?: boolean;
  titleHint?: string;
}) {
  const token = process.env.NOTION_ACTION_TOKEN;
  if (!token) {
    throw new Phase15RecordUpdateError("Write connection is not configured.", "UPSTREAM_UNAVAILABLE");
  }

  const source = templateSource(input.destinationKey);
  if (!source) {
    throw new Phase15RecordUpdateError("Destination is not mapped.", "DESTINATION_UNBOUND");
  }
  if (!resolveDataSourceId(input.destinationKey)) {
    throw new Phase15RecordUpdateError("Destination data source is unbound.", "DESTINATION_UNBOUND");
  }

  const properties = buildUpdateProperties(input.destinationKey, input.patch, source.properties);
  if (!Object.keys(properties).length) {
    throw new Phase15RecordUpdateError("No writable properties in patch.", "MUTATION_FAILED");
  }

  const response = await fetch(`https://api.notion.com/v1/pages/${input.recordId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ properties }),
    cache: "no-store",
  });

  if (!response.ok) {
    const upstreamBody = await response.text().catch(() => "");
    const hint = upstreamBody
      .replace(/secret_[a-zA-Z0-9]+/g, "[redacted]")
      .replace(/ntn_[a-zA-Z0-9]+/g, "[redacted]")
      .slice(0, 280);
    throw new Phase15RecordUpdateError(
      `Notion update failed (${response.status}).`,
      "WRITE_FAILED",
      response.status,
      hint,
    );
  }

  const page = (await response.json()) as { id?: string; url?: string };
  if (!page.id) {
    throw new Phase15RecordUpdateError("Notion returned an incomplete update response.", "WRITE_FAILED");
  }

  let readBack;
  try {
    readBack = await readPhase15Record({
      recordId: page.id,
      destinationKey: input.destinationKey,
      context: input.context,
      explicitSpiritual: input.explicitSpiritualSave === true || input.context === "spiritual",
    });
  } catch {
    throw new Phase15RecordUpdateError("Update succeeded but read-back failed.", "READ_BACK_FAILED");
  }

  return {
    ok: true as const,
    recordId: page.id,
    recordUrl: page.url ?? readBack.deepEditUrl,
    title: readBack.title || input.titleHint || source.logicalName,
    patch: input.patch,
    readBack,
    updatedAt: new Date().toISOString(),
  };
}

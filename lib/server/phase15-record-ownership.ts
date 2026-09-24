import "server-only";
import type { CaptureDestinationKey } from "@/lib/phase15/governed-action";
import type { RecordDetailErrorCode } from "@/lib/phase15/record-detail";
import { resolveDataSourceId, templateSource } from "@/lib/phase15/template-sources";

const NOTION_VERSION = "2025-09-03";

export class Phase15RecordOwnershipError extends Error {
  constructor(
    message: string,
    public readonly code: RecordDetailErrorCode,
    public readonly upstreamStatus?: number,
  ) {
    super(message);
  }
}

export type NotionPageParent = {
  type?: string;
  data_source_id?: string;
  database_id?: string;
};

export type NotionPageForBinding = {
  id?: string;
  url?: string;
  properties?: Record<string, unknown>;
  parent?: NotionPageParent;
};

export type VerifiedRecordBinding = {
  recordId: string;
  destinationKey: CaptureDestinationKey;
  canonicalDataSourceId: string;
  page: NotionPageForBinding;
};

/** Normalize Notion UUIDs for equality (with/without dashes, any case). */
export function normalizeNotionId(value: string): string {
  return value.replaceAll("-", "").toLowerCase();
}

function readTokens(env: Record<string, string | undefined>): string[] {
  const tokens: string[] = [];
  if (env.NOTION_TOKEN) tokens.push(env.NOTION_TOKEN);
  if (env.NOTION_ACTION_TOKEN && env.NOTION_ACTION_TOKEN !== env.NOTION_TOKEN) {
    tokens.push(env.NOTION_ACTION_TOKEN);
  }
  return tokens;
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

/**
 * Extract authoritative parent identity from a Notion page.
 * Prefer data_source_id (2025-09-03); accept database_id as legacy parent shape.
 */
export function extractParentIdentity(parent: NotionPageParent | undefined): {
  dataSourceId?: string;
  databaseId?: string;
} {
  if (!parent || typeof parent !== "object") return {};
  if (parent.type === "data_source_id" && parent.data_source_id) {
    return { dataSourceId: parent.data_source_id };
  }
  if (parent.type === "database_id" && parent.database_id) {
    return { databaseId: parent.database_id };
  }
  // Some payloads omit type but still carry ids.
  if (parent.data_source_id) return { dataSourceId: parent.data_source_id };
  if (parent.database_id) return { databaseId: parent.database_id };
  return {};
}

/**
 * Compare actual Notion parent against the canonical destination mapping.
 * Fail closed when identity cannot be proven.
 */
export function parentMatchesDestination(
  parent: NotionPageParent | undefined,
  destinationKey: CaptureDestinationKey,
  env: Record<string, string | undefined> = process.env,
): boolean {
  const source = templateSource(destinationKey);
  const canonicalDs = resolveDataSourceId(destinationKey, env);
  if (!source || !canonicalDs) return false;

  const actual = extractParentIdentity(parent);
  if (actual.dataSourceId) {
    return normalizeNotionId(actual.dataSourceId) === normalizeNotionId(canonicalDs);
  }
  if (actual.databaseId) {
    return normalizeNotionId(actual.databaseId) === normalizeNotionId(source.databaseId);
  }
  return false;
}

/**
 * Server-side canonical ownership verifier.
 * Caller may assert destinationKey; the server proves the record's Notion parent
 * equals that destination's canonical data source (or database id).
 */
export async function verifyCanonicalRecordBinding(input: {
  recordId: string;
  destinationKey: CaptureDestinationKey;
  env?: Record<string, string | undefined>;
  /** Optional prefetched page (must include parent). When omitted, retrieves via read tokens. */
  page?: NotionPageForBinding;
}): Promise<VerifiedRecordBinding> {
  const env = input.env ?? process.env;
  const recordId = input.recordId.trim();
  if (!recordId) {
    throw new Phase15RecordOwnershipError("recordId is required.", "VALIDATION_FAILED");
  }

  const source = templateSource(input.destinationKey);
  const canonicalDataSourceId = resolveDataSourceId(input.destinationKey, env);
  if (!source || !canonicalDataSourceId) {
    throw new Phase15RecordOwnershipError("Destination is not bound.", "DESTINATION_UNBOUND");
  }

  let page = input.page ?? null;
  let lastStatus = 0;

  if (!page) {
    const tokens = readTokens(env);
    if (!tokens.length) {
      throw new Phase15RecordOwnershipError("Read credentials are not configured.", "UPSTREAM_UNAVAILABLE");
    }
    for (const token of tokens) {
      const response = await fetchNotionPage(recordId, token);
      lastStatus = response.status;
      if (response.status === 404) continue;
      if (!response.ok) continue;
      page = (await response.json()) as NotionPageForBinding;
      break;
    }
  }

  if (lastStatus === 404 && !page) {
    throw new Phase15RecordOwnershipError("Record was not found.", "RECORD_NOT_FOUND", 404);
  }
  if (!page?.id) {
    throw new Phase15RecordOwnershipError(
      `Upstream returned ${lastStatus || "error"}.`,
      "UPSTREAM_UNAVAILABLE",
      lastStatus || undefined,
    );
  }

  if (!parentMatchesDestination(page.parent, input.destinationKey, env)) {
    // Generic denial — do not leak alternate parent, title, or destination hints.
    throw new Phase15RecordOwnershipError(
      "Record does not belong to the requested destination.",
      "RECORD_DESTINATION_MISMATCH",
    );
  }

  return {
    recordId: page.id,
    destinationKey: input.destinationKey,
    canonicalDataSourceId,
    page,
  };
}

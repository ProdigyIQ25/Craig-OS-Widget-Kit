import { unboundAggregate, writeNotAuthorized, type AggregateFailure } from "./api";
import { PHASE15_CONTRACT_VERSION } from "./semantic";
import type { AggregateApiRoute } from "./routes";
import { resolveDataSourceId, templateSource } from "./template-sources";

export const READ_SEMANTICS = {
  empty: "AVAILABLE",
  loading: "PENDING",
  error: "UPSTREAM_UNAVAILABLE",
} as const;

export type SummaryIdentity = {
  id: string;
  title: string;
  notionUrl: string;
};

export type EmptyAggregate = {
  ok: true;
  data: {
    context: "personal" | "business";
    entity: string;
    items: SummaryIdentity[];
    emptyState: { belongs: string; whyEmpty: string; nextAction: string };
    deepEditUrl: string;
    readState: "empty";
  };
  source: "notion";
  version: typeof PHASE15_CONTRACT_VERSION;
  generatedAt: string;
  upstream: "AVAILABLE";
  error: null;
};

const ROUTE_SOURCES: Partial<Record<AggregateApiRoute, string>> = {
  "/api/os/personal/today": "personal.tasks",
  "/api/os/business/revenue": "business.opportunities",
  "/api/os/business/executive": "business.issues",
};

export function routeSourceKey(route: AggregateApiRoute): string | null {
  return ROUTE_SOURCES[route] ?? null;
}

export function emptyAggregate(input: {
  route: AggregateApiRoute;
  items?: SummaryIdentity[];
  now?: Date;
  env?: Record<string, string | undefined>;
  upstreamAvailable?: boolean;
}): EmptyAggregate | AggregateFailure {
  const key = routeSourceKey(input.route);
  const now = input.now ?? new Date();
  if (!key || !resolveDataSourceId(key, input.env)) return unboundAggregate(input.route, now);
  if (input.upstreamAvailable === false) {
    return {
      ...unboundAggregate(input.route, now),
      upstream: "UPSTREAM_UNAVAILABLE",
      error: {
        code: "UPSTREAM_UNAVAILABLE",
        message: `${input.route} could not read its bound Notion source. No records were invented.`,
      },
    };
  }
  const source = templateSource(key);
  if (!source || source.sensitivity === "spiritual") return unboundAggregate(input.route, now);
  return {
    ok: true,
    data: {
      context: source.zone,
      entity: source.logicalName,
      items: input.items ?? [],
      emptyState: {
        belongs: `Records for ${source.logicalName}.`,
        whyEmpty: "This store is reachable and has no records.",
        nextAction: "Add a record in Craig OS later, or open Notion to edit.",
      },
      deepEditUrl: source.notionUrl,
      readState: "empty",
    },
    source: "notion",
    version: PHASE15_CONTRACT_VERSION,
    generatedAt: now.toISOString(),
    upstream: "AVAILABLE",
    error: null,
  };
}

export function notionCredentialPresent(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.NOTION_TOKEN);
}

export function readAggregate(route: AggregateApiRoute, env: Record<string, string | undefined> = process.env, now = new Date()) {
  const key = routeSourceKey(route);
  if (!key || !resolveDataSourceId(key, env)) return unboundAggregate(route, now);
  return emptyAggregate({ route, env, upstreamAvailable: false, now });
}

export { writeNotAuthorized };

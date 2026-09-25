import type { AggregateApiRoute } from "./routes";
import { PHASE15_CONTRACT_VERSION } from "./semantic";

export type UpstreamCode = "UPSTREAM_UNAVAILABLE" | "WRITE_NOT_AUTHORIZED" | "ROUTE_NOT_FOUND";

export type AggregateFailure = {
  ok: false;
  data: null;
  source: "system";
  version: typeof PHASE15_CONTRACT_VERSION;
  generatedAt: string;
  upstream: "UNBOUND" | "UPSTREAM_UNAVAILABLE";
  error: {
    code: UpstreamCode;
    message: string;
  };
};

export function unboundAggregate(route: AggregateApiRoute, now = new Date()): AggregateFailure {
  return {
    ok: false,
    data: null,
    source: "system",
    version: PHASE15_CONTRACT_VERSION,
    generatedAt: now.toISOString(),
    upstream: "UNBOUND",
    error: {
      code: "UPSTREAM_UNAVAILABLE",
      message: `${route} has no bound canonical data source. Live records were not invented.`,
    },
  };
}

export function writeNotAuthorized(now = new Date()): AggregateFailure {
  return {
    ok: false,
    data: null,
    source: "system",
    version: PHASE15_CONTRACT_VERSION,
    generatedAt: now.toISOString(),
    upstream: "UNBOUND",
    error: {
      code: "WRITE_NOT_AUTHORIZED",
      message: "Foundation wave does not write to Notion.",
    },
  };
}

export function containsInventedRecords(body: AggregateFailure): boolean {
  return body.data !== null || body.ok !== false || body.error.code === "UPSTREAM_UNAVAILABLE" && body.upstream !== "UNBOUND";
}

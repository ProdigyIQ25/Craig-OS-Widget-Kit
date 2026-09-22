import { NextResponse } from "next/server";
import { unboundAggregate, writeNotAuthorized } from "./api";
import { readAggregate, routeSourceKey } from "./read-model";
import { AGGREGATE_API_ROUTES, type AggregateApiRoute } from "./routes";

const NO_STORE = { "Cache-Control": "private, no-store" };

export function aggregateResponse(route: AggregateApiRoute) {
  const body = routeSourceKey(route) ? readAggregate(route) : unboundAggregate(route);
  return NextResponse.json(body, { status: body.ok ? 200 : 503, headers: NO_STORE });
}

export function rejectWrite() {
  return NextResponse.json(writeNotAuthorized(), { status: 403, headers: NO_STORE });
}

export function isKnownAggregate(pathname: string): pathname is AggregateApiRoute {
  return (AGGREGATE_API_ROUTES as readonly string[]).includes(pathname);
}

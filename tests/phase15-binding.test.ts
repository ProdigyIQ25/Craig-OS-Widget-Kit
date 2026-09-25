import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { GET as todayGet } from "../app/api/os/personal/today/route";
import { GET as revenueGet } from "../app/api/os/business/revenue/route";
import { GET as executiveGet } from "../app/api/os/business/executive/route";
import { POST as capturePost } from "../app/api/os/capture/route";
import { findSpiritualLeak } from "../lib/phase15/privacy";
import { emptyAggregate } from "../lib/phase15/read-model";
import { READ_SEMANTICS } from "../lib/phase15/read-model";
import {
  boundSourceCount,
  crossZoneRelationCount,
  reconcileSchema,
  resolveDataSourceId,
  schemaScore,
  TEMPLATE_SOURCES,
} from "../lib/phase15/template-sources";

test("sixteen template sources bind from server configuration", () => {
  assert.equal(TEMPLATE_SOURCES.length, 16);
  assert.equal(boundSourceCount({}), 16);
  assert.equal(new Set(TEMPLATE_SOURCES.map((source) => source.envName)).size, 16);
  assert.equal(resolveDataSourceId("personal.tasks", { CRAIG_OS_NOTION_PERSONAL_TASKS_DATA_SOURCE_ID: "" }), null);
});

test("schema reconciliation has no drift or blockers and no cross-zone relations", () => {
  const score = schemaScore();
  assert.equal(score.drift, 0);
  assert.equal(score.blocker, 0);
  assert.equal(score.pass + score.safe, 16);
  assert.equal(reconcileSchema().some((row) => row.status === "BLOCKER"), false);
  assert.deepEqual(crossZoneRelationCount(), { personalToBusiness: 0, businessToPersonal: 0 });
});

test("reachable empty stores return 200 and do not include spiritual content", () => {
  for (const route of ["/api/os/personal/today", "/api/os/business/revenue", "/api/os/business/executive"] as const) {
    const body = emptyAggregate({ route, items: [], env: {} });
    assert.equal(body.ok, true);
    if (!body.ok) continue;
    assert.equal(body.upstream, "AVAILABLE");
    assert.equal(body.data.readState, "empty");
    assert.deepEqual(body.data.items, []);
    assert.equal(body.data.deepEditUrl.startsWith("https://app.notion.com/"), true);
    assert.equal(findSpiritualLeak(body), null);
    assert.equal(JSON.stringify(body).includes("NOTION_TOKEN"), false);
  }
});

test("missing binding and unreachable upstream fail closed", () => {
  const missing = emptyAggregate({
    route: "/api/os/personal/today",
    env: { CRAIG_OS_NOTION_PERSONAL_TASKS_DATA_SOURCE_ID: "" },
  });
  assert.equal(missing.ok, false);
  if (missing.ok) return;
  assert.equal(missing.data, null);
  assert.equal(missing.error.code, "UPSTREAM_UNAVAILABLE");

  const unavailable = emptyAggregate({ route: "/api/os/business/executive", upstreamAvailable: false });
  assert.equal(unavailable.ok, false);
  if (!unavailable.ok) assert.equal(unavailable.data, null);
});

test("route handlers stay fail-closed without a server credential and writes stay rejected", async () => {
  for (const response of [todayGet(), revenueGet(), executiveGet()]) {
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.equal(body.data, null);
    assert.equal(body.error.code, "UPSTREAM_UNAVAILABLE");
    assert.equal(JSON.stringify(body).includes("NOTION_TOKEN"), false);
  }
  const write = await capturePost();
  assert.equal(write.status, 403);
  assert.equal((await write.json()).error.code, "WRITE_NOT_AUTHORIZED");
});

test("client kernel does not contain data-source identifiers or tokens", () => {
  const kernel = readFileSync(new URL("../components/phase15/empty-state.tsx", import.meta.url), "utf8");
  assert.equal(kernel.includes("collection://"), false);
  assert.equal(kernel.includes("NOTION_TOKEN"), false);
  assert.equal(kernel.includes("template-sources"), false);
  assert.equal(READ_SEMANTICS.empty, "AVAILABLE");
  assert.equal(READ_SEMANTICS.error, "UPSTREAM_UNAVAILABLE");
});

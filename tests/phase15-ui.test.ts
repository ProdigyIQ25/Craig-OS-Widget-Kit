import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { findSpiritualLeak, publicDatabases } from "../lib/phase15/privacy";
import {
  BUSINESS_FIXTURE_EMPTY,
  BUSINESS_FIXTURE_POPULATED,
  HOME_FIXTURE_EMPTY,
  HOME_FIXTURE_POPULATED,
  PERSONAL_FIXTURE_EMPTY,
  PERSONAL_FIXTURE_POPULATED,
  envelope,
  unavailableEnvelope,
} from "../lib/phase15/fixtures";
import { COMMAND_SURFACE_ROUTES, routeContext } from "../lib/phase15/routes";
import { BUSINESS_NAV, PERSONAL_NAV } from "../lib/phase15/nav";

test("home fixture stays owner-private and excludes spiritual content", () => {
  assert.equal(HOME_FIXTURE_EMPTY.ownerPrivate, true);
  assert.equal(findSpiritualLeak(HOME_FIXTURE_EMPTY), null);
  assert.equal(findSpiritualLeak(HOME_FIXTURE_POPULATED), null);
  assert.equal(JSON.stringify(HOME_FIXTURE_POPULATED).toLowerCase().includes("prayer"), false);
  assert.equal(publicDatabases("home").personal.includes("personal.prayer"), false);
});

test("personal and business fixtures remain isolated", () => {
  assert.equal(PERSONAL_FIXTURE_POPULATED.context, "personal");
  assert.equal(BUSINESS_FIXTURE_POPULATED.context, "business");
  assert.equal(JSON.stringify(PERSONAL_FIXTURE_POPULATED).includes("Opportunity"), false);
  assert.equal(JSON.stringify(BUSINESS_FIXTURE_POPULATED).includes("personal."), false);
  assert.equal(findSpiritualLeak(PERSONAL_FIXTURE_EMPTY), null);
  assert.equal(findSpiritualLeak(BUSINESS_FIXTURE_EMPTY), null);
});

test("command surface routes cover home personal and business", () => {
  assert.equal(routeContext("/"), "home");
  assert.equal(routeContext("/personal/today"), "personal");
  assert.equal(routeContext("/personal/spiritual"), "spiritual");
  assert.equal(routeContext("/business/executive"), "business");
  assert.equal(COMMAND_SURFACE_ROUTES.personalFocus, "/personal/focus");
  assert.ok(PERSONAL_NAV.some((item) => item.href === COMMAND_SURFACE_ROUTES.personalSpiritual));
  assert.ok(BUSINESS_NAV.some((item) => item.id === "workforce"));
});

test("aggregate envelopes distinguish empty from unavailable", () => {
  const empty = envelope(HOME_FIXTURE_EMPTY);
  const unavailable = unavailableEnvelope();
  assert.equal(empty.ok, true);
  assert.equal(empty.upstream, "AVAILABLE");
  assert.equal(unavailable.ok, false);
  assert.equal(unavailable.data, null);
  assert.equal(unavailable.error.code, "UPSTREAM_UNAVAILABLE");
});

test("shared phase15 UI files do not embed secrets or collection ids", () => {
  const files = [
    "components/phase15/home-command.tsx",
    "components/phase15/personal-command.tsx",
    "components/phase15/business-command.tsx",
    "components/phase15/capture-command.tsx",
    "components/phase15/shell.tsx",
    "components/phase15/primitives.tsx",
  ];
  for (const file of files) {
    const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    assert.equal(source.includes("NOTION_TOKEN"), false);
    assert.equal(source.includes("collection://"), false);
    assert.equal(source.includes("template-sources"), false);
  }
});

import assert from "node:assert/strict";
import test from "node:test";
import { CANONICAL_DATABASES, databasesForContext, relationTargetsStayInsideContext } from "../lib/phase15/databases";
import { unboundAggregate, writeNotAuthorized } from "../lib/phase15/api";
import { captureDestination, findSpiritualLeak, publicDatabases } from "../lib/phase15/privacy";
import { AGGREGATE_API_ROUTES, RESPONSIVE_WIDTHS, routeContext } from "../lib/phase15/routes";
import { authorizeWrite, separateRecommendationFromDecision } from "../lib/phase15/operator";
import { davidCraigInstance } from "../lib/phase15/config";
import { CERTIFIED_WIDTHS, FORBIDDEN_VISUAL_PATTERNS, PALETTES } from "../lib/phase15/design/tokens";
import { recommendationMayBecomeDecision } from "../lib/phase15/semantic";

test("maps all 16 canonical databases and no cross-context relations", () => {
  assert.equal(CANONICAL_DATABASES.length, 16);
  assert.deepEqual(CANONICAL_DATABASES.map((database) => database.number), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
  assert.equal(new Set(CANONICAL_DATABASES.map((database) => database.key)).size, 16);
  for (const database of CANONICAL_DATABASES) {
    assert.equal(database.binding, "UNBOUND");
    assert.equal(database.notionDataSourceId, null);
    assert.equal(relationTargetsStayInsideContext(database), true);
    assert.ok(database.properties.some((property) => property.name === database.titleProperty));
  }
  assert.deepEqual(databasesForContext("personal").map((database) => database.key), [
    "personal.goals",
    "personal.projects",
    "personal.tasks",
    "personal.decisions",
    "personal.knowledge",
  ]);
  assert.equal(databasesForContext("business").some((database) => database.context === "personal"), false);
});

test("personal and business aggregates cannot see the other zone or spiritual stores", () => {
  const home = publicDatabases("home");
  assert.equal(home.personal.includes("personal.prayer"), false);
  assert.equal(home.business.includes("personal.tasks"), false);
  assert.equal(findSpiritualLeak({ today: [], prayer: "private" })?.code, "SPIRITUAL_LEAK");
  assert.equal(findSpiritualLeak({ today: [], focus: null }), null);
  assert.equal(captureDestination({ kind: "opportunity", context: "personal" }).ok, false);
  assert.equal(captureDestination({ kind: "task", context: null }).ok, false);
  assert.equal(captureDestination({ kind: "task", context: "spiritual" }).ok, false);
  const businessTask = captureDestination({ kind: "task", context: "business" });
  assert.equal(businessTask.ok && businessTask.databaseKey, "business.tasks");
});

test("aggregate contracts fail closed instead of inventing records", () => {
  for (const route of AGGREGATE_API_ROUTES) {
    const body = unboundAggregate(route, new Date("2026-09-18T22:00:00.000Z"));
    assert.equal(body.ok, false);
    assert.equal(body.data, null);
    assert.equal(body.error.code, "UPSTREAM_UNAVAILABLE");
    assert.equal(JSON.stringify(body).includes("David Craig"), false);
  }
  assert.equal(writeNotAuthorized().error.code, "WRITE_NOT_AUTHORIZED");
});

test("operator contract refuses recommendations, ambiguous context, and unconfirmed writes", () => {
  assert.equal(recommendationMayBecomeDecision("RECOMMENDATION"), false);
  assert.equal(separateRecommendationFromDecision("CHATGPT_ANALYSIS").code, "RECOMMENDATION_IS_NOT_DECISION");
  assert.equal(authorizeWrite({ evidence: "FACT" }).code, "CONTEXT_REQUIRED");
  assert.equal(authorizeWrite({ evidence: "FACT", context: "spiritual", destination: "prayer", explicitSave: false }).code, "SPIRITUAL_INTENT_REQUIRED");
  assert.equal(authorizeWrite({ evidence: "DAVID_DECISION", context: "business", searchedBeforeCreate: true }).allowed, false);
  assert.equal(
    authorizeWrite({
      evidence: "DAVID_DECISION",
      context: "business",
      searchedBeforeCreate: true,
      confirmed: true,
    }).allowed,
    true,
  );
});

test("design kernel and routes keep personal and business distinct", () => {
  assert.deepEqual(CERTIFIED_WIDTHS, RESPONSIVE_WIDTHS);
  assert.notEqual(PALETTES.personal.dark.paper, PALETTES.business.dark.paper);
  assert.equal(FORBIDDEN_VISUAL_PATTERNS.includes("fake-metric"), true);
  assert.equal(routeContext("/personal/spiritual"), "spiritual");
  assert.equal(routeContext("/business/revenue"), "business");
  assert.equal(routeContext("/personal/today"), "personal");
  assert.equal(davidCraigInstance.ownerName.length > 0, true);
  assert.equal(typeof davidCraigInstance.companyName, "string");
});

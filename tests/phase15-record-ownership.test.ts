import assert from "node:assert/strict";
import test from "node:test";
import {
  extractParentIdentity,
  normalizeNotionId,
  parentMatchesDestination,
  Phase15RecordOwnershipError,
  verifyCanonicalRecordBinding,
} from "../lib/server/phase15-record-ownership";

const PERSONAL_TASKS_DS = "747b3158-78c0-488d-a2ab-89b00e14cd45";
const BUSINESS_TASKS_DS = "45152c50-15cc-469d-94c9-094d93db2273";
const PRAYER_DS = "5526319d-76c2-4697-96be-b04e792fdd3f";
const JOURNAL_DS = "07e4a7d3-b06b-4916-8459-b76218456f6c";
const PERSONAL_PROJECTS_DS = "e86a6328-da0b-4b94-a2be-cd307a0614c1";

test("normalizeNotionId ignores dashes and case", () => {
  assert.equal(normalizeNotionId("747B3158-78C0-488D-A2AB-89B00E14CD45"), normalizeNotionId(PERSONAL_TASKS_DS.replaceAll("-", "")));
});

test("parentMatchesDestination accepts data_source_id parent", () => {
  assert.equal(
    parentMatchesDestination({ type: "data_source_id", data_source_id: PERSONAL_TASKS_DS }, "personal.tasks"),
    true,
  );
  assert.equal(
    parentMatchesDestination({ type: "data_source_id", data_source_id: BUSINESS_TASKS_DS }, "personal.tasks"),
    false,
  );
});

test("parentMatchesDestination accepts database_id parent against template databaseId", () => {
  assert.equal(
    parentMatchesDestination({ type: "database_id", database_id: "72b2e2a442c34eeb86030e1f59c98af5" }, "personal.tasks"),
    true,
  );
});

test("extractParentIdentity prefers data_source_id", () => {
  assert.deepEqual(
    extractParentIdentity({ type: "data_source_id", data_source_id: PERSONAL_TASKS_DS }),
    { dataSourceId: PERSONAL_TASKS_DS },
  );
});

test("verifyCanonicalRecordBinding accepts correct personal tasks binding", async () => {
  const binding = await verifyCanonicalRecordBinding({
    recordId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    destinationKey: "personal.tasks",
    page: {
      id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      parent: { type: "data_source_id", data_source_id: PERSONAL_TASKS_DS },
      properties: { Task: { type: "title", title: [{ plain_text: "Secret" }] } },
    },
  });
  assert.equal(binding.destinationKey, "personal.tasks");
  assert.equal(normalizeNotionId(binding.canonicalDataSourceId), normalizeNotionId(PERSONAL_TASKS_DS));
});

test("same-context wrong destination is denied without leaking title", async () => {
  await assert.rejects(
    () =>
      verifyCanonicalRecordBinding({
        recordId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
        destinationKey: "personal.projects",
        page: {
          id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
          parent: { type: "data_source_id", data_source_id: PERSONAL_TASKS_DS },
          properties: { Task: { type: "title", title: [{ plain_text: "LEAK_ME" }] } },
        },
      }),
    (error: unknown) => {
      assert.ok(error instanceof Phase15RecordOwnershipError);
      assert.equal(error.code, "RECORD_DESTINATION_MISMATCH");
      assert.ok(!error.message.includes("LEAK_ME"));
      assert.ok(!error.message.includes(PERSONAL_PROJECTS_DS));
      return true;
    },
  );
});

test("personal→business destination mismatch denied", async () => {
  await assert.rejects(
    () =>
      verifyCanonicalRecordBinding({
        recordId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
        destinationKey: "business.tasks",
        page: {
          id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
          parent: { type: "data_source_id", data_source_id: PERSONAL_TASKS_DS },
          properties: {},
        },
      }),
    (error: unknown) => error instanceof Phase15RecordOwnershipError && error.code === "RECORD_DESTINATION_MISMATCH",
  );
});

test("business→personal destination mismatch denied", async () => {
  await assert.rejects(
    () =>
      verifyCanonicalRecordBinding({
        recordId: "bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee",
        destinationKey: "personal.tasks",
        page: {
          id: "bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee",
          parent: { type: "data_source_id", data_source_id: BUSINESS_TASKS_DS },
          properties: {},
        },
      }),
    (error: unknown) => error instanceof Phase15RecordOwnershipError && error.code === "RECORD_DESTINATION_MISMATCH",
  );
});

test("prayer→business destination mismatch denied", async () => {
  await assert.rejects(
    () =>
      verifyCanonicalRecordBinding({
        recordId: "cccccccc-bbbb-cccc-dddd-eeeeeeeeeeee",
        destinationKey: "business.tasks",
        page: {
          id: "cccccccc-bbbb-cccc-dddd-eeeeeeeeeeee",
          parent: { type: "data_source_id", data_source_id: PRAYER_DS },
          properties: { Prayer: { type: "title", title: [{ plain_text: "Private" }] } },
        },
      }),
    (error: unknown) => {
      assert.ok(error instanceof Phase15RecordOwnershipError);
      assert.equal(error.code, "RECORD_DESTINATION_MISMATCH");
      assert.ok(!error.message.includes("Private"));
      return true;
    },
  );
});

test("journal→business destination mismatch denied", async () => {
  await assert.rejects(
    () =>
      verifyCanonicalRecordBinding({
        recordId: "dddddddd-bbbb-cccc-dddd-eeeeeeeeeeee",
        destinationKey: "business.tasks",
        page: {
          id: "dddddddd-bbbb-cccc-dddd-eeeeeeeeeeee",
          parent: { type: "data_source_id", data_source_id: JOURNAL_DS },
          properties: {},
        },
      }),
    (error: unknown) => error instanceof Phase15RecordOwnershipError && error.code === "RECORD_DESTINATION_MISMATCH",
  );
});

test("missing parent fails closed as mismatch", async () => {
  await assert.rejects(
    () =>
      verifyCanonicalRecordBinding({
        recordId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
        destinationKey: "personal.tasks",
        page: { id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", properties: {} },
      }),
    (error: unknown) => error instanceof Phase15RecordOwnershipError && error.code === "RECORD_DESTINATION_MISMATCH",
  );
});

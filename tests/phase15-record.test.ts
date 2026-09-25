import assert from "node:assert/strict";
import test from "node:test";
import {
  destinationKeyFromKind,
  quickEditFieldsFor,
  recordAccessAllowed,
} from "../lib/phase15/record-detail";
import { buildUpdatePreview, validateRecordUpdate } from "../lib/phase15/governed-update";

test("destinationKeyFromKind maps task and opportunity kinds", () => {
  assert.equal(destinationKeyFromKind("Task", "personal"), "personal.tasks");
  assert.equal(destinationKeyFromKind("Task", "business"), "business.tasks");
  assert.equal(destinationKeyFromKind("Opportunity", "business"), "business.opportunities");
  assert.equal(destinationKeyFromKind("Prayer", "spiritual"), "personal.prayer");
});

test("business context cannot access spiritual records", () => {
  const denied = recordAccessAllowed({
    destinationKey: "personal.prayer",
    context: "business",
  });
  assert.equal(denied.ok, false);
  if (!denied.ok) assert.equal(denied.code, "ACCESS_DENIED");
});

test("personal spiritual requires explicit flag", () => {
  const denied = recordAccessAllowed({
    destinationKey: "personal.prayer",
    context: "personal",
  });
  assert.equal(denied.ok, false);
  const allowed = recordAccessAllowed({
    destinationKey: "personal.prayer",
    context: "personal",
    explicitSpiritual: true,
  });
  assert.equal(allowed.ok, true);
});

test("personal cannot open business destinations", () => {
  const denied = recordAccessAllowed({
    destinationKey: "business.tasks",
    context: "personal",
  });
  assert.equal(denied.ok, false);
  if (!denied.ok) assert.equal(denied.code, "CROSS_CONTEXT");
});

test("quick edit fields stay narrow for tasks", () => {
  assert.deepEqual(quickEditFieldsFor("personal.tasks"), ["status", "priority", "dueDate"]);
  assert.deepEqual(quickEditFieldsFor("business.tasks"), ["status", "priority", "dueDate"]);
  assert.deepEqual(quickEditFieldsFor("personal.knowledge"), []);
});

test("validateRecordUpdate rejects empty patch and disallowed fields", () => {
  const empty = validateRecordUpdate({
    context: "personal",
    destinationKey: "personal.tasks",
    recordId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    patch: {},
  });
  assert.equal(empty.ok, false);

  const badField = validateRecordUpdate({
    context: "personal",
    destinationKey: "personal.knowledge",
    recordId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    patch: { status: "Open" },
  });
  assert.equal(badField.ok, false);
  if (!badField.ok) assert.equal(badField.code, "EDIT_NOT_ALLOWED");
});

test("validateRecordUpdate accepts task status change", () => {
  const ok = validateRecordUpdate({
    context: "personal",
    destinationKey: "personal.tasks",
    recordId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    patch: { status: "Done" },
  });
  assert.equal(ok.ok, true);
});

test("buildUpdatePreview shows before → after", () => {
  const preview = buildUpdatePreview({
    context: "personal",
    destinationKey: "personal.tasks",
    title: "Cert task",
    patch: { status: "Done" },
    baseline: { status: "Open" },
  });
  assert.ok(preview);
  assert.equal(preview?.fields[0]?.value, "Open → Done");
});

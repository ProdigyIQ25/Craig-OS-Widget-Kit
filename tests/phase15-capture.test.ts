import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMutationPreview,
  businessCaptureTargets,
  isSpiritualDestination,
  personalCaptureTargets,
  spiritualCaptureTargets,
  validateCapturePayload,
} from "../lib/phase15/governed-action";
import { authorizeWrite } from "../lib/phase15/operator";
import { POST as capturePost } from "../app/api/os/capture/route";

test("personal and business capture targets stay isolated and complete", () => {
  const personal = personalCaptureTargets().map((item) => item.key);
  const business = businessCaptureTargets().map((item) => item.key);
  const spiritual = spiritualCaptureTargets().map((item) => item.key);

  assert.deepEqual(personal, [
    "personal.goals",
    "personal.projects",
    "personal.tasks",
    "personal.decisions",
    "personal.knowledge",
  ]);
  assert.deepEqual(business, [
    "business.goals",
    "business.projects",
    "business.tasks",
    "business.decisions",
    "business.knowledge",
    "business.companies",
    "business.people",
    "business.opportunities",
    "business.issues",
  ]);
  assert.deepEqual(spiritual, ["personal.prayer", "personal.spiritual-journal"]);
  assert.equal(personal.some((key) => key.startsWith("business.")), false);
  assert.equal(business.some((key) => key.startsWith("personal.")), false);
  assert.equal(business.some((key) => isSpiritualDestination(key as never)), false);
});

test("generic capture cannot route to prayer or spiritual journal", () => {
  const prayer = validateCapturePayload({
    context: "personal",
    destinationKey: "personal.prayer",
    payload: { title: "Quiet petition" },
  });
  const journal = validateCapturePayload({
    context: "personal",
    destinationKey: "personal.spiritual-journal",
    payload: { title: "Reflection" },
  });
  const businessLeak = validateCapturePayload({
    context: "business",
    destinationKey: "personal.prayer",
    payload: { title: "Should fail" },
  });
  assert.equal(prayer.ok, false);
  assert.equal(prayer.ok === false && prayer.code, "SPIRITUAL_INTENT_REQUIRED");
  assert.equal(journal.ok, false);
  assert.equal(businessLeak.ok, false);
});

test("explicit spiritual intent validates prayer and journal only in spiritual context", () => {
  const prayer = validateCapturePayload({
    context: "spiritual",
    destinationKey: "personal.prayer",
    payload: { title: "Petition" },
    explicitSpiritualSave: true,
  });
  const journal = validateCapturePayload({
    context: "spiritual",
    destinationKey: "personal.spiritual-journal",
    payload: { title: "Entry" },
    explicitSpiritualSave: true,
  });
  const missingFlag = validateCapturePayload({
    context: "spiritual",
    destinationKey: "personal.prayer",
    payload: { title: "Petition" },
    explicitSpiritualSave: false,
  });
  assert.equal(prayer.ok, true);
  assert.equal(journal.ok, true);
  assert.equal(missingFlag.ok, false);
});

test("cross-context capture validation blocks silent routing", () => {
  assert.equal(
    validateCapturePayload({
      context: "personal",
      destinationKey: "business.tasks",
      payload: { title: "Leak" },
    }).ok,
    false,
  );
  assert.equal(
    validateCapturePayload({
      context: "business",
      destinationKey: "personal.tasks",
      payload: { title: "Leak" },
    }).ok,
    false,
  );
});

test("mutation preview distinguishes user and system fields without fabricating relations", () => {
  const preview = buildMutationPreview({
    context: "personal",
    destinationKey: "personal.tasks",
    payload: { title: "Ship capture", priority: "High" },
  });
  assert.ok(preview);
  assert.equal(preview?.title, "Ship capture");
  assert.equal(preview?.destinationLabel, "Personal Tasks");
  assert.equal(preview?.fields.some((field) => field.label === "Status"), false);
  assert.equal(preview?.fields.some((field) => field.label === "Priority" && field.source === "user"), true);
  assert.deepEqual(preview?.relationships, []);
});

test("authorizeWrite requires confirmed authorization before allowing mutation", () => {
  assert.equal(
    authorizeWrite({
      evidence: "DAVID_DECISION",
      context: "personal",
      searchedBeforeCreate: true,
      confirmed: false,
    }).allowed,
    false,
  );
  assert.equal(
    authorizeWrite({
      evidence: "DAVID_DECISION",
      context: "spiritual",
      destination: "prayer",
      explicitSave: true,
      searchedBeforeCreate: true,
      confirmed: true,
    }).allowed,
    true,
  );
});

test("capture POST without session remains write-not-authorized", async () => {
  const denied = await capturePost();
  assert.equal(denied.status, 403);
  assert.equal((await denied.json()).error.code, "WRITE_NOT_AUTHORIZED");

  const unauthenticated = await capturePost(
    new Request("http://localhost/api/os/capture", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://localhost" },
      body: JSON.stringify({
        actionId: "CAPTURE_CREATE",
        context: "personal",
        destinationKey: "personal.tasks",
        payload: { title: "Should not write" },
        evidence: "DAVID_DECISION",
        searchedBeforeCreate: true,
        authorized: true,
        idempotencyKey: "test-key-001",
      }),
    }),
  );
  assert.equal(unauthenticated.status, 403);
  assert.equal((await unauthenticated.json()).errorCode, "WRITE_NOT_AUTHORIZED");
});

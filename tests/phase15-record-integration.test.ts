import assert from "node:assert/strict";
import test from "node:test";
import { GET as recordGet } from "../app/api/os/record/route";
import { POST as updatePost } from "../app/api/os/record-update/route";
import { POST as capturePost } from "../app/api/os/capture/route";

test("record GET requires context and destination", async () => {
  const response = await recordGet(new Request("http://localhost/api/os/record?recordId=abc"));
  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.ok, false);
});

test("record GET denies business opening prayer", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify({ id: "x" }), { status: 200 })) as typeof fetch;
  try {
    const response = await recordGet(
      new Request(
        "http://localhost/api/os/record?recordId=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee&destinationKey=personal.prayer&context=business",
      ),
    );
    assert.equal(response.status, 403);
    const body = await response.json();
    assert.equal(body.errorCode, "ACCESS_DENIED");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("record GET returns mapped detail without write methods", async () => {
  const originalFetch = globalThis.fetch;
  const originalToken = process.env.NOTION_TOKEN;
  process.env.NOTION_TOKEN = "test-read-token";
  let patchCalls = 0;
  globalThis.fetch = (async (input, init) => {
    const url = String(input);
    const method = typeof init?.method === "string" ? init.method : "GET";
    if (url.includes("api.notion.com/v1/pages/") && method === "PATCH") {
      patchCalls += 1;
      return new Response("{}", { status: 500 });
    }
    if (url.includes("api.notion.com/v1/pages/")) {
      return new Response(
        JSON.stringify({
          id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
          url: "https://app.notion.com/p/cert",
          parent: { type: "data_source_id", data_source_id: "747b3158-78c0-488d-a2ab-89b00e14cd45" },
          properties: {
            Task: { type: "title", title: [{ plain_text: "Cert task" }] },
            Status: { type: "select", select: { name: "Open" } },
            Priority: { type: "select", select: { name: "High" } },
            "Due Date": { type: "date", date: { start: "2026-09-30" } },
          },
        }),
        { status: 200 },
      );
    }
    return new Response("{}", { status: 404 });
  }) as typeof fetch;

  try {
    const response = await recordGet(
      new Request(
        "http://localhost/api/os/record?recordId=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee&destinationKey=personal.tasks&context=personal",
      ),
    );
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.equal(body.data.title, "Cert task");
    assert.equal(body.data.status, "Open");
    assert.deepEqual(body.data.allowedActions.fields, ["status", "priority", "dueDate"]);
    assert.equal(patchCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalToken === undefined) delete process.env.NOTION_TOKEN;
    else process.env.NOTION_TOKEN = originalToken;
  }
});

test("record GET denies personal task under business.tasks without leaking title", async () => {
  const originalFetch = globalThis.fetch;
  const originalToken = process.env.NOTION_TOKEN;
  process.env.NOTION_TOKEN = "test-read-token";
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
        parent: { type: "data_source_id", data_source_id: "747b3158-78c0-488d-a2ab-89b00e14cd45" },
        properties: { Task: { type: "title", title: [{ plain_text: "LEAK_TITLE" }] } },
      }),
      { status: 200 },
    )) as typeof fetch;
  try {
    const response = await recordGet(
      new Request(
        "http://localhost/api/os/record?recordId=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee&destinationKey=business.tasks&context=business",
      ),
    );
    assert.equal(response.status, 403);
    const body = await response.json();
    assert.equal(body.ok, false);
    assert.equal(body.errorCode, "RECORD_DESTINATION_MISMATCH");
    assert.equal(body.data, null);
    assert.ok(!JSON.stringify(body).includes("LEAK_TITLE"));
  } finally {
    globalThis.fetch = originalFetch;
    if (originalToken === undefined) delete process.env.NOTION_TOKEN;
    else process.env.NOTION_TOKEN = originalToken;
  }
});

test("record GET denies same-context wrong destination (tasks→projects)", async () => {
  const originalFetch = globalThis.fetch;
  const originalToken = process.env.NOTION_TOKEN;
  process.env.NOTION_TOKEN = "test-read-token";
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
        parent: { type: "data_source_id", data_source_id: "747b3158-78c0-488d-a2ab-89b00e14cd45" },
        properties: { Task: { type: "title", title: [{ plain_text: "Cert task" }] } },
      }),
      { status: 200 },
    )) as typeof fetch;
  try {
    const response = await recordGet(
      new Request(
        "http://localhost/api/os/record?recordId=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee&destinationKey=personal.projects&context=personal",
      ),
    );
    assert.equal(response.status, 403);
    const body = await response.json();
    assert.equal(body.errorCode, "RECORD_DESTINATION_MISMATCH");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalToken === undefined) delete process.env.NOTION_TOKEN;
    else process.env.NOTION_TOKEN = originalToken;
  }
});

test("record-update without CSRF is write-not-authorized", async () => {
  const response = await updatePost(
    new Request("http://localhost/api/os/record-update", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://localhost" },
      body: JSON.stringify({
        actionId: "RECORD_UPDATE",
        recordId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
        context: "personal",
        destinationKey: "personal.tasks",
        patch: { status: "Done" },
        evidence: "DAVID_DECISION",
        searchedBeforeCreate: true,
        authorized: true,
        idempotencyKey: "test-idem-1",
      }),
    }),
  );
  assert.equal(response.status, 403);
  const body = await response.json();
  assert.equal(body.errorCode, "WRITE_NOT_AUTHORIZED");
});

test("capture route still rejects RECORD_UPDATE", async () => {
  const response = await capturePost(
    new Request("http://localhost/api/os/capture", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://localhost" },
      body: JSON.stringify({
        actionId: "RECORD_UPDATE",
        recordId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
        context: "personal",
        destinationKey: "personal.tasks",
        payload: { title: "x" },
        evidence: "DAVID_DECISION",
        searchedBeforeCreate: true,
        authorized: true,
        idempotencyKey: "test-idem-2",
      }),
    }),
  );
  assert.equal(response.status, 403);
});

test("updatePhase15Record denies mismatched destination with zero PATCH", async () => {
  const { updatePhase15Record } = await import("../lib/server/phase15-record-update");
  const originalFetch = globalThis.fetch;
  const originalAction = process.env.NOTION_ACTION_TOKEN;
  const originalRead = process.env.NOTION_TOKEN;
  process.env.NOTION_ACTION_TOKEN = "test-action-token";
  process.env.NOTION_TOKEN = "test-read-token";
  let patchCalls = 0;
  globalThis.fetch = (async (input, init) => {
    const url = String(input);
    const method = typeof init?.method === "string" ? init.method : "GET";
    if (url.includes("api.notion.com/v1/pages/") && method === "PATCH") {
      patchCalls += 1;
      return new Response("{}", { status: 200 });
    }
    if (url.includes("api.notion.com/v1/pages/")) {
      return new Response(
        JSON.stringify({
          id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
          parent: { type: "data_source_id", data_source_id: "747b3158-78c0-488d-a2ab-89b00e14cd45" },
          properties: { Task: { type: "title", title: [{ plain_text: "Cert" }] } },
        }),
        { status: 200 },
      );
    }
    return new Response("{}", { status: 404 });
  }) as typeof fetch;

  try {
    await assert.rejects(
      () =>
        updatePhase15Record({
          recordId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
          destinationKey: "business.tasks",
          context: "business",
          patch: { status: "Active" },
        }),
      (error: unknown) =>
        error instanceof Error && "code" in error && (error as { code: string }).code === "RECORD_DESTINATION_MISMATCH",
    );
    assert.equal(patchCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalAction === undefined) delete process.env.NOTION_ACTION_TOKEN;
    else process.env.NOTION_ACTION_TOKEN = originalAction;
    if (originalRead === undefined) delete process.env.NOTION_TOKEN;
    else process.env.NOTION_TOKEN = originalRead;
  }
});

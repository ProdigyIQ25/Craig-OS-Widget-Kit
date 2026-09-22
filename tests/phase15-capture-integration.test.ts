import assert from "node:assert/strict";
import test from "node:test";
import { createCaptureSession, validateCaptureRequest } from "../lib/server/phase15-capture-security";
import { POST as capturePost } from "../app/api/os/capture/route";

const SECRET = "phase15-capture-test-signing-secret-32b";

async function withSecret<T>(run: () => Promise<T> | T): Promise<T> {
  const previous = process.env.ACTION_SIGNING_SECRET;
  process.env.ACTION_SIGNING_SECRET = SECRET;
  try {
    return await run();
  } finally {
    if (previous === undefined) delete process.env.ACTION_SIGNING_SECRET;
    else process.env.ACTION_SIGNING_SECRET = previous;
  }
}

test("capture session CSRF validates same-origin requests only", async () => {
  await withSecret(() => {
    const session = createCaptureSession();
    const valid = new Request("http://localhost/api/os/capture", {
      method: "POST",
      headers: {
        origin: "http://localhost",
        "sec-fetch-site": "same-origin",
        cookie: `${session.cookieName}=${session.cookieValue}`,
        "x-craig-os-csrf": session.token,
      },
    });
    assert.equal(validateCaptureRequest(valid), true);

    const crossSite = new Request("http://localhost/api/os/capture", {
      method: "POST",
      headers: {
        origin: "https://evil.example",
        cookie: `${session.cookieName}=${session.cookieValue}`,
        "x-craig-os-csrf": session.token,
      },
    });
    assert.equal(validateCaptureRequest(crossSite), false);
  });
});

test("authorized capture POST fails closed without Notion action token and never reports success", async () => {
  await withSecret(async () => {
    const previousToken = process.env.NOTION_ACTION_TOKEN;
    delete process.env.NOTION_ACTION_TOKEN;
    const session = createCaptureSession();
    const response = await capturePost(
      new Request("http://localhost/api/os/capture", {
        method: "POST",
        headers: {
          origin: "http://localhost",
          "sec-fetch-site": "same-origin",
          "content-type": "application/json",
          cookie: `${session.cookieName}=${session.cookieValue}`,
          "x-craig-os-csrf": session.token,
        },
        body: JSON.stringify({
          actionId: "CAPTURE_CREATE",
          context: "personal",
          destinationKey: "personal.tasks",
          payload: { title: "BU-15.7 fail-closed probe" },
          evidence: "DAVID_DECISION",
          searchedBeforeCreate: true,
          authorized: true,
          idempotencyKey: `fail-closed-${Date.now()}`,
        }),
      }),
    );
    const body = await response.json();
    assert.equal(response.status, 503);
    assert.equal(body.ok, false);
    assert.equal(body.errorCode, "UPSTREAM_UNAVAILABLE");
    assert.match(body.error.message, /Nothing was saved/);
    if (previousToken === undefined) delete process.env.NOTION_ACTION_TOKEN;
    else process.env.NOTION_ACTION_TOKEN = previousToken;
  });
});

test("preview and validation gates reject write before Notion is contacted", async () => {
  await withSecret(async () => {
    const session = createCaptureSession();
    let notionCalls = 0;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (...args: Parameters<typeof fetch>) => {
      const url = String(args[0]);
      if (url.includes("api.notion.com")) {
        notionCalls += 1;
        throw new Error("Notion should not be called");
      }
      return originalFetch(...args);
    }) as typeof fetch;

    try {
      const invalid = await capturePost(
        new Request("http://localhost/api/os/capture", {
          method: "POST",
          headers: {
            origin: "http://localhost",
            "sec-fetch-site": "same-origin",
            "content-type": "application/json",
            cookie: `${session.cookieName}=${session.cookieValue}`,
            "x-craig-os-csrf": session.token,
          },
          body: JSON.stringify({
            actionId: "CAPTURE_CREATE",
            context: "personal",
            destinationKey: "personal.prayer",
            payload: { title: "Silent spiritual route" },
            evidence: "DAVID_DECISION",
            searchedBeforeCreate: true,
            authorized: true,
            idempotencyKey: `spiritual-block-${Date.now()}`,
          }),
        }),
      );
      assert.equal(invalid.status, 400);
      assert.equal((await invalid.json()).errorCode, "SPIRITUAL_INTENT_REQUIRED");

      const unconfirmed = await capturePost(
        new Request("http://localhost/api/os/capture", {
          method: "POST",
          headers: {
            origin: "http://localhost",
            "sec-fetch-site": "same-origin",
            "content-type": "application/json",
            cookie: `${session.cookieName}=${session.cookieValue}`,
            "x-craig-os-csrf": session.token,
          },
          body: JSON.stringify({
            actionId: "CAPTURE_CREATE",
            context: "business",
            destinationKey: "business.issues",
            payload: { title: "No authorize flag" },
            evidence: "DAVID_DECISION",
            searchedBeforeCreate: true,
            authorized: false,
            idempotencyKey: `unconfirmed-${Date.now()}`,
          }),
        }),
      );
      assert.equal(unconfirmed.status, 403);
      assert.equal((await unconfirmed.json()).errorCode, "WRITE_NOT_AUTHORIZED");
      assert.equal(notionCalls, 0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

test("successful governed create uses Notion action token path once under idempotency", async () => {
  await withSecret(async () => {
    const previousToken = process.env.NOTION_ACTION_TOKEN;
    process.env.NOTION_ACTION_TOKEN = "test-action-token";
    const session = createCaptureSession();
    let notionCalls = 0;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("api.notion.com/v1/pages")) {
        notionCalls += 1;
        assert.equal(init?.method, "POST");
        const body = JSON.parse(String(init?.body ?? "{}")) as {
          parent: { data_source_id?: string };
          properties: Record<string, unknown>;
        };
        assert.ok(body.parent.data_source_id);
        assert.ok(body.properties.Task || body.properties.Goal || body.properties.Title);
        return new Response(
          JSON.stringify({
            id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
            url: "https://www.notion.so/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
            created_time: "2026-09-21T18:00:00.000Z",
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }
      return originalFetch(input, init);
    }) as typeof fetch;

    try {
      const key = `idempotent-create-${Date.now()}`;
      const makeRequest = () =>
        capturePost(
          new Request("http://localhost/api/os/capture", {
            method: "POST",
            headers: {
              origin: "http://localhost",
              "sec-fetch-site": "same-origin",
              "content-type": "application/json",
              cookie: `${session.cookieName}=${session.cookieValue}`,
              "x-craig-os-csrf": session.token,
            },
            body: JSON.stringify({
              actionId: "CAPTURE_CREATE",
              context: "personal",
              destinationKey: "personal.tasks",
              payload: { title: "Idempotent personal task" },
              evidence: "DAVID_DECISION",
              searchedBeforeCreate: true,
              authorized: true,
              idempotencyKey: key,
            }),
          }),
        );

      const first = await makeRequest();
      const firstBody = await first.json();
      assert.equal(first.status, 200);
      assert.equal(firstBody.ok, true);
      assert.equal(firstBody.data.destinationKey, "personal.tasks");
      assert.equal(firstBody.data.title, "Idempotent personal task");

      const second = await makeRequest();
      const secondBody = await second.json();
      assert.equal(second.status, 200);
      assert.equal(secondBody.data.recordId, firstBody.data.recordId);
      assert.equal(notionCalls, 1);
    } finally {
      globalThis.fetch = originalFetch;
      if (previousToken === undefined) delete process.env.NOTION_ACTION_TOKEN;
      else process.env.NOTION_ACTION_TOKEN = previousToken;
    }
  });
});

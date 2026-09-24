import { expect, test, type Page } from "@playwright/test";
import {
  BUSINESS_FIXTURE_EMPTY,
  HOME_FIXTURE_EMPTY,
  PERSONAL_FIXTURE_EMPTY,
  envelope,
} from "../../lib/phase15/fixtures";

const widths = [390, 430, 768, 1024, 1440] as const;

async function mockAggregates(page: Page) {
  await page.route("**/api/os/home", (route) =>
    route.fulfill({ contentType: "application/json", body: JSON.stringify(envelope(HOME_FIXTURE_EMPTY)) }),
  );
  await page.route("**/api/os/personal", (route) =>
    route.fulfill({ contentType: "application/json", body: JSON.stringify(envelope(PERSONAL_FIXTURE_EMPTY)) }),
  );
  await page.route("**/api/os/business", (route) =>
    route.fulfill({ contentType: "application/json", body: JSON.stringify(envelope(BUSINESS_FIXTURE_EMPTY)) }),
  );
}

async function mockAskProposal(page: Page) {
  await page.route("**/api/os/ask", async (route) => {
    if (route.request().method() !== "POST") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ ok: true, data: { writePaths: 0 } }),
      });
      return;
    }
    const posted = route.request().postDataJSON() as { message?: string; surface?: string };
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        data: {
          ok: true,
          answer: "Prepared a governed capture proposal. Nothing was saved.",
          intent: "prepare_capture",
          context: posted.surface ?? "personal",
          citations: [],
          proposal: {
            authorizationState: "AWAITING_AUTHORIZATION",
            actionType: "CAPTURE_CREATE",
            context: posted.surface === "business" ? "business" : "personal",
            destinationKey: posted.surface === "business" ? "business.tasks" : "personal.tasks",
            destinationLabel: posted.surface === "business" ? "Business Tasks" : "Personal Tasks",
            title: "[CRAIG OS BU-15.8 CERTIFICATION] Task",
            payload: { title: "[CRAIG OS BU-15.8 CERTIFICATION] Task" },
            rationale: "Prepared from Ask. Authorize through Capture.",
          },
          errorCode: "AUTHORIZATION_REQUIRED",
          provider: "deterministic",
          version: "15.8.0-ask",
        },
        error: null,
      }),
    });
  });
}

test("ask entry opens from home personal and business", async ({ page }) => {
  await mockAggregates(page);
  await mockAskProposal(page);

  await page.goto("/");
  await page.getByRole("button", { name: "Ask Craig OS" }).click();
  await expect(page.getByRole("dialog", { name: /intelligence/i })).toBeVisible();
  await page.getByRole("button", { name: "Close Ask Craig OS" }).click();

  await page.goto("/personal");
  await page.getByRole("button", { name: "Ask Craig OS" }).click();
  await expect(page.getByRole("dialog", { name: /Personal intelligence/i })).toBeVisible();
  await page.getByRole("button", { name: "Close Ask Craig OS" }).click();

  await page.goto("/business");
  await page.getByRole("button", { name: "Ask Craig OS" }).click();
  await expect(page.getByRole("dialog", { name: /Business intelligence/i })).toBeVisible();
});

test("ask proposal opens capture preview without autonomous write", async ({ page }) => {
  await mockAggregates(page);
  await mockAskProposal(page);
  let capturePosts = 0;
  await page.route("**/api/os/capture", async (route) => {
    if (route.request().method() === "POST") capturePosts += 1;
    await route.fulfill({
      status: 403,
      contentType: "application/json",
      body: JSON.stringify({ ok: false, errorCode: "WRITE_NOT_AUTHORIZED" }),
    });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Ask Craig OS" }).click();
  await page.getByLabel("Message").fill("Create a personal task to certify Ask");
  await page.getByRole("button", { name: "Ask", exact: true }).click();
  await expect(page.getByText("Proposed action")).toBeVisible();
  await page.getByRole("button", { name: /Review & authorize in Capture/i }).click();
  await expect(page.locator('[data-capture-step="preview"]')).toBeVisible();
  await expect(page.getByRole("heading", { name: "Authorize write" })).toBeVisible();
  expect(capturePosts).toBe(0);
});

for (const width of widths) {
  test(`ask sheet is usable at ${width}px`, async ({ page }) => {
    await mockAggregates(page);
    await mockAskProposal(page);
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.getByRole("button", { name: "Ask Craig OS" }).click();
    const dialog = page.getByRole("dialog", { name: /intelligence/i });
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeLessThanOrEqual(width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBeFalsy();
  });
}

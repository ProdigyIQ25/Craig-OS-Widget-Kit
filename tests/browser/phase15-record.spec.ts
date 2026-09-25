import { expect, test, type Page } from "@playwright/test";
import {
  BUSINESS_FIXTURE_POPULATED,
  HOME_FIXTURE_POPULATED,
  PERSONAL_FIXTURE_POPULATED,
  envelope,
} from "../../lib/phase15/fixtures";

const widths = [390, 430, 768, 1024, 1440] as const;

async function mockSurfaces(page: Page) {
  await page.route("**/api/os/home", (route) =>
    route.fulfill({ contentType: "application/json", body: JSON.stringify(envelope(HOME_FIXTURE_POPULATED)) }),
  );
  await page.route("**/api/os/personal", (route) =>
    route.fulfill({ contentType: "application/json", body: JSON.stringify(envelope(PERSONAL_FIXTURE_POPULATED)) }),
  );
  await page.route("**/api/os/business", (route) =>
    route.fulfill({ contentType: "application/json", body: JSON.stringify(envelope(BUSINESS_FIXTURE_POPULATED)) }),
  );
}

async function mockRecordDetail(page: Page) {
  let updateCalls = 0;
  await page.route("**/api/os/record**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/record-update")) {
      await route.fallback();
      return;
    }
    if (route.request().method() !== "GET" || !url.pathname.endsWith("/record")) {
      await route.continue();
      return;
    }
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        data: {
          recordId: url.searchParams.get("recordId"),
          destinationKey: url.searchParams.get("destinationKey") ?? "personal.tasks",
          context: url.searchParams.get("context") ?? "personal",
          recordType: "Personal Tasks",
          title: "Protect the priority",
          status: "Open",
          priority: "High",
          dueDate: "2026-09-30",
          summary: "Certification fixture detail",
          relationships: [{ label: "Project", recordId: "proj-1", title: "Priority framing" }],
          deepEditUrl: "https://www.notion.so/protect-priority",
          allowedActions: { quickEdit: true, fields: ["status", "priority", "dueDate"], deepEdit: true },
          sensitivity: "standard",
          version: "15.9.0-record",
        },
      }),
    });
  });
  await page.route("**/api/os/record-update", async (route) => {
    updateCalls += 1;
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        data: {
          title: "Protect the priority",
          recordId: "t1",
          recordUrl: "https://www.notion.so/protect-priority",
          readBack: {
            recordId: "t1",
            destinationKey: "personal.tasks",
            context: "personal",
            recordType: "Personal Tasks",
            title: "Protect the priority",
            status: "Done",
            priority: "High",
            dueDate: "2026-09-30",
            relationships: [],
            deepEditUrl: "https://www.notion.so/protect-priority",
            allowedActions: { quickEdit: true, fields: ["status", "priority", "dueDate"], deepEdit: true },
            sensitivity: "standard",
            version: "15.9.0-record",
          },
        },
      }),
    });
  });
  await page.route("**/api/os/capture/session", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        csrfToken: "test-csrf-token",
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      }),
    }),
  );
  return () => updateCalls;
}

test("record drawer opens from personal today inspect with deep edit link", async ({ page }) => {
  await mockSurfaces(page);
  const updates = await mockRecordDetail(page);
  await page.goto("/personal/today");
  await page.getByRole("button", { name: "Inspect Protect the priority" }).click();
  const drawer = page.locator('[data-record-drawer="true"]');
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole("heading", { name: "Protect the priority" })).toBeVisible();
  await expect(drawer.getByText("WHAT MATTERS")).toBeVisible();
  await expect(drawer.getByText("RELATIONSHIPS")).toBeVisible();
  await expect(drawer.getByRole("link", { name: "Open in Notion" })).toHaveAttribute("href", /notion\.so/);
  expect(updates()).toBe(0);
  await drawer.getByRole("button", { name: "Close detail" }).click();
  await expect(drawer).toHaveCount(0);
});

test("governed edit preview does not write until authorize", async ({ page }) => {
  await mockSurfaces(page);
  const updates = await mockRecordDetail(page);
  await page.goto("/personal/today");
  await page.getByRole("button", { name: "Inspect Protect the priority" }).click();
  const drawer = page.locator('[data-record-drawer="true"]');
  await drawer.getByRole("button", { name: "Governed edit" }).click();
  await drawer.getByLabel("Status").fill("Done");
  await drawer.getByRole("button", { name: "Preview change" }).click();
  await expect(drawer.getByText("AUTHORIZE UPDATE", { exact: true })).toBeVisible();
  expect(updates()).toBe(0);
  await drawer.getByRole("button", { name: "Authorize update" }).click();
  await expect(drawer.getByText("UPDATED", { exact: true })).toBeVisible();
  expect(updates()).toBe(1);
});

for (const width of widths) {
  test(`record drawer usable at ${width}px`, async ({ page }) => {
    await mockSurfaces(page);
    await mockRecordDetail(page);
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/personal/today");
    await page.getByRole("button", { name: "Inspect Protect the priority" }).click();
    const drawer = page.locator('[data-record-drawer="true"]');
    await expect(drawer).toBeVisible();
    const box = await drawer.boundingBox();
    expect(box?.width).toBeGreaterThan(200);
    expect((box?.width ?? 9999) <= width + 1).toBeTruthy();
  });
}

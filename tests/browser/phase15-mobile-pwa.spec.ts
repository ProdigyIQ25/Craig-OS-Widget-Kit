import { expect, test, type Page } from "@playwright/test";
import {
  BUSINESS_FIXTURE_POPULATED,
  HOME_FIXTURE_POPULATED,
  PERSONAL_FIXTURE_POPULATED,
  envelope,
} from "../../lib/phase15/fixtures";
import { RESPONSIVE_WIDTHS } from "../../lib/phase15/routes";

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

test("manifest includes scope start_url standalone and icons", async ({ request }) => {
  const response = await request.get("/manifest.webmanifest");
  expect(response.ok()).toBeTruthy();
  const manifest = await response.json();
  expect(manifest).toMatchObject({
    name: "Craig OS",
    short_name: "Craig OS",
    start_url: "/",
    scope: "/",
    display: "standalone",
    theme_color: "#12161c",
    background_color: "#12161c",
  });
  expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
});

test("service worker asset is published", async ({ request }) => {
  const response = await request.get("/sw.js");
  expect(response.ok()).toBeTruthy();
  const body = await response.text();
  expect(body).toContain("/api/");
  expect(body).toContain("/offline");
  expect(body).not.toContain("NOTION_TOKEN");
});

test("offline degraded page is intentional", async ({ page }) => {
  await page.goto("/offline");
  await expect(page.getByRole("heading", { name: "You are offline" })).toBeVisible();
  await expect(page.getByText(/cannot be verified/i)).toBeVisible();
  await expect(page.getByText(/Nothing will be written/i)).toBeVisible();
});

test("mobile bottom nav is present and routes primary surfaces", async ({ page }) => {
  await mockSurfaces(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Primary mobile navigation" });
  await expect(nav).toBeVisible();
  for (const label of ["Home", "Today", "Focus", "Personal", "Business"]) {
    await expect(nav.getByRole("link", { name: label })).toBeVisible();
  }
  const box = await nav.getByRole("link", { name: "Home" }).boundingBox();
  expect((box?.height ?? 0) >= 44).toBeTruthy();

  await nav.getByRole("link", { name: "Today" }).click();
  await expect(page).toHaveURL(/\/personal\/today/);
  await nav.getByRole("link", { name: "Business" }).click();
  await expect(page).toHaveURL(/\/business/);
});

test("offline banner discloses degraded state without inventing data", async ({ page, context }) => {
  await mockSurfaces(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Command Center" })).toBeVisible();
  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" }).catch(() => undefined);
  // Banner or offline page — either intentional degraded path
  const banner = page.locator('[data-connectivity="offline"]');
  const offlineHeading = page.getByRole("heading", { name: "You are offline" });
  await expect(banner.or(offlineHeading)).toBeVisible({ timeout: 8000 });
  await context.setOffline(false);
});

for (const width of RESPONSIVE_WIDTHS) {
  test(`phase15 command shell usable at ${width}px`, async ({ page }) => {
    await mockSurfaces(page);
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Command Center" })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(overflow).toBeFalsy();
    if (width <= 768) {
      await expect(page.getByRole("navigation", { name: "Primary mobile navigation" })).toBeVisible();
    }
  });
}

test("landscape phone keeps primary navigation reachable", async ({ page }) => {
  await mockSurfaces(page);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto("/personal/today");
  await expect(page.getByRole("navigation", { name: "Primary mobile navigation" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
});

test("Ask remains available on mobile without write path", async ({ page }) => {
  await mockSurfaces(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Ask Craig OS" }).click();
  await expect(page.locator("[data-ask-surface]")).toBeVisible();
  await expect(page.getByRole("button", { name: /Authorize|Save to Notion/i })).toHaveCount(0);
});

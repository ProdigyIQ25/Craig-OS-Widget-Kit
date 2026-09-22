import { expect, test, type Page } from "@playwright/test";
import {
  BUSINESS_FIXTURE_EMPTY,
  BUSINESS_FIXTURE_POPULATED,
  HOME_FIXTURE_EMPTY,
  HOME_FIXTURE_POPULATED,
  PERSONAL_FIXTURE_EMPTY,
  PERSONAL_FIXTURE_POPULATED,
  envelope,
  unavailableEnvelope,
} from "../../lib/phase15/fixtures";

const widths = [390, 430, 768, 1024, 1440] as const;

async function mockHome(page: Page, body: unknown) {
  await page.route("**/api/os/home", (route) =>
    route.fulfill({ contentType: "application/json", body: JSON.stringify(body) }),
  );
}
async function mockPersonal(page: Page, body: unknown) {
  await page.route("**/api/os/personal", (route) =>
    route.fulfill({ contentType: "application/json", body: JSON.stringify(body) }),
  );
}
async function mockBusiness(page: Page, body: unknown) {
  await page.route("**/api/os/business", (route) =>
    route.fulfill({ contentType: "application/json", body: JSON.stringify(body) }),
  );
}

test("home empty populated unavailable and retry", async ({ page }) => {
  await mockHome(page, envelope(HOME_FIXTURE_EMPTY));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Command Center" })).toBeVisible();
  await expect(page.getByText("Nothing requires your attention right now.")).toBeVisible();
  await expect(page.getByText(/Ask Craig OS|Write path reserved|Supporting surfaces/i)).toHaveCount(0);
  await expect(page.locator(".p15-record")).toHaveCount(0);

  await mockHome(page, envelope(HOME_FIXTURE_POPULATED));
  await page.reload();
  await expect(page.getByRole("region", { name: "Nothing should wait without a reason." }).getByRole("button", { name: "Inspect Approve proposal framing" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Inspect Priority account" }).first()).toBeVisible();

  await mockHome(page, unavailableEnvelope());
  await page.reload();
  await expect(page.getByText("Your current operating state could not load.")).toBeVisible();
  await expect(page.getByText("No replacement data is shown.")).toBeVisible();
  await mockHome(page, envelope(HOME_FIXTURE_EMPTY));
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Command Center" })).toBeVisible();
});

test("personal focus today spiritual and isolation", async ({ page }) => {
  await mockPersonal(page, envelope(PERSONAL_FIXTURE_POPULATED));
  await page.goto("/personal");
  await expect(page.getByRole("heading", { level: 1, name: "Personal Command" })).toBeVisible();
  await page.getByRole("link", { name: "Today", exact: true }).click();
  await expect(page).toHaveURL(/\/personal\/today/);
  await expect(page.getByRole("heading", { name: "Protect the priority" })).toBeVisible();
  await page.getByRole("link", { name: "Focus", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Ship Phase 15" })).toBeVisible();
  await page.getByRole("link", { name: "Spiritual", exact: true }).click();
  await expect(page.getByText(/Sensitive spiritual records never appear/)).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Operating system" }).getByRole("link", { name: "Business" })).toBeVisible();
  await expect(page.getByText("Priority account")).toHaveCount(0);
});

test("business executive revenue workforce and no personal leakage", async ({ page }) => {
  await mockBusiness(page, envelope(BUSINESS_FIXTURE_POPULATED));
  await page.goto("/business/executive");
  await expect(page.getByRole("heading", { level: 1, name: "Executive" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Approve proposal framing" })).toBeVisible();
  await page.getByRole("link", { name: "Revenue", exact: true }).click();
  await expect(page.getByRole("button", { name: "Inspect Priority account" }).first()).toBeVisible();
  await expect(page.getByText("No fabricated forecast")).toBeVisible();
  await expect(page.getByText("Follow-up").first()).toBeVisible();
  await page.getByRole("link", { name: "Workforce", exact: true }).click();
  await expect(page.getByText(/Digital Workers remains disabled/)).toBeVisible();
  await expect(page.getByText("Protect the priority")).toHaveCount(0);
});

test("mobile sheet inspect preserves context", async ({ page }) => {
  await mockPersonal(page, envelope(PERSONAL_FIXTURE_POPULATED));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/personal/today");
  await page.getByRole("button", { name: "Inspect Protect the priority" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator(".p15-sheet")).toBeVisible();
  await page.getByRole("button", { name: "Close detail" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Today" })).toBeVisible();
});

for (const width of widths) {
  test(`phase15 surfaces are overflow-safe at ${width}px`, async ({ page }) => {
    await mockHome(page, envelope(HOME_FIXTURE_EMPTY));
    await mockPersonal(page, envelope(PERSONAL_FIXTURE_EMPTY));
    await mockBusiness(page, envelope(BUSINESS_FIXTURE_EMPTY));
    const errors: string[] = [];
    page.on("console", (message) => {
      if (["error", "warning"].includes(message.type()) && !message.text().includes("eval()")) {
        errors.push(message.text());
      }
    });
    await page.setViewportSize({ width, height: 1000 });
    for (const path of ["/", "/personal/focus", "/business/revenue"]) {
      await page.goto(path);
      await expect(page.locator("main.p15-shell")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBeFalsy();
    }
    expect(errors).toEqual([]);
  });
}

test("governed capture entry preview cancel and destination isolation", async ({ page }) => {
  await mockHome(page, envelope(HOME_FIXTURE_EMPTY));
  await mockPersonal(page, envelope(PERSONAL_FIXTURE_EMPTY));
  await mockBusiness(page, envelope(BUSINESS_FIXTURE_EMPTY));

  await page.goto("/");
  await page.getByRole("button", { name: "Capture" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Capture" })).toBeVisible();

  await page.getByRole("radio", { name: "Personal" }).check();
  const personalOptions = await page.locator(".p15-capture-field select option").allTextContents();
  expect(personalOptions.join(" ")).toMatch(/Personal Tasks/);
  expect(personalOptions.join(" ")).not.toMatch(/Opportunit|Companies|Prayer|Spiritual Journal/);

  await page.getByRole("radio", { name: "Business" }).check();
  const businessOptions = await page.locator(".p15-capture-field select option").allTextContents();
  expect(businessOptions.join(" ")).toMatch(/Opportunities/);
  expect(businessOptions.join(" ")).not.toMatch(/Prayer|Spiritual Journal|Personal Tasks/);

  await page.getByRole("radio", { name: "Spiritual" }).check();
  const spiritualOptions = await page.locator(".p15-capture-field select option").allTextContents();
  expect(spiritualOptions.join(" ")).toMatch(/Prayer/);
  expect(spiritualOptions.join(" ")).toMatch(/Spiritual Journal/);
  expect(spiritualOptions.join(" ")).not.toMatch(/Opportunit|Companies/);

  await page.getByRole("radio", { name: "Personal" }).check();
  await page.locator(".p15-capture-field select").selectOption("personal.tasks");
  await page.getByLabel("Title").fill("Capture certification draft");
  await page.getByRole("button", { name: "Review mutation" }).click();
  await expect(page.getByRole("heading", { name: "Authorize write" })).toBeVisible();
  await expect(page.getByText("Confirm & Save")).toBeVisible();
  await expect(page.getByText("Personal Tasks")).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("capture authorize path requires Confirm & Save and locks duplicate submit", async ({ page }) => {
  await mockHome(page, envelope(HOME_FIXTURE_EMPTY));
  let writeCalls = 0;
  await page.route("**/api/os/capture/session", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ ok: true, csrfToken: "test-csrf", expiresAt: new Date(Date.now() + 3600_000).toISOString() }),
    });
  });
  await page.route(
    (url) => {
      try {
        return new URL(url).pathname === "/api/os/capture";
      } catch {
        return false;
      }
    },
    async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      writeCalls += 1;
      await new Promise((resolve) => setTimeout(resolve, 250));
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          data: {
            destinationKey: "personal.tasks",
            destinationLabel: "Personal Tasks",
            title: "One intentional submit",
            recordId: "rec-test",
            recordUrl: "https://www.notion.so/rec-test",
            createdAt: new Date().toISOString(),
          },
        }),
      });
    },
  );

  await page.goto("/");
  await page.getByRole("button", { name: "Capture" }).click();
  await page.locator(".p15-capture-field select").selectOption("personal.tasks");
  await page.getByLabel("Title").fill("One intentional submit");
  await page.getByRole("button", { name: "Review mutation" }).click();
  const save = page.getByRole("button", { name: "Confirm & Save" });
  await save.click();
  await expect(page.getByText("Created in Personal Tasks")).toBeVisible();
  expect(writeCalls).toBe(1);
});

test("capture write failure preserves recoverable retry without false success", async ({ page }) => {
  await mockHome(page, envelope(HOME_FIXTURE_EMPTY));
  await page.route("**/api/os/capture/session", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ ok: true, csrfToken: "test-csrf", expiresAt: new Date(Date.now() + 3600_000).toISOString() }),
    });
  });
  await page.route(
    (url) => {
      try {
        return new URL(url).pathname === "/api/os/capture";
      } catch {
        return false;
      }
    },
    async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 502,
        contentType: "application/json",
        body: JSON.stringify({
          ok: false,
          error: { code: "WRITE_FAILED", message: "Could not capture this record. Nothing was saved." },
          errorCode: "WRITE_FAILED",
        }),
      });
    },
  );

  await page.goto("/");
  await page.getByRole("button", { name: "Capture" }).click();
  await page.locator(".p15-capture-field select").selectOption("personal.knowledge");
  await page.getByLabel("Title").fill("Recoverable draft");
  await page.getByRole("button", { name: "Review mutation" }).click();
  await page.getByRole("button", { name: "Confirm & Save" }).click();
  await expect(page.getByText("Mutation did not complete")).toBeVisible();
  await expect(page.getByText("Nothing was saved.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry authorize" })).toBeVisible();
  await expect(page.getByText("Created in")).toHaveCount(0);
});

for (const width of widths) {
  test(`capture sheet remains usable at ${width}px`, async ({ page }) => {
    await mockHome(page, envelope(HOME_FIXTURE_EMPTY));
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await page.getByRole("button", { name: "Capture" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.locator(".p15-capture-field select").selectOption("personal.goals");
    await page.getByLabel("Title").fill(`Width ${width}`);
    await page.getByRole("button", { name: "Review mutation" }).click();
    await expect(page.getByRole("button", { name: "Confirm & Save" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBeFalsy();
  });
}

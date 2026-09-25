import { defineConfig } from "@playwright/test";
export default defineConfig({ testDir:"./tests/browser", timeout:30_000, reporter:"line", use:{ baseURL:process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3015", browserName:"chromium", channel:"chrome", headless:true, reducedMotion:"reduce" } });

import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { MOBILE_PRIMARY_NAV } from "../lib/phase15/nav";
import { RESPONSIVE_WIDTHS } from "../lib/phase15/routes";

test("mobile primary nav covers Home Today Focus Personal Business", () => {
  assert.deepEqual(
    MOBILE_PRIMARY_NAV.map((item) => item.id),
    ["home", "today", "focus", "personal", "business"],
  );
});

test("responsive matrix includes 360 and 375 without dropping prior widths", () => {
  for (const width of [360, 375, 390, 430, 768, 1024, 1440]) {
    assert.ok((RESPONSIVE_WIDTHS as readonly number[]).includes(width));
  }
});

test("service worker never caches API paths or secrets", () => {
  const source = readFileSync(join(process.cwd(), "public/sw.js"), "utf8");
  assert.match(source, /\/api\//);
  assert.match(source, /Never intercept|never cache|NEVER cache/i);
  assert.ok(!source.includes("NOTION_TOKEN"));
  assert.ok(!source.includes("ACTION_SIGNING"));
  assert.ok(!source.includes("secret_"));
  assert.match(source, /\/offline/);
});

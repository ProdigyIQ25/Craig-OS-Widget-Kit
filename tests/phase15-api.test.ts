import assert from "node:assert/strict";
import test from "node:test";
import { GET as homeGet } from "../app/api/os/home/route";
import { GET as captureGet, POST as capturePost } from "../app/api/os/capture/route";
import { GET as businessGet } from "../app/api/os/business/executive/route";

test("home aggregate route returns upstream unavailable and no records", async () => {
  const response = homeGet();
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.error.code, "UPSTREAM_UNAVAILABLE");
  assert.equal(body.data, null);
});

test("business executive route stays fail-closed", async () => {
  const response = businessGet();
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.ok, false);
  assert.equal(JSON.stringify(body).includes("prayer"), false);
});

test("capture read is unavailable and capture write is rejected", async () => {
  const read = captureGet();
  assert.equal(read.status, 503);
  const write = await capturePost();
  assert.equal(write.status, 403);
  const body = await write.json();
  assert.equal(body.error.code, "WRITE_NOT_AUTHORIZED");
  assert.equal(body.data, null);
});

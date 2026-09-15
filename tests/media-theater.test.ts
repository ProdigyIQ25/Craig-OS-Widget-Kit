import assert from "node:assert/strict";
import test from "node:test";
import { MEDIA_THEATER_MODES, mediaTheaterRegistry, parseMediaTheaterMode } from "../lib/media-theater";

test("Media Theater registry exposes the four shell contexts and reusable business variants",()=>{
  assert.deepEqual(MEDIA_THEATER_MODES,["focus","spiritual","growth","brand","product-demo","client-training","walkthrough","loom"]);
  assert.equal(mediaTheaterRegistry.focus.apiMode,"focus");
  assert.equal(mediaTheaterRegistry.spiritual.apiMode,"spiritual");
  assert.equal(mediaTheaterRegistry.growth.apiMode,"learning");
  assert.equal(mediaTheaterRegistry.brand.apiMode,"writing");
  assert.deepEqual(mediaTheaterRegistry.focus.captures.map(item=>item.label),["+ Note","+ Insight"]);
  assert.deepEqual(mediaTheaterRegistry.spiritual.captures.map(item=>item.label),["+ Reflection","+ Scripture Note","+ Prayer"]);
  assert.deepEqual(mediaTheaterRegistry.growth.captures.map(item=>item.label),["+ Insight","+ Question","+ Framework","+ Apply"]);
  assert.deepEqual(mediaTheaterRegistry.brand.captures.map(item=>item.label),["+ Hook","+ Idea","+ Insight","+ Reference"]);
});

test("Media Theater mode parsing is closed and defaults safely",()=>{
  assert.equal(parseMediaTheaterMode("growth"),"growth");
  assert.equal(parseMediaTheaterMode("product-demo"),"product-demo");
  assert.equal(parseMediaTheaterMode("invented"),"focus");
  assert.equal(parseMediaTheaterMode(null),"focus");
});

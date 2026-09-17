import assert from "node:assert/strict";
import test from "node:test";
import { businessModeRegistry, businessModes, parseBusinessMode, parsePersonalMode, personalModeRegistry, personalModes } from "@/lib/os-data/modes";

test("mode registries expose exactly the twelve authorized modes",()=>{
  assert.deepEqual(personalModes,["command","focus","spiritual","brand","growth","reset"]);
  assert.deepEqual(businessModes,["executive","revenue","worktelli","engineering","clients","workforce"]);
});

test("every mode contract changes composition, actions, media, navigation, and empty state",()=>{
  for(const definition of [...Object.values(personalModeRegistry),...Object.values(businessModeRegistry)]){
    assert.ok(definition.heading);assert.ok(definition.subheading);assert.ok(definition.theme);
    assert.ok(definition.primaryAction.label);assert.ok(definition.primaryAction.href);
    assert.ok(definition.secondaryActions.length>=2);assert.ok(definition.mediaContext.mode);
    assert.ok(definition.navigation.href);assert.ok(definition.moduleOrder.length>=5);assert.ok(definition.emptyState);
  }
  assert.equal(new Set(Object.values(personalModeRegistry).map(mode=>mode.moduleOrder.join("|"))).size,6);
  assert.equal(new Set(Object.values(businessModeRegistry).map(mode=>mode.moduleOrder.join("|"))).size,6);
});

test("mode parsing defaults safely and keeps Personal and Business isolated",()=>{
  assert.equal(parsePersonalMode(null),"command");assert.equal(parsePersonalMode("revenue"),"command");
  assert.equal(parseBusinessMode(null),"executive");assert.equal(parseBusinessMode("spiritual"),"executive");
  assert.equal(parsePersonalMode("focus"),"focus");assert.equal(parseBusinessMode("worktelli"),"worktelli");
});

test("sensitive and unavailable modes retain a clear human-facing boundary",()=>{
  assert.match(personalModeRegistry.spiritual.emptyState,/Prayer and journal entries are kept private/);
  assert.match(personalModeRegistry.brand.emptyState,/active brand work/);
  assert.match(personalModeRegistry.growth.emptyState,/Choose a topic/);
  assert.match(businessModeRegistry.clients.emptyState,/relationship/);
});

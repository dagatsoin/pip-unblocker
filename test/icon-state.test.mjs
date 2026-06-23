/**
 * Unit tests for the icon-state reducer.
 * Maps { hasBlocker, removedByUser } -> 'default' | 'orange' | 'green'.
 * Covers FS-001.2/.3/.5, BS-001.6 (active blocker beats prior confirmation),
 * and the honesty rule that green requires an actual removal (TS-005/TS-007).
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { reduceIconState } from "../src/lib/pip-core.js";

test("no blocker, not removed -> default (FS-001.3)", () => {
  assert.equal(reduceIconState({ hasBlocker: false, removedByUser: false }), "default");
});

test("blocker present, not yet removed -> orange (FS-001.2)", () => {
  assert.equal(reduceIconState({ hasBlocker: true, removedByUser: false }), "orange");
});

test("blocker was present and the user removed it -> green (FS-001.5)", () => {
  assert.equal(reduceIconState({ hasBlocker: false, removedByUser: true }), "green");
});

test("BS-001.6: a live blocker beats a prior green confirmation -> orange", () => {
  // Even though the user removed earlier, a newly-present blocker wins.
  assert.equal(reduceIconState({ hasBlocker: true, removedByUser: true }), "orange");
});

test("removedByUser=true must never show green while a blocker is live (no false 'PiP available')", () => {
  assert.notEqual(reduceIconState({ hasBlocker: true, removedByUser: true }), "green");
});

test("defaults are safe when fields are omitted", () => {
  assert.equal(reduceIconState({}), "default");
  assert.equal(reduceIconState(undefined), "default");
});

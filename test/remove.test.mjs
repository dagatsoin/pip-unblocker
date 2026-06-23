/**
 * Unit tests for the PiP-suppression removal primitive.
 * Covers TS-006 (BS-001.2 / FS-001.4): strip the attribute and neutralize
 * the property on every suppressed video; never touch clear ones; report
 * an accurate removal count (feeds the green-only-on-removal guard, TS-007).
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  removeSuppressionFromVideo,
  removeSuppressionFromAll,
  isVideoSuppressed,
} from "../src/lib/pip-core.js";
import { FakeVideo } from "./helpers/fake-dom.mjs";

test("removeSuppressionFromVideo: strips the attribute and clears the property", () => {
  const v = new FakeVideo({ attr: true, prop: true });
  const changed = removeSuppressionFromVideo(v);
  assert.equal(changed, true);
  assert.equal(v.hasAttribute("disablepictureinpicture"), false);
  assert.equal(v.disablePictureInPicture, false);
  assert.equal(isVideoSuppressed(v), false);
});

test("removeSuppressionFromVideo: property-only suppression is neutralized to false", () => {
  const v = new FakeVideo({ attr: false, prop: true });
  const changed = removeSuppressionFromVideo(v);
  assert.equal(changed, true);
  assert.equal(v.disablePictureInPicture, false);
  assert.equal(isVideoSuppressed(v), false);
});

test("removeSuppressionFromVideo: a non-suppressed video is left untouched and reports no change", () => {
  const v = new FakeVideo({ attr: false, prop: false });
  const changed = removeSuppressionFromVideo(v);
  assert.equal(changed, false);
  assert.equal(v.disablePictureInPicture, false);
});

test("removeSuppressionFromVideo: tolerates null without throwing", () => {
  assert.equal(removeSuppressionFromVideo(null), false);
});

test("removeSuppressionFromAll: BS-001.2 two suppressed videos -> a single call clears both", () => {
  const a = new FakeVideo({ attr: true, prop: false });
  const b = new FakeVideo({ attr: false, prop: true });
  const count = removeSuppressionFromAll([a, b]);
  assert.equal(count, 2);
  assert.equal(isVideoSuppressed(a), false);
  assert.equal(isVideoSuppressed(b), false);
});

test("removeSuppressionFromAll: BS-001.2 mixed page leaves the already-clear video untouched", () => {
  const blocked = new FakeVideo({ attr: true, prop: false });
  const clear = new FakeVideo({ attr: false, prop: false });
  const count = removeSuppressionFromAll([blocked, clear]);
  // Only the suppressed one counts as a removal.
  assert.equal(count, 1);
  assert.equal(isVideoSuppressed(blocked), false);
  assert.equal(isVideoSuppressed(clear), false);
});

test("removeSuppressionFromAll: empty set reports zero removals (no-op feeds BS-001.5/TS-007)", () => {
  assert.equal(removeSuppressionFromAll([]), 0);
  assert.equal(removeSuppressionFromAll(null), 0);
});

test("removeSuppressionFromAll: skips null/stale entries and still processes the rest (FS-001.7)", () => {
  const live = new FakeVideo({ attr: true, prop: false });
  const count = removeSuppressionFromAll([null, live, undefined]);
  assert.equal(count, 1);
  assert.equal(isVideoSuppressed(live), false);
});

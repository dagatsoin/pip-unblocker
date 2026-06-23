/**
 * Unit tests for the PiP-suppression detection primitive.
 * Covers TS-004 (BS-001.1) and the underlying per-video predicate (FS-001.1).
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { isVideoSuppressed, scanForSuppression } from "../src/lib/pip-core.js";
import { FakeVideo, FakeRoot, FakeElement } from "./helpers/fake-dom.mjs";

test("isVideoSuppressed: true when the disablepictureinpicture attribute is present", () => {
  const v = new FakeVideo({ attr: true, prop: false });
  assert.equal(isVideoSuppressed(v), true);
});

test("isVideoSuppressed: true when the disablePictureInPicture property is forced true (no attribute)", () => {
  const v = new FakeVideo({ attr: false, prop: true });
  assert.equal(isVideoSuppressed(v), true);
});

test("isVideoSuppressed: the real Netflix shape — attribute present AND property true -> blocked (FS-001.1)", () => {
  // Observed live on a Netflix /watch player: the <video> carries the
  // `disablepictureinpicture` content attribute (value "") AND its reflected
  // `disablePictureInPicture` property === true at the same time. Detection of
  // this exact shape was never the problem (it returns true here); the live
  // failure was that the verdict never surfaced to the per-tab icon (SW reset
  // race + missing SPA re-detect), which is chrome.* wiring, not pure logic.
  const v = new FakeVideo({ attr: true, prop: true });
  assert.equal(v.hasAttribute("disablepictureinpicture"), true);
  assert.equal(v.disablePictureInPicture, true);
  assert.equal(isVideoSuppressed(v), true);
});

test("isVideoSuppressed: false when neither signal is present", () => {
  const v = new FakeVideo({ attr: false, prop: false });
  assert.equal(isVideoSuppressed(v), false);
});

test("isVideoSuppressed: tolerates a null / undefined element without throwing", () => {
  assert.equal(isVideoSuppressed(null), false);
  assert.equal(isVideoSuppressed(undefined), false);
});

test("scanForSuppression: FS-001.1 attribute -> blocked, includes the video", () => {
  const v = new FakeVideo({ attr: true, prop: false });
  const result = scanForSuppression(new FakeRoot([v]));
  assert.equal(result.verdict, "blocked");
  assert.equal(result.suppressed.length, 1);
  assert.equal(result.suppressed[0], v);
});

test("scanForSuppression: property-forced video (no attribute) -> blocked", () => {
  const v = new FakeVideo({ attr: false, prop: true });
  const result = scanForSuppression(new FakeRoot([v]));
  assert.equal(result.verdict, "blocked");
  assert.equal(result.suppressed.length, 1);
});

test("scanForSuppression: BS-001.1 multiple videos, only one suppressed -> blocked", () => {
  const clear = new FakeVideo({ attr: false, prop: false });
  const blocked = new FakeVideo({ attr: true, prop: false });
  const result = scanForSuppression(new FakeRoot([clear, blocked]));
  assert.equal(result.verdict, "blocked");
  // Only the suppressed one is collected.
  assert.equal(result.suppressed.length, 1);
  assert.equal(result.suppressed[0], blocked);
});

test("scanForSuppression: no suppressed video -> clear", () => {
  const a = new FakeVideo({ attr: false, prop: false });
  const b = new FakeVideo({ attr: false, prop: false });
  const result = scanForSuppression(new FakeRoot([a, b]));
  assert.equal(result.verdict, "clear");
  assert.equal(result.suppressed.length, 0);
});

test("scanForSuppression: no <video> at all -> clear, no throw", () => {
  const result = scanForSuppression(new FakeRoot([]));
  assert.equal(result.verdict, "clear");
  assert.equal(result.suppressed.length, 0);
});

test("scanForSuppression: tolerates a null root (non-inspectable context) -> clear", () => {
  const result = scanForSuppression(null);
  assert.equal(result.verdict, "clear");
  assert.equal(result.suppressed.length, 0);
});

test("scanForSuppression: descends into reachable (open) shadow roots", () => {
  const shadowVideo = new FakeVideo({ attr: true, prop: false });
  const host = new FakeElement(new FakeRoot([shadowVideo]));
  // Light DOM has no videos; the suppressed one lives inside an open shadow root.
  const root = new FakeRoot([], [host]);
  const result = scanForSuppression(root);
  assert.equal(result.verdict, "blocked");
  assert.equal(result.suppressed.length, 1);
  assert.equal(result.suppressed[0], shadowVideo);
});

test("scanForSuppression: de-duplicates a video reachable via multiple paths", () => {
  const v = new FakeVideo({ attr: true, prop: false });
  // Same video instance both in the light DOM list and inside a shadow root.
  const host = new FakeElement(new FakeRoot([v]));
  const root = new FakeRoot([v], [host]);
  const result = scanForSuppression(root);
  assert.equal(result.verdict, "blocked");
  assert.equal(result.suppressed.length, 1);
});

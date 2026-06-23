/**
 * Pure, DOM-shape-agnostic logic for the PiP Unblocker.
 *
 * @implements FS-001.1 (detect suppression), FS-001.4 (removal actions),
 *             FS-001.2/.3/.5 (icon states), FS-001.7 (operate on the click-time
 *             set), FS-001.10 (never enters PiP itself), FS-001.11 (green only on
 *             a real removal), BS-001.1/.2/.6
 *
 * This module is intentionally free of any `chrome.*` dependency so it can be
 * unit-tested in plain Node. It works on either real DOM nodes or duck-typed
 * doubles that expose the same minimal surface:
 *   - video: `hasAttribute`, `removeAttribute`, the reflected
 *     `disablePictureInPicture` property.
 *   - root:  `querySelectorAll('video')` and (for shadow traversal)
 *     `querySelectorAll('*')` whose elements may expose `shadowRoot`.
 *
 * It is a standard ES module with one source of truth and no build step. It is
 * consumed three ways, all importing THIS file:
 *   - the service worker statically `import`s it (`background.type: "module"` is
 *     a supported MV3 field, Chrome 111+);
 *   - the content script `import()`s it DYNAMICALLY from its
 *     `chrome.runtime.getURL(...)` extension URL — MV3 content scripts are
 *     always classic scripts (no `type: "module"`), so a static import there is
 *     impossible; this file is exposed via `web_accessible_resources` to make
 *     the dynamic import loadable;
 *   - Node imports it directly in the unit tests.
 */

/** The content attribute a page sets to forbid PiP. */
export const SUPPRESS_ATTR = "disablepictureinpicture";

/**
 * Is this single <video> currently PiP-suppressed?
 * A video is suppressed if it carries the `disablepictureinpicture` attribute
 * OR its `disablePictureInPicture` property evaluates to true.
 * @param {*} video
 * @returns {boolean}
 * @implements FS-001.1
 */
export function isVideoSuppressed(video) {
  if (!video) return false;
  try {
    const hasAttr =
      typeof video.hasAttribute === "function" &&
      video.hasAttribute(SUPPRESS_ATTR);
    const propForced = video.disablePictureInPicture === true;
    return Boolean(hasAttr || propForced);
  } catch (_e) {
    // Defensive: a hostile or exotic element must never break the scan.
    return false;
  }
}

/**
 * Collect every <video> reachable from `root`, descending into reachable
 * (open) shadow roots. Same-origin iframe documents are scanned by running the
 * content script inside them (all_frames) rather than reached from here.
 * @param {*} root  a Document, Element, or ShadowRoot (or a test double)
 * @returns {Array} de-duplicated list of video elements
 * @implements FS-001.1 (A3 reachable shadow DOM)
 */
export function collectVideos(root) {
  const out = [];
  if (!root || typeof root.querySelectorAll !== "function") return out;
  const seen = new Set();

  const pushUnique = (v) => {
    if (v && !seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  };

  try {
    const direct = root.querySelectorAll("video");
    for (let i = 0; i < direct.length; i++) pushUnique(direct[i]);
  } catch (_e) {
    /* ignore */
  }

  // Descend into open shadow roots of any element under this root.
  try {
    const all = root.querySelectorAll("*");
    for (let j = 0; j < all.length; j++) {
      const el = all[j];
      if (el && el.shadowRoot) {
        const nested = collectVideos(el.shadowRoot);
        for (let k = 0; k < nested.length; k++) pushUnique(nested[k]);
      }
    }
  } catch (_e) {
    /* ignore */
  }

  return out;
}

/**
 * Scan a root and return the page verdict plus the suppressed-video set.
 * @param {*} root
 * @returns {{ verdict: 'blocked'|'clear', suppressed: Array }}
 * @implements FS-001.1 (detect suppression across the page's videos)
 * @implements BS-001.1 (blocked if ANY video is suppressed; clear if none)
 */
export function scanForSuppression(root) {
  const videos = collectVideos(root);
  const suppressed = [];
  for (let i = 0; i < videos.length; i++) {
    if (isVideoSuppressed(videos[i])) suppressed.push(videos[i]);
  }
  return {
    verdict: suppressed.length > 0 ? "blocked" : "clear",
    suppressed,
  };
}

/**
 * Remove suppression from a single video: strip the attribute and force the
 * property to false so it no longer evaluates to true.
 *
 * Deliberately stops at *un-suppressing*: it never calls
 * `video.requestPictureInPicture()` — entering PiP stays the user's native
 * action. This is the code-level realization of the "unblock only" scope.
 * @param {*} video
 * @returns {boolean} true if the video had been suppressed and was changed
 * @implements FS-001.4 (strip attribute + neutralize property)
 * @implements FS-001.10 (PiP invocation stays native; we never enter PiP here)
 */
export function removeSuppressionFromVideo(video) {
  if (!video) return false;
  const wasSuppressed = isVideoSuppressed(video);
  try {
    if (
      typeof video.hasAttribute === "function" &&
      video.hasAttribute(SUPPRESS_ATTR) &&
      typeof video.removeAttribute === "function"
    ) {
      video.removeAttribute(SUPPRESS_ATTR);
    }
    // Neutralize the reflected property regardless of how it was set.
    try {
      video.disablePictureInPicture = false;
    } catch (_e) {
      /* property may be read-only on exotic elements; attribute strip stands */
    }
  } catch (_e) {
    return false;
  }
  return wasSuppressed;
}

/**
 * Remove suppression from every video in a set (whole-page scope).
 * Null/stale entries are skipped; the rest are processed.
 * @param {Array} videos
 * @returns {number} count of videos that were actually unblocked
 * @implements FS-001.4 (apply removal to every affected video)
 * @implements BS-001.2 (one click unblocks all currently-known videos)
 * @implements FS-001.7 (operates on the click-time set; stale entries skipped)
 */
export function removeSuppressionFromAll(videos) {
  if (!videos || typeof videos.length !== "number") return 0;
  let removed = 0;
  for (let i = 0; i < videos.length; i++) {
    if (removeSuppressionFromVideo(videos[i])) removed++;
  }
  return removed;
}

/**
 * Reduce per-tab facts to one of the three discrete icon states.
 *   { hasBlocker:false, removedByUser:false } -> 'default'
 *   { hasBlocker:true }                       -> 'orange'  (live blocker wins)
 *   { hasBlocker:false, removedByUser:true }  -> 'green'
 * A live blocker always beats a prior green confirmation (BS-001.6), and green
 * is never shown unless a real removal happened (FS-001.11).
 * @param {{hasBlocker?:boolean, removedByUser?:boolean}} [facts]
 * @returns {'default'|'orange'|'green'}
 * @implements FS-001.2 (orange when a blocker is present)
 * @implements FS-001.3 (default/neutral when no blocker)
 * @implements FS-001.5 (green confirms a removal)
 * @implements FS-001.11 (never green without a real removal — the `removedByUser`
 *             gate; default for the inert/no-removal case)
 * @implements BS-001.6 (active blocker beats a prior green)
 */
export function reduceIconState(facts) {
  const f = facts || {};
  if (f.hasBlocker) return "orange";
  if (f.removedByUser) return "green";
  return "default";
}

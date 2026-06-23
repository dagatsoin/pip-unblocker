/**
 * Service worker for the PiP Unblocker.
 *
 * Owns per-tab icon state (in memory only — no persistence, BS-001.4/A5),
 * maps it to the toolbar icon per tab (BS-001.3), and coordinates the
 * click-to-remove flow with the content script(s).
 *
 * Aggregation model: a tab may host several same-origin frames (all_frames).
 * Each frame independently reports whether it currently sees a blocker. The
 * worker keeps a per-frame view and treats the *tab* as blocked when ANY of
 * its frames reports a blocker (BS-001.1). `removedByUser` is tracked at the
 * tab level and only matters while no live blocker is present (BS-001.6).
 *
 * @implements FS-001.2 (orange when blocked) FS-001.3 (default when clear)
 * @implements FS-001.4 (drive click-to-remove) FS-001.5 (green on success)
 * @implements FS-001.6 (reset on navigation/reload)
 * @implements FS-001.7 (re-drive icon on dynamic/SPA re-reports, no reload)
 * @implements FS-001.11 (inert on failure: keep default, no surfaced error)
 * @implements BS-001.1 (tab blocked if ANY frame is blocked)
 * @implements BS-001.3 (icon state is per-tab) BS-001.4 (no cross-load memory)
 * @implements BS-001.5 (clear-page click is a no-op) BS-001.6 (blocker beats green)
 */
import { reduceIconState } from "./lib/pip-core.js";

const LOG = "[PiP-Unblocker][sw]";

/**
 * Master diagnostics switch. **Off by default** so a published store build is
 * quiet in the service-worker console. Flip this ONE constant to `true` to get
 * the verbose per-tab scan/report/lifecycle trace back during local debugging.
 * Genuine failures (a caught `setIcon` error) are reported via `warn()` and are
 * NOT gated by this flag.
 */
const DEBUG = false;

/** Verbose trace — compiled out (no-op) unless DEBUG is on. */
const debug = DEBUG ? (...args) => console.debug(LOG, ...args) : () => {};
/** Real-failure channel — always on, kept minimal. */
const warn = (...args) => console.warn(LOG, ...args);

/**
 * @typedef {Object} TabState
 * @property {Map<number, boolean>} frames  frameId -> hasBlocker in that frame
 * @property {boolean} removedByUser         the user clicked remove on this page
 */

/**
 * Per-tab state lives ONLY in this in-memory Map: no chrome.storage, no
 * persistence. It is keyed by tabId so one tab's verdict never colors another's
 * icon, and it is discarded on navigation/reload (see resetTab) so nothing
 * leaks across page loads.
 * @type {Map<number, TabState>} tabId -> state (in-memory, cleared on nav/reload)
 * @implements BS-001.3 (icon state is per-tab)
 * @implements BS-001.4 (state tied to the current page; no cross-load memory — A5)
 */
const tabs = new Map();

const ICON_SIZES = [16, 32, 48, 128];

/**
 * Per-state cache of decoded ImageData, keyed by state name ("default" |
 * "orange" | "green"). Each value is a size->ImageData map ready to hand to
 * `chrome.action.setIcon({ imageData })`. Decoded lazily once per state.
 * @type {Map<string, Promise<Record<number, ImageData>>>}
 */
const iconImageDataCache = new Map();

/**
 * Decode one PNG (by extension-relative path) into ImageData at its native
 * size. Runs entirely in the worker: `Image`/`document` don't exist here, so we
 * go through `fetch` -> `blob` -> `createImageBitmap` -> `OffscreenCanvas`.
 *
 * CRITICAL (the bug this fixes): `chrome.action.setIcon({ path })` from an MV3
 * service worker can fail with "Failed to fetch" for a *relative* path even
 * though the manifest renders the identical file — the worker's fetch base
 * differs. Resolving via `chrome.runtime.getURL` + decoding to raw pixels
 * sidesteps the quirk entirely (FS-001.2/.3/.5, BS-001.3).
 *
 * @param {string} relPath e.g. "icons/orange-16.png"
 * @param {number} size    expected square edge in px
 * @returns {Promise<ImageData>}
 */
async function decodeIcon(relPath, size) {
  const url = chrome.runtime.getURL(relPath);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${relPath} -> HTTP ${res.status}`);
  const blob = await res.blob();
  const bitmap = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d context on OffscreenCanvas");
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(bitmap, 0, 0, size, size);
  if (typeof bitmap.close === "function") bitmap.close();
  return ctx.getImageData(0, 0, size, size);
}

/**
 * Resolve (and memoize) the size->ImageData map for one icon state. The decode
 * happens at most once per state for the lifetime of the worker; every later
 * `setIcon` is then a cheap cache hit (the prompt's "decode once and cache").
 * @param {'default'|'orange'|'green'} state
 * @returns {Promise<Record<number, ImageData>>}
 */
function loadIconImageData(state) {
  let pending = iconImageDataCache.get(state);
  if (!pending) {
    pending = (async () => {
      const entries = await Promise.all(
        ICON_SIZES.map(async (size) => [
          size,
          await decodeIcon(`icons/${state}-${size}.png`, size),
        ])
      );
      return Object.fromEntries(entries);
    })().catch((e) => {
      // Don't poison the cache on failure — drop it so a later call retries.
      iconImageDataCache.delete(state);
      throw e;
    });
    iconImageDataCache.set(state, pending);
  }
  return pending;
}

/** @returns {TabState} the (created if missing) state record for a tab. */
function getTab(tabId) {
  let s = tabs.get(tabId);
  if (!s) {
    s = { frames: new Map(), removedByUser: false };
    tabs.set(tabId, s);
  }
  return s;
}

/** A tab is blocked if any of its frames currently reports a blocker. */
function tabHasBlocker(state) {
  for (const has of state.frames.values()) if (has) return true;
  return false;
}

/**
 * Recompute the icon for a tab from its current facts and apply it.
 * Safe to call often; tolerates tabs that have gone away.
 *
 * `chrome.action.setIcon` is wrapped in try/catch and logged: a silent
 * failure here (decode error, tab gone) would leave the *default* icon in
 * place, which looks exactly like "no blocker found" — so we surface it
 * explicitly for live QA.
 *
 * Icons are supplied as decoded `imageData` (not a `path`) because the worker's
 * `setIcon({ path })` 404s with "Failed to fetch" in MV3 — see `decodeIcon`.
 *
 * @implements FS-001.2 (drive the orange icon when blocked)
 * @implements FS-001.3 (drive the default icon when clear)
 * @implements FS-001.5 (drive the green icon after a removal)
 * @implements BS-001.3 (apply the icon per `tabId`)
 * @implements FS-001.11 (on a setIcon failure / gone tab, stay inert — keep the
 *             default icon, surface no error to the user)
 * @implements BS-001.8 (harmless/inert on non-applicable pages and torn-down tabs)
 */
async function refreshIcon(tabId) {
  const state = tabs.get(tabId);
  const iconState = reduceIconState({
    hasBlocker: state ? tabHasBlocker(state) : false,
    removedByUser: state ? state.removedByUser : false,
  });
  try {
    const imageData = await loadIconImageData(iconState);
    await chrome.action.setIcon({ tabId, imageData });
    debug(`setIcon OK tab=${tabId} state=${iconState}`);
  } catch (e) {
    // Tab closed / not scriptable, or a decode failed — nothing to signal.
    // Stay inert (BS-001.8), but warn so a genuine wiring failure is visible
    // even in a published build (this channel is NOT gated by DEBUG).
    warn(
      `setIcon FAILED tab=${tabId} state=${iconState}: ${
        e && e.message ? e.message : e
      }`
    );
  }
  return iconState;
}

/**
 * Forget everything we knew about a tab's current page, so the next page is
 * detected from scratch and no stale verdict survives the load.
 * @implements FS-001.6 (recompute/reset state on genuine navigation and reload)
 * @implements BS-001.4 (state is tied to the current page; nothing carries over)
 */
function resetTab(tabId) {
  tabs.delete(tabId);
}

// ---- messaging from content scripts --------------------------------------

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || !sender || !sender.tab) return; // ignore non-tab senders
  const tabId = sender.tab.id;
  const frameId = typeof sender.frameId === "number" ? sender.frameId : 0;

  if (msg.type === "report") {
    // A frame is telling us whether it currently sees a blocker. Folding each
    // per-frame verdict into the tab (and letting `tabHasBlocker` OR them) is
    // how a single suppressed frame makes the whole tab "blocked"; later
    // reports (dynamic videos, SPA re-scans) update the icon without a reload.
    // @implements FS-001.1 (consume the content script's detection verdict)
    // @implements BS-001.1 (tab is blocked if ANY frame reports a blocker)
    // @implements FS-001.7 (re-reports re-drive the icon with no reload)
    const state = getTab(tabId);
    state.frames.set(frameId, msg.verdict === "blocked");
    debug(`report tab=${tabId} frame=${frameId} verdict=${msg.verdict}`);
    refreshIcon(tabId);
    return; // no response needed
  }

  if (msg.type === "ping") {
    // Liveness probe used by TS-002 smoke check.
    sendResponse({ type: "pong" });
    return true;
  }
});

// ---- toolbar click: remove on blocked, no-op otherwise -------------------
//
// @implements FS-001.4 (on click, drive removal across every affected video)
// @implements FS-001.5 (transition to green once a removal succeeds)
// @implements BS-001.2 (one click fans out to all frames → all known videos)
// @implements BS-001.5 (clicking a clear/non-inspectable tab is a no-op)
// @implements FS-001.11 (never go green unless ≥1 real removal occurred)

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab || typeof tab.id !== "number") return;
  const tabId = tab.id;
  const state = tabs.get(tabId);

  // No-op on a tab that is not currently blocked (BS-001.5, FS-001.11):
  // clear pages, no-video pages, and non-inspectable contexts never go green.
  if (!state || !tabHasBlocker(state)) {
    return;
  }

  // Ask every frame in the tab to remove suppression from its videos.
  let totalRemoved = 0;
  try {
    const responses = await sendToAllFrames(tabId, { type: "remove" });
    for (const r of responses) {
      if (r && typeof r.removed === "number") totalRemoved += r.removed;
    }
  } catch (_e) {
    totalRemoved = 0;
  }

  // Green ONLY when at least one video was actually unblocked (FS-001.11).
  if (totalRemoved >= 1) {
    state.removedByUser = true;
    // The content script's observer will re-report `clear` for each frame
    // shortly after; clear our frame flags now so the icon reflects success
    // immediately rather than waiting for the next report.
    for (const fid of state.frames.keys()) state.frames.set(fid, false);
  }
  refreshIcon(tabId);
});

/**
 * Send a message to every frame of a tab and collect their responses.
 * Uses chrome.tabs.sendMessage per discovered frame so we can target
 * same-origin sub-frames too (cross-origin frames simply don't answer).
 * @returns {Promise<Array>} responses (failed frames are omitted)
 * @implements BS-001.2 (whole-page scope: removal reaches every same-origin frame)
 * @implements FS-001.7 (re-discovers the current frame set at click time)
 *             Cross-origin frames don't answer — known v1 limitation (A2).
 */
async function sendToAllFrames(tabId, message) {
  let frames = [{ frameId: 0 }];
  try {
    const all = await chrome.webNavigation?.getAllFrames?.({ tabId });
    if (Array.isArray(all) && all.length) frames = all;
  } catch (_e) {
    // webNavigation not available; fall back to messaging known frames.
    const known = tabs.get(tabId);
    if (known) frames = [...known.frames.keys()].map((frameId) => ({ frameId }));
    if (!frames.length) frames = [{ frameId: 0 }];
  }

  const results = await Promise.all(
    frames.map(async (f) => {
      try {
        return await chrome.tabs.sendMessage(tabId, message, {
          frameId: f.frameId,
        });
      } catch (_e) {
        return null; // frame can't receive (e.g. cross-origin) — skip it
      }
    })
  );
  return results.filter(Boolean);
}

// ---- lifecycle: reset per-tab state on navigation / reload ---------------
//
// CRITICAL (hypothesis #2): on SPA sites like Netflix, `chrome.tabs.onUpdated`
// fires repeatedly — `status: "loading"`/`"complete"` AND `changeInfo.url` on
// every `history.pushState`/`replaceState`. The previous implementation reset
// the tab on *every* `status === "loading"`, so a reset could land AFTER the
// content script had already reported `blocked` for the freshly-added player
// video, wiping the state back to default. The content script then never
// re-reported (the video was already in the DOM, no new mutation), leaving the
// icon stuck NEUTRAL — exactly the observed Netflix failure.
//
// Fix: reset ONLY on a genuine *top-frame document* navigation, detected via
// `chrome.webNavigation.onCommitted` with `frameId === 0`. A real document
// load (full navigation or hard reload) commits the top frame; SPA history
// updates do NOT (they fire `onHistoryStateUpdated` instead, handled below
// without nuking detection). This makes the reset precise so it can never race
// a live detection on a same-document SPA transition.

/**
 * True for the top frame committing a brand-new document (full navigation or
 * hard reload). Sub-frame commits are ignored (we only own top-frame state for
 * reset purposes). Note: `onCommitted` does NOT fire for SPA history updates
 * (pushState/replaceState/popstate) — those arrive via `onHistoryStateUpdated`
 * and must not reset state — so a top-frame commit here is always a real
 * document load.
 */
function isTopDocumentNavigation(details) {
  return details && details.frameId === 0;
}

if (chrome.webNavigation && chrome.webNavigation.onCommitted) {
  // A real top-frame document load: discard prior page state and go back to
  // default until the freshly-injected content script reports.
  // @implements FS-001.6 (reset + re-evaluate on genuine navigation/reload)
  // @implements BS-001.4 (prior page's state is discarded, not carried over)
  chrome.webNavigation.onCommitted.addListener((details) => {
    if (!isTopDocumentNavigation(details)) return;
    debug(
      `top-frame onCommitted tab=${details.tabId} -> reset (${details.transitionType})`
    );
    resetTab(details.tabId);
    refreshIcon(details.tabId);
  });

  // SPA navigation (pushState/replaceState/popstate). The document is the SAME,
  // so we must NOT reset detection state — doing so was the bug. We leave state
  // intact; the content script re-runs its own scan on the history change and
  // re-reports, which keeps (or updates) the icon correctly.
  // @implements FS-001.7 (handle in-app/SPA navigation without a reload: keep
  //             state and re-assert the icon while the content script re-detects)
  if (chrome.webNavigation.onHistoryStateUpdated) {
    chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
      if (details.frameId !== 0) return;
      debug(
        `top-frame onHistoryStateUpdated tab=${details.tabId} (no reset; awaiting re-report)`
      );
      // No resetTab here on purpose. Just re-apply whatever we currently know
      // so a stale-cleared icon can be re-asserted promptly.
      refreshIcon(details.tabId);
    });
  }
} else {
  // Fallback for environments without webNavigation: be conservative and only
  // reset when a top-frame load *starts*. We still avoid wiping on SPA url-only
  // changes by ignoring updates that carry a `url` without a `loading` status.
  // @implements FS-001.6 (recompute on navigation/reload — fallback path)
  // @implements BS-001.4 (discard prior page state on a fresh load)
  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    const isFreshLoad =
      changeInfo.status === "loading" &&
      typeof changeInfo.url !== "string"; // url-only change == SPA, skip
    if (isFreshLoad) {
      debug(`onUpdated loading tab=${tabId} -> reset (fallback)`);
      resetTab(tabId);
      refreshIcon(tabId);
    }
  });
}

// A closed/replaced tab keeps no state — per-tab isolation and no carry-over.
// @implements BS-001.3 (state is per-tab; a gone tab's state is reclaimed)
// @implements BS-001.4 (no state persists past the tab/page it belonged to)
chrome.tabs.onRemoved.addListener((tabId) => {
  tabs.delete(tabId);
});

chrome.tabs.onReplaced.addListener((addedTabId, removedTabId) => {
  tabs.delete(removedTabId);
});

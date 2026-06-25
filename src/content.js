/**
 * Content script for the PiP Unblocker. Runs at document_start in the top
 * document and in every same-origin frame (all_frames). Cross-origin frames
 * are a known v1 limitation (A2) — they run their own isolated copy that can
 * only see their own document, which is the desired same-origin behavior.
 *
 * Responsibilities:
 *   - Detect PiP suppression in this frame and report blocked/clear to the
 *     service worker (FS-001.1, BS-001.1).
 *   - Re-detect on dynamically added videos and on `disablepictureinpicture`
 *     attribute changes via a lightweight MutationObserver (FS-001.7/.8).
 *   - Re-detect across SPA navigations (pushState/replaceState/popstate) so a
 *     player added by a single-page app (e.g. Netflix /watch) is reported even
 *     though no new content script is injected (hypothesis #3).
 *   - On a `remove` command, strip the attribute + neutralize the property on
 *     all known suppressed videos and reply with the count removed (FS-001.4).
 *   - After the user has unblocked this frame, automatically re-remove any
 *     re-applied suppression to keep PiP available; fall back to reporting
 *     blocked if re-removal cannot keep up (FS-001.8, BS-001.6, A4).
 *
 * MODULE LOADING (critical): MV3 manifest-declared content scripts are ALWAYS
 * classic scripts — `content_scripts[].type: "module"` is NOT a supported field,
 * so a top-level static `import` here would throw `SyntaxError: Cannot use
 * import statement outside a module` at PARSE time and the whole script would
 * never run. Instead we keep `pip-core.js` as the single ESM source of truth and
 * pull it in at runtime via a DYNAMIC `import()` of its extension URL (the file
 * is exposed through `web_accessible_resources`). All initialization therefore
 * runs inside an async IIFE that AWAITS the module first (see bootstrap below).
 *
 * @implements FS-001.1 (detect + report) FS-001.4 (remove on command)
 * @implements FS-001.7 (dynamic + SPA re-detect) FS-001.8 (reactive re-removal;
 *             robust guarantee deferred to EPIC-004)
 * @implements FS-001.11 (inert where no document is inspectable)
 * @implements BS-001.1 (per-frame verdict) BS-001.2 (whole-frame removal)
 * @implements BS-001.6 (report blocked when re-removal can't keep up)
 */

const LOG = "[PiP-Unblocker]";

/**
 * Master diagnostics switch. **Off by default** so a published store build is
 * quiet in the page console. Flip this ONE constant to `true` to get the
 * verbose per-frame scan/report/SPA trace back during local debugging. Genuine
 * failures (the pip-core module failing to load) are reported via `warn()` and
 * are NOT gated by this flag.
 */
const DEBUG = false;

/** Verbose trace — compiled out (no-op) unless DEBUG is on. */
const debug = DEBUG ? (...args) => console.debug(LOG, ...args) : () => {};
/** Real-failure channel — always on, kept minimal. */
const warn = (...args) => console.warn(LOG, ...args);

// Pure logic, bound once the dynamic import resolves in bootstrap(). Declared
// with `let` and assigned (not destructured at module top) because this file is
// a CLASSIC script — there is no static `import` to hoist these from.
let scanForSuppression;
let removeSuppressionFromAll;
let collectVideos;
let isVideoSuppressed;

// Whether the user has invoked removal in THIS frame for the current page.
// Drives auto-re-removal of any re-applied suppression (FS-001.8 / A4).
let removedByUser = false;

// The most recent suppressed-video set seen by a scan (the click-time set).
let lastSuppressed = [];

// Last verdict we sent, so SPA re-scans can be logged with useful before/after.
let lastReported = null;

// True until this content-script instance has successfully sent its first
// report. A fresh content-script instance only exists after a genuine document
// load (full navigation or hard reload) — never for an SPA history change, which
// reuses the same instance — so the FIRST report carries `fresh: true` to tell
// the service worker "this is a brand-new page; discard any prior state for this
// tab." This replaces the old webNavigation.onCommitted reset, letting us drop
// the `webNavigation` permission (and its "read your browsing history" warning).
let firstReport = true;

/**
 * Run a scan of this frame's document. If the user has already opted to
 * unblock here, transparently re-remove any suppression the page re-applied
 * before reporting, so the icon can stay green.
 * @param {string} [reason]  why we scanned (for diagnostics)
 * @returns {'blocked'|'clear'} the verdict reported for this frame
 * @implements FS-001.1 (detect this frame's suppression on every scan)
 * @implements FS-001.8 (v1 reactive best-effort re-removal of re-applied
 *             suppression after the user has unblocked; the robust guarantee
 *             against an aggressive/persistent re-forcer is deferred to
 *             EPIC-004 / MILESTONE-002. When re-removal can't keep up, the
 *             post-rescan verdict stays 'blocked' and we report it honestly.)
 * @implements BS-001.6 (a still-suppressed video after re-removal → report
 *             'blocked', so an active blocker beats the prior green)
 */
function scanAndReport(reason = "scan") {
  let { verdict, suppressed } = scanForSuppression(document);

  // Diagnostic: how many videos exist and what each one's status is. These land
  // in the PAGE console, which the live QA automation reads on the Netflix tab.
  // Gated by DEBUG so a published build does neither the logging NOR the extra
  // per-video inspection work.
  if (DEBUG) {
    try {
      const videos = collectVideos(document);
      debug(`[${reason}] scan: ${videos.length} video(s), verdict=${verdict}`);
      for (let i = 0; i < videos.length; i++) {
        const v = videos[i];
        const hasAttr =
          typeof v.hasAttribute === "function" &&
          v.hasAttribute("disablepictureinpicture");
        const prop = v.disablePictureInPicture === true;
        debug(
          `  video[${i}] attr=${hasAttr} prop=${prop} suppressed=${isVideoSuppressed(
            v
          )}`
        );
      }
    } catch (_e) {
      /* diagnostics must never break detection */
    }
  }

  if (removedByUser && suppressed.length > 0) {
    // Auto re-removal: the page re-applied the blocker after we cleared it.
    removeSuppressionFromAll(suppressed);
    const rescan = scanForSuppression(document);
    verdict = rescan.verdict; // 'clear' if we kept up, 'blocked' if not (BS-001.6)
    suppressed = rescan.suppressed;
  }

  lastSuppressed = suppressed;
  report(verdict, reason);
  return verdict;
}

/**
 * Tell the service worker this frame's current verdict. Best-effort.
 * @implements FS-001.1 (surface the detection result for this frame)
 * @implements BS-001.1 (the per-frame blocked/clear verdict the worker ORs)
 */
function report(verdict, reason = "scan") {
  lastReported = verdict;
  // Tag only the first successful report of this instance as `fresh` so the
  // worker resets the tab's prior-page state exactly once, on a genuine load.
  const fresh = firstReport;
  try {
    chrome.runtime.sendMessage({ type: "report", verdict, fresh });
    // Only consume the `fresh` flag once the message actually went out; if the
    // send threw we keep it true so the next scan retries the reset signal.
    firstReport = false;
    debug(`report sent: verdict=${verdict} fresh=${fresh} (${reason})`);
  } catch (_e) {
    // Service worker asleep or context torn down — the next scan will retry.
    debug(`report send failed (SW asleep?); will retry`);
  }
}

// ---- remove command from the worker --------------------------------------
//
// @implements FS-001.4 (strip the attribute + neutralize the property on every
//             suppressed video in this frame)
// @implements BS-001.2 (one command clears all currently-known suppressed videos)
// @implements FS-001.7 (re-scan NOW so we act on the live click-time set, not a
//             stale snapshot — covers videos added since the last report)

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || msg.type !== "remove") return;

  // Defensive: the pure logic is bound by the dynamic import in bootstrap().
  // The worker only issues `remove` after a frame reported `blocked`, which
  // itself requires the module to be loaded — so this can't realistically fire
  // before binding. Guard anyway so a race never throws a TypeError.
  if (typeof scanForSuppression !== "function") {
    debug(`remove command received before module ready; ignoring`);
    sendResponse({ removed: 0 });
    return true;
  }

  // Re-scan right now so we act on the freshest set (FS-001.7 click-time set),
  // not a stale snapshot.
  const { suppressed } = scanForSuppression(document);
  const removed = removeSuppressionFromAll(suppressed);
  debug(`remove command: unblocked ${removed} video(s)`);

  if (removed > 0) removedByUser = true;

  // Re-evaluate and report the post-removal verdict for this frame.
  scanAndReport("post-remove");

  sendResponse({ removed });
  return true; // async-safe response
});

// ---- dynamic / re-applied suppression watch ------------------------------
//
// @implements FS-001.7 (re-detect videos added/replaced after first evaluation)
// @implements FS-001.8 (re-detect re-applied `disablepictureinpicture` so the
//             reactive re-removal in scanAndReport can fire; best-effort, with
//             the robust guarantee deferred to EPIC-004)

let scheduled = false;
let scheduledReason = "mutation";
/** Coalesce bursts of mutations into a single scan on the next microtask-ish tick. */
function scheduleScan(reason = "mutation") {
  scheduledReason = reason;
  if (scheduled) return;
  scheduled = true;
  setTimeout(() => {
    scheduled = false;
    scanAndReport(scheduledReason);
  }, 0);
}

function startObserver() {
  if (!document || !document.documentElement) return;
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === "childList" && (m.addedNodes.length || m.removedNodes.length)) {
        scheduleScan("mutation:childList");
        return;
      }
      if (m.type === "attributes" && m.attributeName === "disablepictureinpicture") {
        scheduleScan("mutation:attr");
        return;
      }
    }
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["disablepictureinpicture"],
  });
  debug(`MutationObserver started on <html> (subtree)`);
}

// ---- SPA history navigation watch (FS-001.7, hypothesis #3) ---------------
//
// Single-page apps (Netflix, YouTube, etc.) swap the player and route via the
// History API WITHOUT a document reload, so no new content script is injected.
// If the suppressed <video> is already in the DOM at that point (or is added
// without a childList mutation we caught), nothing would re-report and the icon
// could be left stale. We patch pushState/replaceState and listen to popstate
// to force a fresh scan + report on every SPA navigation.

let spaScheduled = false;
/** Debounce SPA navigations: routes often fire several updates in a row. */
function onSpaNavigation(kind) {
  if (spaScheduled) return;
  spaScheduled = true;
  // A short delay lets the SPA mount its new player video before we scan.
  setTimeout(() => {
    spaScheduled = false;
    debug(`SPA navigation (${kind}); re-detecting`);
    scanAndReport(`spa:${kind}`);
    // Some SPAs mount the <video> a beat later; do one more pass shortly after.
    setTimeout(() => scanAndReport(`spa:${kind}:settle`), 600);
  }, 0);
}

/**
 * Patch pushState/replaceState and listen to popstate so an in-app navigation
 * (which injects no new content script) still re-runs detection and re-reports.
 * @implements FS-001.7 (handle in-app/SPA navigations: re-detect without reload)
 */
function hookHistory() {
  try {
    const wrap = (name) => {
      const orig = history[name];
      if (typeof orig !== "function" || orig.__pipWrapped) return;
      const wrapped = function (...args) {
        const ret = orig.apply(this, args);
        try {
          onSpaNavigation(name);
        } catch (_e) {
          /* never break the page's navigation */
        }
        return ret;
      };
      wrapped.__pipWrapped = true;
      history[name] = wrapped;
    };
    wrap("pushState");
    wrap("replaceState");
    window.addEventListener("popstate", () => onSpaNavigation("popstate"));
    debug(`history hooks installed (pushState/replaceState/popstate)`);
  } catch (_e) {
    // If history is frozen or unavailable, fall back to the MutationObserver,
    // which still catches DOM-level player swaps.
    debug(`could not hook history; relying on MutationObserver`);
  }
}

// ---- bootstrap -----------------------------------------------------------
//
// This file is loaded as a CLASSIC content script (MV3 content scripts cannot be
// ES modules — see the header note), so we cannot statically `import` the shared
// pure logic. We dynamically `import()` it from its web-accessible extension URL
// and run all initialization AFTER the module resolves. The `onMessage` listener
// for `remove` is registered synchronously above (so it exists even before the
// module loads), but its body only runs once the user clicks, by which point the
// import below has long since resolved.
//
// This bootstrap runs on Netflix pages because the manifest scopes the content
// script to `*://*.netflix.com/*` (the extension's single, declared target).
// @implements FS-001.9 (operate on the declared Netflix host scope)
// @implements BS-001.7 (availability on Netflix, no per-site config in v1 — A1)

(async function bootstrap() {
  // Guard: only operate where there is an inspectable document.
  // @implements FS-001.11 (graceful/inert where the feature can't apply: bail
  //             quietly with no error when there is no document to inspect)
  // @implements BS-001.8 (harmless/inert on non-applicable contexts)
  if (typeof document === "undefined" || !document) return;

  // Resolve the single ESM source of truth at runtime. `chrome.runtime.getURL`
  // yields the chrome-extension:// URL of the module, which is loadable from the
  // content-script (isolated-world) context because it's listed under
  // `web_accessible_resources` in the manifest.
  try {
    const core = await import(chrome.runtime.getURL("src/lib/pip-core.js"));
    scanForSuppression = core.scanForSuppression;
    removeSuppressionFromAll = core.removeSuppressionFromAll;
    collectVideos = core.collectVideos;
    isVideoSuppressed = core.isVideoSuppressed;
  } catch (e) {
    // Without the pure logic there is nothing we can do — surface it (always on,
    // even in a published build) so a wiring/permissions regression (e.g. a
    // missing web_accessible_resources entry) is visible rather than silent.
    warn(`FAILED to load pip-core module; detection disabled:`, e);
    return;
  }

  debug(
    `content script loaded @ ${location.href} (readyState=${document.readyState})`
  );

  // Initial scan (the DOM may still be filling in if we resolved early).
  scanAndReport("bootstrap");

  // Re-scan at the usual readiness milestones to catch videos added during
  // parsing and right after load.
  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      () => scanAndReport("DOMContentLoaded"),
      { once: true }
    );
  } else {
    // The module import may have resolved after DOMContentLoaded already fired;
    // the bootstrap scan above covers that case.
    scanAndReport("DOMContentLoaded:already");
  }
  window.addEventListener("load", () => scanAndReport("load"), { once: true });

  // SPA history navigations re-run detection (Netflix /watch transitions).
  hookHistory();

  // Watch for later additions and attribute re-application.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startObserver, { once: true });
  } else {
    startObserver();
  }
})();

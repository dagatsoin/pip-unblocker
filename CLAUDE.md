# CLAUDE.md — `chrome-plugin-pip` (PiP Unblocker extension)

Package-specific rules for the PiP Unblocker Chrome extension. Read this before
any work in this package.

## What this is

A single-purpose **Manifest V3** Chrome extension that re-enables
Picture-in-Picture on pages that suppress it. The entire UI is the toolbar
icon (three states). Implements **FS-001** (`specs/FS-001-pip-unblocker.md`).

## Stack & conventions

- **Plain JavaScript, no build step.** The `manifest.json` is static and points
  directly at source files in `src/`. Do **not** introduce a bundler unless a
  future requirement genuinely needs one — the deliverable is an unpacked
  extension loaded straight from this directory.
- **Shared pure logic is an ES module; the two contexts load it differently.**
  - The **service worker** is a real ES module (`background.type: "module"`, a
    supported MV3 field) and **statically `import`s** `src/lib/pip-core.js`.
  - The **content script is a CLASSIC script**, NOT a module. MV3 manifest-declared
    content scripts do **not** support `type: "module"` — that field is not a valid
    `content_scripts[]` property, so the file is loaded as a classic script and any
    top-level static `import` throws `SyntaxError: Cannot use import statement
    outside a module` at parse time (this was the original Netflix bug). The content
    script instead **dynamically `import()`s** the shared module from its
    `chrome.runtime.getURL("src/lib/pip-core.js")` URL inside an async bootstrap;
    that URL is loadable because the module is listed under
    **`web_accessible_resources`** in the manifest.
  - `src/lib/pip-core.js` stays a single ESM source of truth (Node imports it in
    tests). Dynamic `import()` requires Chrome 111+ (declared via
    `minimum_chrome_version`).
- **Pure logic is isolated and unit-tested.** All DOM/icon decision logic lives
  in `src/lib/pip-core.js` with **no `chrome.*` dependency**, so it runs in Node
  tests. The `chrome.*` wiring (service worker, content-script bootstrap) is
  **not** unit-tested — it is validated in the browser against the fixtures.
- **TDD for the pure logic.** When changing detection / removal / icon-reducer
  behavior, update or add a test in `test/` first, then implement.
- Add `@implements FS-001.x` / `BS-001.x` JSDoc tags on functions and fixture
  comments that realize a specific requirement.

## Layout

```
chrome-plugin-pip/
├── manifest.json              # MV3 manifest (static; references src/ + icons/)
├── package.json               # scripts only: `test`, `icons` (no deps)
├── README.md                  # load + test + QA instructions
├── src/
│   ├── background.js          # service worker: per-tab state, setIcon, onClicked, messaging
│   ├── content.js             # content script: detect/report, MutationObserver, remove handler
│   └── lib/
│       └── pip-core.js        # PURE logic (detect / remove / icon reducer) — unit-tested
├── icons/                     # generated PNGs: {default,orange,green}-{16,32,48,128}.png
├── scripts/
│   └── generate-icons.mjs     # regenerates icons/ (dependency-free PNG encoder)
├── fixtures/                  # QA pages, openable via file:// (TS-009)
│   ├── blocked.html, blocked-property.html, blocked-multi.html
│   ├── clear.html, no-video.html
│   ├── dynamic-add.html, reapply.html, iframe-same-origin.html
│   ├── spa-pushstate.html     # SPA pushState + late blocked video (Netflix-shaped regression)
│   ├── sample-stream.js       # canvas-captured stream so PiP is actually invocable
│   └── _status.js             # on-page live attr/property inspector for QA
└── test/
    ├── detect.test.mjs, remove.test.mjs, icon-state.test.mjs
    └── helpers/fake-dom.mjs   # dependency-free DOM doubles
```

## Commands

- `npm test` — runs the pure-logic unit tests (`node --test`). No deps.
- `npm run icons` — regenerates the `icons/` PNG set from `scripts/generate-icons.mjs`.
  Re-run after changing colors/sizes/glyph.

## Ports

None. Pure client-side extension, no backend, **no port allocated**. Fixtures
load over `file://`. If a local static server is ever needed for fixtures,
allocate a range per `~/.claude/port-registry.md` and document it here.

## Architecture notes (for future changes)

- **State ownership.** The service worker owns per-tab state in an in-memory
  `Map` only — no persistence (BS-001.4 / A5). State is reset **only** on a
  genuine top-frame document load via `chrome.webNavigation.onCommitted`
  (`frameId === 0`). SPA history updates (`onHistoryStateUpdated`) do **not**
  reset state — resetting on the old, noisy `tabs.onUpdated` `status:"loading"`
  signal raced live detection on SPA sites (Netflix) and stranded the icon on
  default; that path remains only as a fallback when `webNavigation` is absent.
- **SPA re-detection.** The content script patches `pushState`/`replaceState`
  and listens to `popstate` to re-scan + re-report across in-app navigations
  (e.g. Netflix `/watch`), since no new content script is injected for those.
- **Diagnostics.** Both contexts log under the `[PiP-Unblocker]` prefix
  (content-script logs land in the page console; SW logs in the worker console),
  and `chrome.action.setIcon` is wrapped in try/catch that logs success/failure
  so a silent icon-wiring failure is visible during live QA.
- **Per-frame aggregation.** Each frame (top + same-origin children) reports its
  own `blocked|clear` verdict; the worker marks the **tab** blocked if **any**
  frame is blocked (BS-001.1). Cross-origin frames don't report — known v1
  limitation (A2).
- **Green honesty.** Green is set **only** when a click produced ≥1 real removal
  (FS-001.11). The icon reducer (`reduceIconState`) makes a live blocker always
  beat a prior green (BS-001.6).
- **Continuous protection.** After the user unblocks a frame, the content
  script's `MutationObserver` auto-re-removes re-applied suppression and keeps
  reporting; if it can't keep up, the frame reports `blocked` again → orange
  (FS-001.8 / A4).

## Known v1 limitations

- Cross-origin iframe videos are not detected/removed (A2).
- Deeply/closed shadow DOM is not reachable (A3); open shadow roots are scanned.
- No persistence across page loads (A5); each load is handled fresh.
- The extension never enters PiP itself — the user invokes native PiP (FS-001.10).

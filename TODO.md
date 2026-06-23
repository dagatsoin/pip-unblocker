# TODO — PiP Unblocker (handoff for a fresh session)

> Relay note: this file is written so a brand-new Claude "Cowork" session with
> **zero prior context** can pick up the project. Read this top-to-bottom first,
> then dive into the file pointers at the bottom. Accuracy over speed — every
> path and ticket ID below has been verified to exist.

---

## What this project is

**PiP Unblocker** is a single-purpose **Manifest V3** Chrome/Brave extension that
**re-enables Picture-in-Picture (PiP)** on sites that deliberately suppress it.

How it works (the entire UI is one toolbar icon, three states):
- It detects a `<video>` carrying the `disablepictureinpicture` **attribute**
  and/or the `disablePictureInPicture` **property** set to `true`.
- When a blocker is present on the active tab, the per-tab toolbar icon turns
  **orange** automatically (no user action).
- The user **clicks** the icon → the extension **strips** the suppression from
  every affected video → the icon turns **green**.
- The user then invokes their **browser's native PiP** on the video. The
  extension **never enters PiP itself** (v1 is unblock-only, FS-001.10).
- Grey/slate icon = nothing to do on this page (no blocker, or nothing to inspect).

Tech: **plain JavaScript, no build step**, loads **unpacked**. Pure decision logic
is isolated in `src/lib/pip-core.js` (no `chrome.*`, unit-tested in Node); the
`chrome.*` wiring lives in `src/background.js` (service worker) and
`src/content.js` (content script).

---

## Current status (as of 2026-06-23)

- **v1 is built, unit-tested (28/28 passing), and verified working end-to-end
  live on Netflix in Brave.** It is **accepted as done by the product owner**
  (PO). See `kanban/chrome-plugin-pip/done/MILESTONE-001-pip-unblocker-v1.md`.
- **A publish-ready package and full store materials exist. Nothing has been
  submitted to any store yet.** The zip `dist/pip-unblocker-v1.0.0.zip` is built
  (16 runtime files: `manifest.json`, `src/` ×3, `icons/` ×12).
- **Security review: PASS.** Permissions are minimized to exactly `webNavigation`
  plus the `<all_urls>` content-script match (declared via
  `content_scripts[].matches`, not a separate `host_permissions` key). No
  network, no storage, no remote code, no analytics.
- **Deferred:** EPIC-004 (robustness hardening) is intentionally **in backlog**,
  out of v1 scope. See below.

### Three browser-only gotchas already solved (don't re-trip on these)

These were discovered during live QA and are baked into the current code; if you
touch the wiring, preserve them (also documented in `CLAUDE.md` and the Milestone):

1. **MV3 content scripts can't be ES modules.** The content script loads the
   shared pure logic via a dynamic `import(chrome.runtime.getURL(...))`, which
   requires `src/lib/pip-core.js` to be listed in `web_accessible_resources`.
2. **`chrome.action.setIcon` can't fetch an icon *path* from the MV3 service
   worker.** Icons are set via decoded `imageData`, not `path`.
3. **Netflix-style SPA `pushState` navigations were wiping per-tab state.** State
   resets now go through `chrome.webNavigation.onCommitted` (top-frame document
   loads, `frameId === 0`) only — SPA history updates do **not** reset state.

---

## TODO — prioritized

### 1. Publish to the Chrome Web Store  (immediate; mostly MANUAL — needs the human's account)

The repo is fully prepared; these steps happen in a browser signed into the
human's own developer account. Full walkthrough: `publishing/PUBLISHING.md`.

- [ ] **Capture store screenshots.** Need **≥1** at **1280×800** (preferred) or
      **640×400**, PNG/JPEG, max 5. The `fixtures/` pages give clean,
      reproducible grey→orange→green shots over `file://`
      (`fixtures/clear.html` = grey, `fixtures/blocked.html` = orange→green).
      Plan + suggested shot list: `publishing/STORE.md` ("Screenshot plan").
      **This is a manual capture in a real browser — cannot be generated.**
- [ ] **Register the CWS developer account** (one-time **$5**, per account) at
      <https://chrome.google.com/webstore/devconsole>. Skip if already paid.
- [ ] **Regenerate the package** if anything changed: `npm test` (expect 28/28)
      then `npm run package` → `dist/pip-unblocker-v1.0.0.zip`.
- [ ] **Create the item & upload the zip.** Dashboard → Items → Add new item →
      upload `dist/pip-unblocker-v1.0.0.zip`.
- [ ] **Fill the Store listing** from `publishing/STORE.md` (detailed
      description, single-purpose statement, permission justifications, category
      = Productivity).
- [ ] **Fill Privacy practices** from `publishing/PRIVACY.md` (set every data
      type to **No / not collected**, check the three certification boxes; host
      the ready-made privacy-policy text only if the form demands a URL).
- [ ] **Submit for review.** Review takes hours to a few business days.
- [ ] **Optional: Edge Add-ons** (free, no fee) — upload the *same* zip at
      <https://partner.microsoft.com/dashboard/microsoftedge/>. Reuse all copy.
- [ ] **Note: Firefox / AMO is out of scope** — needs manifest changes (different
      dialect + PiP model); separate effort. See `publishing/PUBLISHING.md`.

### 2. EPIC-004 — Robustness hardening  (next dev iteration; tickets in `kanban/chrome-plugin-pip/backlog/`)

This work is now grouped under its own next-iteration root milestone,
**MILESTONE-002 — "Robustness / Continuous Re-application"**
(`kanban/chrome-plugin-pip/backlog/MILESTONE-002-robustness-continuous-reapplication.md`).
The kanban was restructured after v1 shipped: EPIC-004 + its children were
re-homed out of the now-`done` MILESTONE-001 and under MILESTONE-002, which also
carries its **own root E2E acceptance criteria** — the former MILESTONE-001
`AC-7/AC-8/AC-9` (lifecycle, dynamic-add, re-application) now live there as
`AC-1/AC-2/AC-3`. The whole backlog (MILESTONE-002, EPIC-004, US-004/005/006,
TS-008) is intentionally deferred until after the v1 store submission.

Epic: `kanban/chrome-plugin-pip/backlog/EPIC-004-robustness-lifecycle-dynamic-reapplication.md`
— "Robustness: Lifecycle, Dynamic Videos & Re-application" (covers FS-001.6,
FS-001.7, FS-001.8; BS-001.4, BS-001.6), parented to MILESTONE-002. Its three
User Stories + one shared Technical Story:

- [ ] **US-004 — Lifecycle: icon state resets on navigation and reload**
      (`backlog/US-004-state-resets-on-nav-reload.md`). FS-001.6 / BS-001.4. Nav
      to a new page or reload must discard prior state and re-detect; a green
      page that re-suppresses on reload must show orange again. (Covered by the
      existing per-tab state lifecycle — no story-specific TS.)
- [ ] **US-005 — Dynamic: dynamically added suppressed videos surface orange**
      (`backlog/US-005-dynamic-videos-surface-orange.md`). FS-001.7 / BS-001.6.
      A page that loads clear and later injects a suppressed video must flip to
      orange **without a reload**. Test fixture: `fixtures/dynamic-add.html`.
- [ ] **US-006 — Re-application: a page that re-applies the blocker stays
      unblocked** (`backlog/US-006-reapplication-stays-unblocked.md`). FS-001.8 /
      BS-001.6. After unblock (green), if the site re-adds the attribute or
      re-forces the property, the extension must auto-re-remove it and **stay
      green**; only if re-application out-paces removal does it fall back to
      orange. Test fixture: `fixtures/reapply.html`.
- [ ] **TS-008 — `add(content)`: continuous observer for dynamic videos &
      re-removal** (`backlog/TS-008-continuous-observer-reapplication.md`). FS-001.7
      / FS-001.8 / BS-001.6. Shared primitive for US-005 **and** US-006: a
      MutationObserver watching for added videos + `disablepictureinpicture`
      attribute changes, re-reporting `blocked` for late videos and auto-re-removing
      re-applied suppression, with debounce/guard against thrash loops. **Key
      hardening: a MAIN-world property-setter interception so aggressive sites
      can't simply re-force `disablePictureInPicture` back to `true` after the
      unblock** (the property side of re-application, complementing the attribute
      MutationObserver).

> Note: the root E2E ACs that originate from these EPIC-004 stories now live on
> **MILESTONE-002** as `AC-1` (US-004, lifecycle), `AC-2` (US-005, dynamic-add),
> `AC-3` (US-006, re-application) — these are the former MILESTONE-001
> `AC-7/AC-8/AC-9`. All remain `[ ]` (deferred with the epic).

### 3. Optional hardening / polish

- [ ] **Add `"use_dynamic_url": true`** to the `web_accessible_resources` entry
      in `manifest.json` (anti-fingerprinting hardening). Confirmed safe/trivial:
      the content script already resolves the module via
      `chrome.runtime.getURL(...)`, which honors the rotating URL. (Currently the
      entry has no `use_dynamic_url` key.)
- [ ] **Cross-origin iframe video support** (known v1 limitation **A2**) — would
      require per-frame work; cross-origin frames currently don't report. Larger
      effort, scope separately.

### 4. QA debt  (only if a fully-green board is wanted)

- [ ] The Milestone's **fixture-based AC-1..AC-9** and the **per-leaf-AC browser
      tests** on the US/TS children were **never separately executed** — v1 was
      accepted on the strength of the **AC-10 live-Netflix end-to-end PASS**
      (the only `[x]` AC). These re-verify the *same* behaviors AC-10 exercised
      live, and can be run against the `fixtures/` pages. **Only the
      qa-criterion-tester role marks ACs `[x]`** — do not check them off
      yourself. Honest record is in `MILESTONE-001-pip-unblocker-v1.md`
      ("## v1 acceptance").

### 5. Known v1 limitations  (awareness only — documented in the spec)

- Cross-origin iframe videos are not detected/removed (A2; same-origin only).
- Deeply-nested / closed shadow DOM is out of reach (A3; open shadow roots work).
- No persistence across page loads (A5); every load is evaluated fresh.
- The extension never enters PiP itself — the user invokes native PiP (FS-001.10).

---

## Key file pointers

All paths below are relative to the repository root.

- **Spec:** `specs/FS-001-pip-unblocker.md` (the single source of truth, FS-001.1–.11, BS-001.1–.8)
- **Source:**
  - `manifest.json` — MV3 manifest (static; references `src/` + `icons/`)
  - `src/background.js` — service worker: per-tab state `Map`, `setIcon`, `onClicked`, messaging
  - `src/content.js` — content script: detect/report, MutationObserver, dynamic `import()` of pip-core
  - `src/lib/pip-core.js` — **pure logic** (detect / remove / icon reducer), unit-tested
- **Tests:** `npm test` (runs `node --test test/`; 28/28; no deps). Tests live in `test/`.
- **QA fixtures:** `fixtures/` — open over `file://`, e.g.
  `file:///path/to/chrome-plugin-pip/fixtures/blocked.html` (substitute your
  local clone path). Each page has a live bottom-right inspector of every
  video's attr/property state.
- **Package:** `npm run package` → `dist/pip-unblocker-v1.0.0.zip` (16 runtime files)
- **Publishing kit:**
  - `publishing/STORE.md` — listing copy, single-purpose statement, permission justifications, screenshot plan
  - `publishing/PRIVACY.md` — data-usage answers + ready-to-host privacy policy
  - `publishing/PUBLISHING.md` — full step-by-step submission walkthrough (CWS + Edge)
- **Kanban:** `kanban/chrome-plugin-pip/` — first iteration (MILESTONE-001 +
  EPIC-001/002/003 and children) in `done/`; the next-iteration milestone
  **MILESTONE-002 — "Robustness / Continuous Re-application"**
  (`backlog/MILESTONE-002-robustness-continuous-reapplication.md`) and its scope
  (EPIC-004, US-004/005/006, TS-008) in `backlog/`
- **Project conventions:** `CLAUDE.md` (read before any code work — TDD-for-pure-logic, no bundler, etc.)

### Loading the extension to test live

Load **unpacked** from the repo root in `chrome://extensions` (or
`brave://extensions`) with **Developer mode** on → **Load unpacked** → select
the repository root (the folder containing `manifest.json`).
After editing source, click the reload ↻ on the extension card. Requires Chrome 111+.

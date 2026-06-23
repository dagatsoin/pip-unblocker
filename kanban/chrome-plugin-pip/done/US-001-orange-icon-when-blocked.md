# US-001 — Signaling – See an orange icon when a page blocks PiP

**Type:** User Story
**Labels:** User Story, Epic:Detection-and-Signaling
**Column:** done _(derived = min(children); part of the v1 vertical slice accepted by PO on 2026-06-23. Per-leaf-AC browser tests below were NOT separately executed — accepted via the AC-10 live-Netflix E2E; ACs left untouched. See MILESTONE-001 "## v1 acceptance".)_
**Parent:** EPIC-002

## Spec References
- FS-001.1 (detect suppression), FS-001.2 (orange signal)
- BS-001.1 (blocked if any video is suppressed), BS-001.3 (per-tab state)

## Context
Epic: EPIC-002 — Detection & Signaling.
The user needs to know, without doing anything, that the current page is preventing them from using Picture-in-Picture. The orange icon is that signal.

## Description
As a user, when I open a page whose video has PiP suppressed, the extension's toolbar icon turns **orange** for that tab on its own, so I know there is a blocker I can remove.

## Impact
- Frontend (toolbar icon)
- Content script (DOM inspection)
- Service worker (per-tab icon state)
- Chrome (Manifest V3 desktop)

## Business Rules
- BS-001.1: A page is "blocked" if at least one video is PiP-suppressed (by `disablepictureinpicture` attribute or by `disablePictureInPicture` property forced true).
- BS-001.3: Icon state is per-tab; detecting one tab's state never changes another tab's icon.

## Regressions
- First feature; no prior behavior to regress. The detection content script runs on all pages (FS-001.9) — it must not throw on pages with no video (covered by US-002).

## Acceptance Criteria
- [ ] [BROWSER] Loading the `blocked.html` fixture (video with `disablepictureinpicture`) turns the active tab's icon **orange** automatically, with no user action.
- [ ] [BROWSER] A fixture variant whose video has only the `disablePictureInPicture` **property** forced true (no attribute) also turns the icon **orange**.
- [ ] [BROWSER] A page with multiple videos where only one is suppressed shows **orange** (BS-001.1).
- [ ] [BROWSER] With `blocked.html` open in tab A (orange) and `clear.html` open in tab B, tab A's icon stays orange while tab B's icon is default — per-tab (BS-001.3).

## Test Infrastructure
Requires `blocked.html` (+ property-only variant) and `clear.html` from EPIC-001 / TS-009.

## Checklist (Technical Stories)
- [ ] TS-004 — add(content): BS-001.1 detect PiP suppression on the page
- [ ] TS-005 — add(worker): BS-001.3 per-tab state → icon-color mapping

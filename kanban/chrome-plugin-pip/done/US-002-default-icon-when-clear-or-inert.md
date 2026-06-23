# US-002 — Signaling – See the default icon when a page allows PiP or is inert

**Type:** User Story
**Labels:** User Story, Epic:Detection-and-Signaling
**Column:** done _(part of the v1 vertical slice accepted by PO on 2026-06-23. Per-leaf-AC browser tests below were NOT separately executed — accepted via the AC-10 live-Netflix E2E; ACs left untouched. See MILESTONE-001 "## v1 acceptance".)_
**Parent:** EPIC-002

## Spec References
- FS-001.3 (default signal), FS-001.9 (universal operation), FS-001.11 (graceful inert behavior)
- BS-001.5 (clicking a clear page is a no-op), BS-001.8 (harmless on non-applicable pages)

## Context
Epic: EPIC-002 — Detection & Signaling.
The user must not be alarmed where there is nothing to fix. On clear pages, no-video pages, and non-inspectable contexts, the icon stays neutral and clicking does nothing.

## Description
As a user, when I open a page that does not block PiP (or has no video, or is a page the extension cannot inspect), the toolbar icon stays in its **default/neutral** state and clicking it does nothing.

## Impact
- Frontend (toolbar icon)
- Content script (DOM inspection)
- Service worker (per-tab icon state)
- Chrome (Manifest V3 desktop)

## Business Rules
- BS-001.5: Clicking the icon on a clear page performs no removal and shows no green.
- BS-001.8: On contexts where content cannot be inspected/modified, the feature is inert — default icon, no action, no errors.

## Regressions
- Shares the detection content script with US-001; verify it stays silent and error-free on no-video and non-inspectable pages.

## Acceptance Criteria
- [ ] [BROWSER] On `clear.html` (normal non-suppressed video) the icon is in the **default** state.
- [ ] [BROWSER] On `no-video.html` the icon is **default** and clicking it changes nothing (no green, no error).
- [ ] [BROWSER] On a browser-internal page (e.g. the new-tab / settings page) the icon is **default** and clicking it does nothing.
- [ ] [BROWSER] A freshly opened tab shows the **default** state before any page is evaluated (FS-001.3 initial state).

## Test Infrastructure
Requires `clear.html` and `no-video.html` from EPIC-001 / TS-009; plus a browser-internal page for the inert case.

## Checklist (Technical Stories)
- [ ] (covered by TS-004 detection + TS-007 no-op guard; no story-specific TS required)

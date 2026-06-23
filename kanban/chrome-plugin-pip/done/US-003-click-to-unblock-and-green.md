# US-003 — Removal – Click the icon to unblock PiP and see the icon turn green

**Type:** User Story
**Labels:** User Story, Epic:Removal-and-Confirmation
**Column:** done _(derived = min(children); part of the v1 vertical slice accepted by PO on 2026-06-23. Per-leaf-AC browser tests below were NOT separately executed — accepted via the AC-10 live-Netflix E2E; ACs left untouched. See MILESTONE-001 "## v1 acceptance".)_
**Parent:** EPIC-003

## Spec References
- FS-001.4 (remove on click), FS-001.5 (green confirmation), FS-001.10 (native PiP is the user's action)
- BS-001.2 (whole-page removal scope), BS-001.5 (no-op on clear pages)

## Context
Epic: EPIC-003 — Removal & Confirmation.
This is the payoff: the user clicks once and reclaims native PiP on the page's videos, with a green icon confirming it worked.

## Description
As a user, when the icon is orange and I click it, the extension removes the PiP block from every video on the page and the icon turns **green**; I can then use my browser's own Picture-in-Picture control on the video.

## Impact
- Frontend (toolbar icon, click handler)
- Content script (DOM mutation: attribute strip + property neutralize)
- Service worker (icon → green)
- Chrome (Manifest V3 desktop)

## Business Rules
- BS-001.2: One click removes suppression from all suppressed videos currently known on the page.
- BS-001.5: Clicking a clear/inert page is a no-op (no removal, no green).

## Regressions
- Removal runs on the set detected by US-001's content script; verify a click on a clear page (US-002) does not produce green.

## Acceptance Criteria
- [ ] [BROWSER] On `blocked.html` (orange), clicking the toolbar icon strips `disablepictureinpicture` from the video and the icon turns **green**.
- [ ] [BROWSER] On the property-only variant, clicking makes `disablePictureInPicture` no longer evaluate to `true`, and the icon turns **green**.
- [ ] [BROWSER] On a page with two suppressed videos, a single click unblocks **both** and the icon turns **green** (BS-001.2).
- [ ] [BROWSER] After the icon is green, the browser's **native PiP** control is usable on the previously-suppressed video and pops it out (FS-001.10).
- [ ] [BROWSER] Clicking the icon on `clear.html` produces **no green and no change** (BS-001.5).

## Test Infrastructure
Requires `blocked.html` (+ property-only + two-video variants) and `clear.html` from EPIC-001 / TS-009.

## Checklist (Technical Stories)
- [ ] TS-006 — add(content): BS-001.2 strip attribute + neutralize property on all suppressed videos
- [ ] TS-007 — add(worker): BS-001.5 no-op + green only on actual removal

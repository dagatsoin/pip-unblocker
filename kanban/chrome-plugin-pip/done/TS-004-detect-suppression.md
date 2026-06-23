# TS-004 — add(content): BS-001.1 detect PiP suppression on the page

**Type:** Technical Story
**Labels:** Technical Story, User Story:US-001
**Column:** done _(part of the v1 vertical slice accepted by PO on 2026-06-23. Per-leaf acceptance tests below were NOT separately executed for this move — accepted via the AC-10 live-Netflix E2E; statuses left untouched. See MILESTONE-001 "## v1 acceptance".)_
**Parent:** US-001

## Context
Implements the detection primitive consumed by signaling (US-001/US-002) and removal (US-003). Scans the page's videos and decides blocked vs clear per BS-001.1.

## Impact
- add(content): a scan that collects all `<video>` elements (including same-origin frames and reachable shadow DOM, A2/A3) and marks a video suppressed if it has the `disablepictureinpicture` attribute OR its `disablePictureInPicture` property is `true`.
- add(content): page verdict = `blocked` if any suppressed video exists, else `clear` (BS-001.1).
- add(content): report verdict + the suppressed-video set to the service worker on initial load.

## Regressions
- Runs on all pages (FS-001.9); must not throw on no-video / non-inspectable pages (FS-001.11).

## Acceptance Tests
- [ ] [API-ONLY] Given a DOM with a video carrying `disablepictureinpicture`, the scan returns `blocked` and includes that video.
- [ ] [API-ONLY] Given a DOM with a video whose `disablePictureInPicture` property is `true` (no attribute), the scan returns `blocked`.
- [ ] [API-ONLY] Given a DOM with multiple videos where only one is suppressed, the scan returns `blocked`.
- [ ] [API-ONLY] Given a DOM with no suppressed video, the scan returns `clear`; given no `<video>` at all, returns `clear` without throwing.
- [ ] [API-ONLY] Same-origin reachable shadow/iframe videos are included in the scan.

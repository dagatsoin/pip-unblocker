# US-005 — Dynamic – Dynamically added suppressed videos surface orange

**Type:** User Story
**Labels:** User Story, Epic:Robustness
**Column:** backlog
**Parent:** EPIC-004

## Spec References
- FS-001.7 (dynamically added videos)
- BS-001.6 (state precedence — active blocker beats prior green)

## Context
Epic: EPIC-004 — Robustness.
Modern pages add or swap players after load. The signal must keep up without forcing the user to reload.

## Description
As a user, when a page that looked clear (or was already unblocked) later adds a video that blocks PiP, the icon turns **orange** so I know a new blocker appeared, without me reloading.

## Impact
- Content script (MutationObserver watching for added videos / changed attributes)
- Service worker (state update → icon)
- Chrome (Manifest V3 desktop)

## Business Rules
- BS-001.6: If a suppressed video is present and unhandled, the tab is orange regardless of an earlier green.

## Regressions
- Adds a continuous observer to the detection content script; verify it does not regress first-load detection (US-001) or cause false-positive orange flicker on no-video pages (US-002).

## Acceptance Criteria
- [ ] [BROWSER] On `dynamic-add.html` (loads clear, adds a suppressed video after a delay), the icon transitions from **default** to **orange** without a reload.
- [ ] [BROWSER] On a page unblocked to **green**, when a newly added video is suppressed, the icon returns to **orange** (precedence, BS-001.6).
- [ ] [BROWSER] Clicking after the dynamic add unblocks the newly added video and the icon returns to **green** (removal processes the latest known set).

## Test Infrastructure
Requires `dynamic-add.html` from EPIC-001 / TS-009.

## Checklist (Technical Stories)
- [ ] TS-008 — add(content): FS-001.7/FS-001.8 continuous observer (shared with US-006)

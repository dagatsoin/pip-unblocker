# TS-008 — add(content): FS-001.7/FS-001.8 continuous observer for dynamic videos & re-removal

**Type:** Technical Story
**Labels:** Technical Story, User Story:US-005, User Story:US-006
**Column:** backlog
**Parent:** US-005 (also serves US-006)

## Context
Shared robustness primitive: a MutationObserver that watches for videos added after load and for suppression re-applied after removal, keeping detection and protection live for the page's lifetime (FS-001.7, FS-001.8) under state precedence (BS-001.6).

## Impact
- add(content): observe DOM mutations (added nodes + `disablepictureinpicture` attribute changes) on the page (and same-origin reachable subtrees).
- add(content): on a newly suppressed video, re-report `blocked` so the worker can show orange (FS-001.7, BS-001.6).
- add(content): once the page has been unblocked, automatically re-remove re-applied suppression and report it stays handled → icon stays green (FS-001.8).
- add(content): if re-removal cannot keep up (re-applied faster than removable), report the blocker as unhandled → worker shows orange (BS-001.6).
- add(content): debounce/guard to avoid observer thrash loops.

## Regressions
- Extends the detection/removal content script (TS-004/TS-006); verify it does not regress first-load detection or the basic green confirmation, and does not loop on benign mutations.

## Acceptance Tests
- [ ] [API-ONLY] Adding a suppressed video after load triggers a `blocked` re-report.
- [ ] [API-ONLY] Re-adding `disablepictureinpicture` to a previously-unblocked video triggers automatic re-removal (attribute removed again).
- [ ] [API-ONLY] Re-forcing `disablePictureInPicture=true` after neutralization triggers automatic re-neutralization.
- [ ] [API-ONLY] When re-application out-paces re-removal, the observer reports the blocker as unhandled (drives orange).
- [ ] [API-ONLY] Benign mutations (non-video, unrelated attributes) do not trigger removal or state changes.

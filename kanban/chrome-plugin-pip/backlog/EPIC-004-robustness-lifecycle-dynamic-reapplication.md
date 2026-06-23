# EPIC-004 — EPIC – Robustness: Lifecycle, Dynamic Videos & Re-application

**Type:** Epic
**Labels:** Epic, Milestone:Robustness
**Column:** backlog _(derived = min(children); all children in backlog — deferred to the MILESTONE-002 robustness iteration, after the v1 ship in MILESTONE-001)_
**Parent:** MILESTONE-002

## Spec References
- FS-001.6 (recompute on navigation/reload)
- FS-001.7 (dynamically added videos)
- FS-001.8 (re-application of the blocker)
- BS-001.4 (state tied to current page, not retained)
- BS-001.6 (state precedence — active blocker beats prior green)

## Context
Milestone: MILESTONE-002 — Robustness / Continuous Re-application.
Consumes EPIC-002 (detection/signaling) and EPIC-003 (removal/green), both shipped in v1 under MILESTONE-001. After the happy-path vertical slice works on a simple page, real sites add videos late, re-apply suppression, and get navigated/reloaded. This epic hardens the extension to behave correctly across the page lifecycle and against adversarial pages. It was deferred out of v1 and re-homed under MILESTONE-002 as its own iteration.

## Description
Make icon state a true property of the **current** page: reset and re-detect on navigation/reload, never leaking state across pages (FS-001.6, BS-001.4). Detect videos added **after** load and update the tab to orange without a reload (FS-001.7). Continuously **re-remove** suppression that a page re-applies for the page's lifetime, keeping the icon green; fall back to orange only when re-removal cannot keep PiP available, per state precedence (FS-001.8, BS-001.6).

## Business Value
Robustness is what makes the feature trustworthy on the messy real web — without it, the icon would lie on reload, miss late-loading players, and lose to sites that re-assert the blocker. This epic protects the core promise across the page's whole life.

## Acceptance Criteria
- [ ] Navigating the tab to a new page resets the icon and re-runs detection against the new page (FS-001.6).
- [ ] Reloading a previously-green page that re-suppresses on load shows **orange** again and requires another click (FS-001.6, BS-001.4).
- [ ] Icon state never leaks from one page to the next within a tab without re-evaluation (BS-001.4).
- [ ] A page that loads clear and later adds a suppressed video updates to **orange** without a reload (FS-001.7).
- [ ] A green page where a newly added video is suppressed reflects a blocker again per precedence (FS-001.7, BS-001.6).
- [ ] A page that re-adds the marker / re-forces the property after removal is auto-re-removed and stays **green** (FS-001.8).
- [ ] If re-application defeats automatic re-removal, the icon returns to **orange** (FS-001.8, BS-001.6).

## Cross-Epic Outputs / Inputs
- Consumes EPIC-002 detection and EPIC-003 removal/green (both shipped in MILESTONE-001). Re-surfaces orange/green via precedence. Integration verified at MILESTONE-002 root AC-1, AC-2, AC-3.

## Checklist (User Stories)
- [ ] US-004 — Lifecycle – Icon state resets on navigation and reload
- [ ] US-005 — Dynamic – Dynamically added suppressed videos surface orange
- [ ] US-006 — Re-application – A page that re-applies the blocker stays unblocked

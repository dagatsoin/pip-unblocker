# EPIC-003 — EPIC – Removal & Confirmation

**Type:** Epic
**Labels:** Epic, Milestone:PiP-Unblocker-v1
**Column:** done _(derived = min(children); all children — US-003 (and its TS-006, TS-007) — in done. Part of the v1 vertical slice accepted by PO on 2026-06-23; see MILESTONE-001 "## v1 acceptance".)_
**Parent:** MILESTONE-001

## Spec References
- FS-001.4 (remove the blocker on icon click)
- FS-001.5 (green = removal confirmed)
- FS-001.10 (native PiP invocation remains the user's action)
- FS-001.11 / BS-001.5 (no-op on clear/inert pages)

## Context
Milestone: MILESTONE-001 — PiP Unblocker v1.
Consumes EPIC-002's per-tab blocked state and detected-video set. This epic delivers the action and the payoff: one click strips the suppression from every affected video and the icon turns green to confirm PiP is now available.

## Description
On a click of the toolbar icon for a **blocked** page, remove suppression from every affected video: strip the `disablepictureinpicture` attribute and neutralize the `disablePictureInPicture` property so it no longer evaluates to `true` (BS-001.2: whole-page scope, one click unblocks all). On success, set the tab's icon **green** (FS-001.5). Clicking a **clear** or inert page is a strict **no-op** — no removal, no green (BS-001.5, FS-001.11). Green is only ever shown when a removal actually occurred.

## Business Value
This is the moment of value: the user reclaims native PiP on content the site tried to lock down, with a single obvious click and an unambiguous green confirmation — and we never lie (no green without a real removal).

## Acceptance Criteria
- [ ] Clicking the icon on a blocked page removes `disablepictureinpicture` from all affected videos (FS-001.4, BS-001.2).
- [ ] Clicking the icon on a blocked page makes `disablePictureInPicture` no longer evaluate to `true` for any affected video (FS-001.4).
- [ ] After a successful removal the icon turns **green** (FS-001.5).
- [ ] After green, the browser's native PiP affordance is usable on the unblocked video (FS-001.10).
- [ ] Clicking a **clear** page performs no removal and shows no green (BS-001.5).
- [ ] The feature never produces green on a page where no removal occurred (FS-001.11).

## Cross-Epic Outputs (consumed by others)
- Per-tab `unblocked`/green state after a successful removal → consumed by the native-PiP step within v1, and downstream by **EPIC-004** (re-application handling baselines from green; precedence may flip it back to orange) under MILESTONE-002. Integration verified at MILESTONE-001 AC-4, AC-5, AC-6 (and downstream at MILESTONE-002 AC-3).

## Checklist (User Stories)
- [ ] US-003 — Removal – Click the icon to unblock PiP and see the icon turn green

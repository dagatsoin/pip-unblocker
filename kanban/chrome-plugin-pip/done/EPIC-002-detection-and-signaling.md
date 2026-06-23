# EPIC-002 — EPIC – Detection & Signaling

**Type:** Epic
**Labels:** Epic, Milestone:PiP-Unblocker-v1
**Column:** done _(derived = min(children); all children — US-001, US-002 (and their TS-004, TS-005) — in done. Part of the v1 vertical slice accepted by PO on 2026-06-23; see MILESTONE-001 "## v1 acceptance".)_
**Parent:** MILESTONE-001

## Spec References
- FS-001.1 (detect suppression)
- FS-001.2 (orange = blocker detected)
- FS-001.3 (default = no blocker)
- FS-001.11 (inert where the feature cannot apply)

## Context
Milestone: MILESTONE-001 — PiP Unblocker v1.
Consumes the scaffold from EPIC-001 (content-script injection + per-tab icon API). This epic gives the user the first half of the visible contract: the icon truthfully reports, per tab, whether the current page is blocking PiP.

## Description
Detect PiP suppression on the active page — a `<video>` carrying the `disablepictureinpicture` attribute and/or whose `disablePictureInPicture` property is forced `true` (BS-001.1: blocked if **any** video is suppressed). Map that per-page result to the toolbar icon: **orange** when blocked, **default** when clear or inert. State is strictly **per-tab** (BS-001.3) and never leaks between pages without re-evaluation.

## Business Value
A trustworthy, automatic signal is the core of the product: the user learns at a glance, on every tab independently, whether there is a PiP blocker to remove — with zero configuration (FS-001.9).

## Acceptance Criteria
- [ ] On a page with at least one suppressed video, the active tab's icon is **orange** (FS-001.1, FS-001.2, BS-001.1).
- [ ] On a page with no suppressed video, the icon is **default** (FS-001.3).
- [ ] On a page with multiple videos where only some are suppressed, the icon is **orange** (BS-001.1).
- [ ] Detection runs automatically on page load with no user action (FS-001.1).
- [ ] Icon state is per-tab: a blocked tab is orange while a simultaneously-open clear tab is default (BS-001.3).
- [ ] On a no-video page and on a non-inspectable context, the icon stays **default** (FS-001.11).

## Cross-Epic Outputs (consumed by others)
- Per-tab page state `{ default | blocked }` and the **set of detected suppressed videos** → consumed by **EPIC-003** (removal scope + orange precondition) within v1, and downstream by **EPIC-004** (re-detection) under MILESTONE-002. Integration verified at MILESTONE-001 AC-2, AC-3 (and downstream at MILESTONE-002 AC-2).

## Checklist (User Stories)
- [ ] US-001 — Signaling – See an orange icon when a page blocks PiP
- [ ] US-002 — Signaling – See the default icon when a page allows PiP or is inert

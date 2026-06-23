# MILESTONE-002 — MILESTONE – Robustness / Continuous Re-application

**Type:** Milestone
**Labels:** Milestone
**Column:** backlog _(root ticket — owns its own E2E ACs; derived = min(children); all children (EPIC-004 and its US/TS) are in backlog — intentionally deferred to a future iteration after the v1 ship in MILESTONE-001.)_
**Parent:** — (root ticket — owns its own E2E ACs)

## Spec References
- FS-001.6 (recompute on navigation/reload)
- FS-001.7 (dynamically added videos)
- FS-001.8 (re-application of the blocker)

## Description
PiP Unblocker v1 (MILESTONE-001) shipped the happy-path vertical slice: detect a PiP blocker, surface it orange, remove it on click, confirm green, and let the user invoke native PiP. This next milestone hardens that promise for the messy real web. Real sites add video players late, re-assert the suppression after we remove it, and get navigated/reloaded — and the icon must stay honest through all of it.

This milestone makes icon state a true property of the **current** page (reset and re-detect on navigation/reload, never leaking stale state), detects videos added **after** load, and **continuously re-removes** suppression that a page re-applies for the page's lifetime — falling back to orange only when re-removal genuinely cannot keep PiP available. It is the trust-hardening layer that turns a working demo into a feature users can rely on every day.

## Context
This is the **deferred-robustness scope split out of MILESTONE-001**. During v1, EPIC-004 (Robustness) and its stories (US-004, US-005, US-006, TS-008) were intentionally held back so v1 could ship on the strength of the live-Netflix end-to-end happy path (see MILESTONE-001 "## v1 acceptance"). Rather than leave a deferred Epic dangling under an already-shipped milestone, that scope is re-homed here as its own next-iteration milestone with its own end-to-end gate. MILESTONE-001's root E2E ACs AC-7/AC-8/AC-9 (lifecycle, dynamic-add, re-application) correspond to this milestone's behavior and are carried here as AC-1/AC-2/AC-3 below.

## Scope
1. **Lifecycle correctness** — icon state resets and re-detects on navigation/reload; no cross-load memory (FS-001.6, BS-001.4).
2. **Dynamic detection** — videos suppressed after initial load surface orange without a reload (FS-001.7).
3. **Continuous re-removal** — re-applied suppression is auto-removed for the page's lifetime; icon stays green while PiP is held available and only falls back to orange when re-removal cannot keep up, per state precedence (FS-001.8, BS-001.6).

## Root E2E Acceptance Criteria (end-to-end browser journey)
> This is the **root browser journey** for the robustness milestone. Every AC below is **[BROWSER]** (no API-only ACs at the root). Each is written in flow order, covers descendant behavior, and is tagged with the originating child ticket it integrates, so a failure routes the correct child back to inProgress. These ACs are owned by this Milestone and tested by the root E2E (iterate workflow step 9). **review → qa only when every AC is [x].** _(All currently `[ ]` — this milestone has not been started.)_

- [ ] **AC-1** [BROWSER] (US-004) **Reloading** a green fixture tab re-evaluates the page: because the fixture re-suppresses PiP on load, the icon returns to **orange** and requires another click (state is not retained across reload). Navigating a blocked (orange) tab to `clear.html` changes the icon to **default**, and no prior state leaks across navigation. _(integrates lifecycle recompute, FS-001.6 / BS-001.4)_
- [ ] **AC-2** [BROWSER] (US-005) On a clear tab, when the page **dynamically adds** a suppressed video after load (`dynamic-add.html`), the icon updates to **orange** without a reload; on a green tab, a newly added suppressed video returns the icon to **orange** per precedence. _(integrates dynamic detection feeding signaling, FS-001.7 / BS-001.6)_
- [ ] **AC-3** [BROWSER] (US-006) On a tab unblocked to **green**, when the page **re-applies** the blocker (`reapply.html`), the extension auto-re-removes it and the icon **stays green** (native PiP remains available); if re-application defeats re-removal the icon returns to **orange**. _(integrates continuous re-removal + precedence, FS-001.8 / BS-001.6)_

## Cross-Epic Integration map (producer → consumer)
- **EPIC-004 (Robustness)** consumes the v1 outputs from MILESTONE-001 — the per-tab `{default|blocked}` detection + suppressed-video set (EPIC-002) and the `unblocked`/green removal baseline (EPIC-003) — and re-surfaces orange/green via state precedence. Covered by AC-1, AC-2, AC-3.
- This is a **cross-milestone seam**: MILESTONE-001 produces the detection/removal foundation that MILESTONE-002 hardens. The integration is verified by this milestone's root journey replaying detect → remove → green and then exercising reload / dynamic-add / re-application on top of it.

## Test Infrastructure (required for QA — provided by MILESTONE-001 / EPIC-001)
- Reuses the static fixtures shipped in v1 (EPIC-001 / TS-009): `clear.html`, `no-video.html`, `blocked.html`, `dynamic-add.html` (adds a suppressed video after load, FS-001.7), and `reapply.html` (re-adds the attribute / re-forces the property on an interval, plus an aggressive/fast variant, FS-001.8 / BS-001.6).
- These fixtures replace E2E browser-automation tooling for QA. Missing fixtures → ticket is **BLOCKED**, not skipped.
- Runtime/port: pure client-side extension — **no backend server, no port required**. If fixtures are served via a local static HTTP server, allocate a port per `~/.claude/port-registry.md`.

## Checklist (Epics)
- [ ] EPIC-004 — Robustness: Lifecycle, Dynamic Videos & Re-application

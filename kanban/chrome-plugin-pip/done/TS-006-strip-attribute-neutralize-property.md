# TS-006 — add(content): BS-001.2 strip attribute + neutralize property on all suppressed videos

**Type:** Technical Story
**Labels:** Technical Story, User Story:US-003
**Column:** done _(part of the v1 vertical slice accepted by PO on 2026-06-23. Per-leaf acceptance tests below were NOT separately executed for this move — accepted via the AC-10 live-Netflix E2E; statuses left untouched. See MILESTONE-001 "## v1 acceptance".)_
**Parent:** US-003

## Context
The removal primitive invoked when the user clicks the icon on a blocked page. Whole-page scope (BS-001.2): one click unblocks every suppressed video known on the page.

## Impact
- add(content): on a remove command from the worker, for each suppressed video: remove the `disablepictureinpicture` attribute and set `disablePictureInPicture` so it no longer evaluates to `true` (neutralize the property).
- add(content): operate on the latest known suppressed set; skip videos that no longer exist; process the remaining (FS-001.7 click-time set).
- add(content): report removal success (count removed) back to the worker so it can confirm green only on a real removal.

## Regressions
- Mutates page DOM; must not touch non-suppressed videos (BS-001.2) and must be a no-op when the set is empty (supports BS-001.5).

## Acceptance Tests
- [ ] [API-ONLY] After remove, no targeted video has the `disablepictureinpicture` attribute.
- [ ] [API-ONLY] After remove, `disablePictureInPicture` evaluates to `false` for every targeted video.
- [ ] [API-ONLY] With two suppressed videos, a single remove clears both; a mixed page leaves the already-clear video untouched (BS-001.2).
- [ ] [API-ONLY] Remove on an empty/clear set reports zero removals (feeds the no-op/green guard in TS-007).

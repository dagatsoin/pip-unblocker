# TS-007 — add(worker): BS-001.5 no-op + green only on actual removal

**Type:** Technical Story
**Labels:** Technical Story, User Story:US-003
**Column:** done _(part of the v1 vertical slice accepted by PO on 2026-06-23. Per-leaf acceptance tests below were NOT separately executed for this move — accepted via the AC-10 live-Netflix E2E; statuses left untouched. See MILESTONE-001 "## v1 acceptance".)_
**Parent:** US-003

## Context
Wires the action `onClicked` handler to the removal primitive (TS-006) and enforces the honesty rules: green only when a removal actually happened; clicking a clear/inert page does nothing (BS-001.5, FS-001.11).

## Impact
- add(worker): on icon click for a tab in `blocked` state, send remove to the content script; on a success report with ≥1 removal, set state `unblocked` and green icon for that tab (FS-001.5).
- add(worker): on icon click for a tab in `default` state (clear/no-video/inert), do nothing — no remove sent, no green (BS-001.5, FS-001.11).
- add(worker): never set green when reported removals == 0 (FS-001.11: no green without a real removal).

## Regressions
- Shares the click handler with future re-application handling (EPIC-004, deferred to MILESTONE-002); keep green-gating centralized so precedence (BS-001.6) can later flip back to orange.

## Acceptance Tests
- [ ] [API-ONLY] Click on a `blocked` tab triggers remove and, on ≥1 removal, sets `unblocked`/green.
- [ ] [API-ONLY] Click on a `default` tab sends no remove and sets no green (BS-001.5).
- [ ] [API-ONLY] A removal report of 0 never produces green (FS-001.11).
- [ ] [BROWSER] On `blocked.html`, clicking turns the icon green; on `clear.html`, clicking changes nothing.

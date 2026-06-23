# TS-003 — add(assets): per-tab icon set (default/orange/green) + setIcon plumbing

**Type:** Technical Story
**Labels:** Technical Story, Epic:Extension-Scaffold
**Column:** done _(part of the v1 vertical slice accepted by PO on 2026-06-23. Per-leaf acceptance tests below were NOT separately executed for this move — accepted via the AC-10 live-Netflix E2E; statuses left untouched. See MILESTONE-001 "## v1 acceptance".)_
**Parent:** EPIC-001

## Spec References (functional context)
- FS-001.2 (orange), FS-001.3 (default), FS-001.5 (green), BS-001.3 (per-tab)

## Context
Provides the three discrete icon states (A6: default, orange, green — no loading state) as assets and the service-worker helper that sets the icon **for a specific tab** so signaling can be per-tab (BS-001.3).

## Impact
- add(assets): three icon variants at required sizes (16/32/48/128) — default/neutral, orange, green.
- add(worker): `setIconForTab(tabId, state)` helper using the per-tab `action.setIcon({ tabId })` form.
- add(worker): default icon applied to new tabs (FS-001.3 initial state).

## Regressions
- None (greenfield).

## Acceptance Tests
- [ ] [BROWSER] A newly opened tab shows the **default** icon.
- [ ] [BROWSER] Calling the helper with `blocked` sets **orange** on only the target tab; another tab is unchanged (BS-001.3).
- [ ] [BROWSER] Calling the helper with `unblocked` sets **green** on only the target tab.
- [ ] [API-ONLY] The three icon assets exist at the required sizes and are referenced by the manifest/worker.

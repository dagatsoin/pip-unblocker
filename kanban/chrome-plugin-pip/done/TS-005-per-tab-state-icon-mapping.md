# TS-005 — add(worker): BS-001.3 per-tab state → icon-color mapping

**Type:** Technical Story
**Labels:** Technical Story, User Story:US-001
**Column:** done _(part of the v1 vertical slice accepted by PO on 2026-06-23. Per-leaf acceptance tests below were NOT separately executed for this move — accepted via the AC-10 live-Netflix E2E; statuses left untouched. See MILESTONE-001 "## v1 acceptance".)_
**Parent:** US-001

## Context
The service worker holds a per-tab state machine `{ default | blocked | unblocked }` and maps it to the icon via TS-003's helper. Per-tab (BS-001.3); reset on navigation/reload is extended later by EPIC-004/US-004 (deferred to MILESTONE-002).

## Impact
- add(worker): in-memory map `tabId → state` (no persistence — BS-001.4, A5).
- add(worker): on a `blocked` report from the content script, set state `blocked` and orange icon **for that tab only** (FS-001.2, BS-001.3).
- add(worker): on a `clear` report, set state `default` and default icon for that tab (FS-001.3).
- add(worker): new tabs / unevaluated pages default to `default` (FS-001.3).

## Regressions
- Shared by all signaling; later extended by US-004 for nav/reload reset — keep the mapping isolated so that extension is additive.

## Acceptance Tests
- [ ] [API-ONLY] A `blocked` report for tab T sets T's state to `blocked` and requests orange for T only.
- [ ] [API-ONLY] A `clear` report for tab T sets T's state to `default` and requests default for T only.
- [ ] [API-ONLY] State for tab A is independent of tab B (BS-001.3).
- [ ] [BROWSER] With `blocked.html` in tab A and `clear.html` in tab B open simultaneously, A's icon is orange and B's is default.

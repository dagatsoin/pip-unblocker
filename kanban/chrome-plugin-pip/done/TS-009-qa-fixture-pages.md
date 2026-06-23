# TS-009 — add(fixtures): QA fixture pages

**Type:** Technical Story
**Labels:** Technical Story, Epic:Extension-Scaffold
**Column:** done _(part of the v1 vertical slice accepted by PO on 2026-06-23. Per-leaf acceptance tests below were NOT separately executed for this move — accepted via the AC-10 live-Netflix E2E; statuses left untouched. See MILESTONE-001 "## v1 acceptance".)_
**Parent:** EPIC-001

## Context
QA validates this extension in a real browser; there is no app backend to seed. These static fixture pages are the **test infrastructure** that every user story's browser ACs run against. They replace E2E browser-automation tooling. Missing fixtures → dependent tickets are BLOCKED, not skipped.

## Impact
- add(fixtures): `blocked.html` — `<video>` with `disablepictureinpicture` attribute.
- add(fixtures): `blocked-property.html` — `<video>` whose `disablePictureInPicture` **property** is forced `true` via inline script (no attribute).
- add(fixtures): `blocked-multi.html` — two suppressed videos (for whole-page removal, BS-001.2) and a mixed page (one suppressed + one clear).
- add(fixtures): `clear.html` — normal non-suppressed `<video>` (control).
- add(fixtures): `no-video.html` — no `<video>` at all (inert case).
- add(fixtures): `dynamic-add.html` — loads clear, adds a suppressed video ~1.5s after load (FS-001.7).
- add(fixtures): `reapply.html` — re-adds `disablepictureinpicture` on a short interval after removal; plus a property-re-forcing variant and an aggressive/fast variant (FS-001.8, BS-001.6).
- add(fixtures): `iframe-same-origin.html` — embeds `blocked.html` from the same origin (A2).

## Regressions
- None (test assets only).

## Acceptance Tests
- [ ] [BROWSER] Each fixture loads and presents the described DOM (verified by opening it and observing the video/attribute state).
- [ ] [API-ONLY] Fixtures are served by `file://` by default; if a local static server is introduced, its port is registered in `~/.claude/port-registry.md` and documented.

## Notes
No backend/server is required for the extension itself. A local static server is optional, only for serving fixtures over http(s) if `file://` proves insufficient for any test.

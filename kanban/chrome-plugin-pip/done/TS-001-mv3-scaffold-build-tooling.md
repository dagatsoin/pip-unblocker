# TS-001 — chore(build): MV3 project scaffold + build/test tooling

**Type:** Technical Story
**Labels:** Technical Story, Epic:Extension-Scaffold
**Column:** done _(part of the v1 vertical slice accepted by PO on 2026-06-23. Per-leaf acceptance tests below were NOT separately executed for this move — accepted via the AC-10 live-Netflix E2E; statuses left untouched. See MILESTONE-001 "## v1 acceptance".)_
**Parent:** EPIC-001

## Context
Foundation for the whole extension. Establishes the repository layout, language/build toolchain, and a unit-test runner so every later TS can be built and tested. No user-visible behavior.

## Impact
- chore(build): MV3 source layout (`src/`, `dist/`, icon assets dir, fixtures dir).
- chore(build): bundler/build script producing an unpacked MV3 `dist/` loadable via chrome://extensions.
- chore(build): unit-test runner configured (for pure detection/removal logic that is DOM-testable in isolation).
- chore(build): lint/format baseline.

## Regressions
- None (greenfield).

## Acceptance Tests
- [ ] [API-ONLY] `build` produces a `dist/` containing `manifest.json` and bundled scripts with no build errors.
- [ ] [API-ONLY] The unit-test runner executes and a trivial sample test passes (proves the harness works).
- [ ] [BROWSER] The produced `dist/` loads as an unpacked extension in Chrome with no errors (smoke check; full icon behavior is TS-002/TS-003).

## Notes
Pure client-side extension — no backend, **no port required**. If fixtures later need a local static server, allocate per `~/.claude/port-registry.md`.

# US-004 — Lifecycle – Icon state resets on navigation and reload

**Type:** User Story
**Labels:** User Story, Epic:Robustness
**Column:** backlog
**Parent:** EPIC-004

## Spec References
- FS-001.6 (recompute on navigation/reload)
- BS-001.4 (state tied to current page, not retained)

## Context
Epic: EPIC-004 — Robustness.
A different or reloaded page is a different situation; a stale icon would mislead the user. State must follow the current page only.

## Description
As a user, when I navigate the tab to another page or reload the current one, the icon forgets the previous page's state and re-checks the new page, so the color always reflects what is actually in front of me.

## Impact
- Content script (re-runs on the new document)
- Service worker (per-tab state reset on navigation/commit)
- Chrome (Manifest V3 desktop)

## Business Rules
- BS-001.4: Icon state belongs to the currently loaded page; navigating/reloading discards prior state and triggers fresh detection. No cross-load memory in v1.

## Regressions
- Touches the per-tab state lifecycle shared by all signaling; verify orange/default/green from EPIC-002/003 still set correctly on first load after this change.

## Acceptance Criteria
- [ ] [BROWSER] Navigating a blocked (orange) tab to `clear.html` changes the icon to **default**.
- [ ] [BROWSER] Reloading a tab that was unblocked to **green** on `reapply.html`/`blocked.html` shows **orange** again (re-suppressed on load) and requires another click.
- [ ] [BROWSER] After navigation, no prior state leaks: a tab that was green then navigated to `no-video.html` shows **default**.

## Test Infrastructure
Requires `blocked.html`, `clear.html`, `no-video.html` from EPIC-001 / TS-009.

## Checklist (Technical Stories)
- [ ] (covered by TS-005 per-tab state lifecycle extended for nav/reload reset; no story-specific TS required)

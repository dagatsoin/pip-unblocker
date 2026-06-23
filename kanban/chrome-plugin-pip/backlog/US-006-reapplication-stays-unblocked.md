# US-006 — Re-application – A page that re-applies the blocker stays unblocked

**Type:** User Story
**Labels:** User Story, Epic:Robustness
**Column:** backlog
**Parent:** EPIC-004

## Spec References
- FS-001.8 (re-application of the blocker)
- BS-001.6 (state precedence — active blocker beats prior green)

## Context
Epic: EPIC-004 — Robustness.
Some sites actively re-assert suppression after it is removed. v1 promises continuous protection for the page's lifetime, not a one-shot click.

## Description
As a user, once I have unblocked a page (green), if the site tries to re-block PiP the extension quietly removes it again and the icon stays **green** — so PiP keeps working without me clicking again. Only if the site out-paces the extension does the icon go back to **orange** to be honest with me.

## Impact
- Content script (MutationObserver re-removing re-applied suppression for the page lifetime)
- Service worker (precedence: orange if a blocker is unhandled)
- Chrome (Manifest V3 desktop)

## Business Rules
- BS-001.6: A present, unhandled suppressed video forces orange regardless of an earlier green; green only while all known videos are unblocked.

## Regressions
- The continuous observer is shared with US-005; verify it does not loop/thrash or break the basic green confirmation from EPIC-003.

## Acceptance Criteria
- [ ] [BROWSER] On `reapply.html` after an initial unblock (green), when the page re-adds `disablepictureinpicture`, the extension removes it again automatically and the icon **stays green**.
- [ ] [BROWSER] When the page re-forces the `disablePictureInPicture` property after it was neutralized, it is neutralized again automatically and the icon **stays green**.
- [ ] [BROWSER] If re-application defeats automatic re-removal (faster than it can be removed), the icon returns to **orange** (BS-001.6).

## Test Infrastructure
Requires `reapply.html` from EPIC-001 / TS-009 (re-adds attribute on an interval; plus a property-forcing and an aggressive/fast variant).

## Checklist (Technical Stories)
- [ ] TS-008 — add(content): FS-001.7/FS-001.8 continuous observer for re-removal + precedence

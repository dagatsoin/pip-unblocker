# TS-002 — add(manifest): manifest + content-script/service-worker injection plumbing

**Type:** Technical Story
**Labels:** Technical Story, Epic:Extension-Scaffold
**Column:** done _(part of the v1 vertical slice accepted by PO on 2026-06-23. Per-leaf acceptance tests below were NOT separately executed for this move — accepted via the AC-10 live-Netflix E2E; statuses left untouched. See MILESTONE-001 "## v1 acceptance".)_
**Parent:** EPIC-001

## Spec References (functional context)
- FS-001.9 (universal operation), FS-001.11 (inert where it cannot apply)

## Context
Defines the MV3 `manifest.json` and the wiring that gets a content script onto every standard page and a service worker running to own per-tab icon state. This is the seam EPIC-002/003/004 build on.

## Impact
- add(manifest): MV3 `manifest.json` v3 with `action` (toolbar icon), broad `content_scripts.matches` for universal operation (FS-001.9), and the minimal permissions for icon-per-tab and injection (e.g. `activeTab`/`scripting`/`tabs` as needed — keep least-privilege).
- add(worker): service-worker entry registered; owns per-tab icon state and the action `onClicked` handler stub.
- add(content): content-script entry injected on all pages; messaging channel to the worker established.
- add(manifest): same-origin frame injection enabled (`all_frames` for same-origin) per A2; cross-origin documented as deferred.

## Regressions
- None (greenfield). Must be inert/error-free on non-inspectable contexts (FS-001.11) — the content script must guard against pages where it cannot run.

## Acceptance Tests
- [ ] [BROWSER] On load, the service worker registers with no errors and the toolbar `action` icon is present.
- [ ] [BROWSER] The content script is injected on a normal web page and can exchange a message with the service worker (a ping round-trips).
- [ ] [BROWSER] On a browser-internal page the content script does not inject/run and no error is surfaced (FS-001.11).
- [ ] [API-ONLY] `manifest.json` declares manifest_version 3, an `action`, universal `content_scripts.matches`, and no unused permissions.

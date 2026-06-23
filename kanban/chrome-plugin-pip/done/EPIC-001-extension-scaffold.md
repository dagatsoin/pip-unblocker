# EPIC-001 — EPIC – Extension Scaffold (MV3)

**Type:** Epic
**Labels:** Epic, Milestone:PiP-Unblocker-v1
**Column:** done _(derived = min(children); all children — TS-001, TS-002, TS-003, TS-009 — in done. Part of the v1 vertical slice accepted by PO on 2026-06-23; see MILESTONE-001 "## v1 acceptance".)_
**Parent:** MILESTONE-001

## Spec References
- FS-001.9 (universal operation — the scaffold is what makes detection run everywhere)
- FS-001.11 (graceful inert behavior — scaffold must not error on non-applicable pages)

## Context
Milestone: MILESTONE-001 — PiP Unblocker v1.
Before any user-visible behavior can exist, the extension needs a Manifest V3 skeleton: a manifest, a content script injected into pages, a service worker, a per-tab icon API, and a build/test toolchain. This epic delivers no user-facing feature on its own; it is the foundation every other epic consumes.

## Description
Stand up the MV3 extension project: build tooling, the `manifest.json` (with the broad host match required for universal operation and the `tabs`/`activeTab`/`scripting` permissions the icon and injection need), a content script that runs on all standard pages, a service worker that owns per-tab icon state, and the three icon assets (default, orange, green). This epic also delivers the **QA fixture pages** that every other epic's browser tests depend on.

## Business Value
A correct, minimal MV3 foundation lets all subsequent value (detect → signal → remove → confirm) be built and browser-tested quickly, and guarantees the extension stays inert and error-free on pages where it cannot act (FS-001.11).

## Acceptance Criteria
- [ ] The unpacked extension loads in Chrome with no manifest or service-worker errors.
- [ ] A toolbar icon appears and shows the **default** state on a freshly opened tab (FS-001.3 initial state).
- [ ] The content script is injected on standard web pages and does nothing visible/harmful where no video exists (FS-001.11).
- [ ] On a browser-internal / non-inspectable context, the icon stays default and the extension surfaces no error (FS-001.11, BS-001.8).
- [ ] The QA fixture pages exist and are loadable (blocked, clear, no-video, dynamic-add, re-application) — see Test Infrastructure.

## Test Infrastructure (this epic OWNS the fixtures)
Provide static fixture HTML pages for QA:
- `blocked.html` — a `<video>` with the `disablepictureinpicture` attribute; plus a variant that sets the `disablePictureInPicture` property to `true` via inline script.
- `clear.html` — a normal `<video>` with PiP allowed (control case).
- `no-video.html` — a page with no `<video>` at all (inert case).
- `dynamic-add.html` — loads clear, then adds a suppressed `<video>` ~1.5s later via JS (for FS-001.7).
- `reapply.html` — after the attribute is removed, re-adds `disablepictureinpicture` on a short interval (for FS-001.8).
- Same-origin iframe variant of `blocked.html` (for the same-origin nested-context case, A2).
- **Serving:** prefer `file://` to avoid a server. If a local static HTTP server is used, allocate a port via `~/.claude/port-registry.md` and document it in the project CLAUDE.md. No backend/port is otherwise required.

## Checklist (Technical Stories)
- [ ] TS-001 — chore(build): MV3 project scaffold + build/test tooling
- [ ] TS-002 — add(manifest): manifest + content-script/service-worker injection plumbing
- [ ] TS-003 — add(assets): per-tab icon set (default/orange/green) + setIcon plumbing
- [ ] TS-009 — add(fixtures): QA fixture pages

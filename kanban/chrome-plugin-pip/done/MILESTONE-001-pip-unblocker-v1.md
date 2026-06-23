# MILESTONE-001 — MILESTONE – PiP Unblocker v1

**Type:** Milestone
**Labels:** Milestone
**Column:** done _(derived = min(children); all children — EPIC-001, EPIC-002, EPIC-003 — are in done. The deferred-robustness scope was re-homed to MILESTONE-002, so this milestone's scope is exactly the shipped v1 vertical slice and derives cleanly to done. The root E2E was accepted on the AC-10 live-Netflix end-to-end pass — see "## v1 acceptance"; AC-1–AC-6 fixture re-runs were deferred by PO direction, recorded honestly below.)_
**Parent:** — (root ticket — owns its own E2E ACs)

## Spec References
- FS-001 (all of FS-001.1 – FS-001.11)

## Description
Some websites deliberately suppress the browser's native Picture-in-Picture (PiP) control on their video players, denying users a capability their browser already provides. This milestone ships **PiP Unblocker v1**: a zero-configuration Chrome extension (Manifest V3) whose entire interface is a single toolbar icon. The icon's color tells the user, per tab, whether the current page is blocking PiP (orange), is clear (default), or has just been unblocked (green); a single click strips the suppression from every affected video so the user can then pop the video out using the browser's own native PiP control.

The value proposition is simple and honest: we restore access to a capability the browser already offers, with one obvious control and no setup. v1 is **unblock-only** — the extension never enters PiP itself; the user invokes it natively after the icon turns green.

This milestone is the foundational delivery for the product. It is built as a single end-to-end vertical slice (scaffold → detect → signal → remove → confirm), validated end-to-end live on Netflix. Hardening for the messy real web (navigation/reload lifecycle, dynamically added videos, and pages that re-apply the blocker) was intentionally deferred to its own iteration — **MILESTONE-002 (Robustness / Continuous Re-application)** — to ship v1's core value fast.

## Locked v1 scope (do not expand)
1. **Universal** — runs on all sites, no allowlist (BS-001.7).
2. **One-click removal** — a click on a blocked tab strips suppression from every affected video and confirms green (FS-001.4 / FS-001.5). _Continuous re-removal of re-applied suppression for the page's lifetime (BS-001.6) is the robustness hardening **deferred to MILESTONE-002** — not part of v1's accepted scope._
3. **No cross-load memory** — every page load handled fresh; no storage/persistence in v1 (BS-001.4).
4. **Same-origin iframes only** — cross-origin iframe embeds are a documented known limitation, deferred (A2).

## v1 acceptance
**v1 accepted by the product owner on 2026-06-23**, moved to `done` by PO direction.

**Acceptance basis (honest record — read before trusting the AC checkboxes below):**
- **Accepted on the strength of AC-10**, the primary real-world end-to-end test: the whole stack (detect → **orange** → click → **green** → native PiP) was confirmed working **live on Netflix in Brave**. AC-10 is `[x]` (marked by QA on the real-world pass).
- **AC-1 through AC-6 were NOT separately executed** — they remain `[ ]`. These are the controlled, fixture-based re-verifications of the *same* behaviors that AC-10 exercised end-to-end on the live site. The PO chose to validate via the real-world E2E and move fast, so the fixture re-runs were **deferred/skipped by PO direction**, not performed.
- **Per-leaf-AC browser tests on the US/TS children were likewise NOT run** (same PO direction). The moved leaf tickets carry a one-line pointer back to this note.
- **No AC checkbox state was altered during this acceptance.** Only AC-10 is `[x]` (set earlier by QA). Marking ACs `[x]` is QA's role; these were not tested, so they stay `[ ]`.
- This is an **explicit PO acceptance that overrides the strict "every root AC `[x]`" `review → qa` gate**: v1 was accepted on the AC-10 real-world pass with the AC-1..AC-6 fixture re-runs deferred. The override is recorded here rather than hidden. _(Column derivation needs **no** override: this milestone's children are exactly EPIC-001/002/003, all `done`, so `min(children) = done`.)_

**Deferred to MILESTONE-002 (intentionally — no longer this milestone's scope):**
- The robustness scope (**lifecycle reset on nav/reload, dynamically added videos, continuous re-application handling**) was **re-homed to MILESTONE-002 (Robustness / Continuous Re-application)**, where it lives as **EPIC-004** with its children (US-004, US-005, US-006, TS-008) in `backlog`. It is no longer a child of this milestone.
- The former root ACs **AC-7, AC-8, AC-9** (which exercised that deferred robustness behavior) were **moved to MILESTONE-002's root E2E** (now its AC-1/AC-2/AC-3) and are therefore no longer part of this milestone's gate. They remain `[ ]` and unverified under MILESTONE-002.

**Browser-only bugs found & fixed during live QA (recorded for posterity — none reproducible by unit/API tests):**
1. **Content scripts can't be ES modules** — switched to dynamic `import()` + `web_accessible_resources` to load the shared pure logic into the content script.
2. **`chrome.action.setIcon` couldn't fetch icon paths from the MV3 service worker** — switched to decoded `imageData` instead of `path`.
3. **SPA `pushState` navigations were resetting per-tab state** — moved state resets to `chrome.webNavigation.onCommitted` (top-frame document loads only) so in-app navigations no longer strand the icon.

## Root E2E Acceptance Criteria (end-to-end browser journey + real-world gate)
> This is the **root browser journey** for the v1 shipped scope (scaffold → detect → signal → remove → confirm). Every AC below is **[BROWSER]** (no API-only ACs at the root). **AC-1..AC-6** are the controlled, fixture-based journey, written in flow order and covering all descendant behavior of EPIC-001/002/003; each is tagged with the originating child ticket it integrates, so a failure routes the correct child back to inProgress. **AC-10** is the **primary real-world acceptance test** against the user's designated target (**Netflix**) and has no single originating child — it is the Milestone's own real-world gate (see its routing note). These ACs are owned by this Milestone and tested by the root E2E (iterate workflow step 9). **review → qa only when every AC (AC-1 through AC-6, and AC-10) is [x].**
>
> _The former AC-7/AC-8/AC-9 (lifecycle reset, dynamic-add, re-application) covered the deferred robustness scope and were **moved with that scope to MILESTONE-002** (where they are now its root AC-1/AC-2/AC-3). They are intentionally **not** part of this milestone's gate._

- [ ] **AC-1** [BROWSER] (EPIC-001) After loading the unpacked extension, a toolbar icon is present and, on a freshly opened tab on a normal clear page, shows the **default/neutral** state. _(integrates scaffold → manifest/icon plumbing)_
- [ ] **AC-2** [BROWSER] (US-001) Navigating the active tab to the fixture page that contains a `disablepictureinpicture` video turns that tab's icon **orange** automatically, with no user action. _(integrates content-script detection → service-worker per-tab icon)_
- [ ] **AC-3** [BROWSER] (US-002) Opening a second tab on a clear page (a page with a normal, non-suppressed video) shows that tab's icon in the **default** state **while the first tab remains orange** — i.e. icon state is per-tab. _(integrates detection → per-tab signaling, BS-001.3)_
- [ ] **AC-4** [BROWSER] (US-003) Clicking the **orange** toolbar icon on the fixture tab removes the suppression from the video, and the icon turns **green**. _(integrates click handler → removal in content script → green confirmation)_
- [ ] **AC-5** [BROWSER] (US-003 / FS-001.10) After the icon is green, the browser's **native PiP** affordance is available on the previously-suppressed video and the user can pop it out (verified by the native PiP control being usable on that video). _(integrates removal result → native PiP availability)_
- [ ] **AC-6** [BROWSER] (US-002) Clicking the icon on a **clear** tab (default state) produces **no green state and no change** — the no-op guarantee. _(integrates inert/no-op guardrail, BS-001.5)_

### Real-world acceptance gate
> **AC-1..AC-6 above are the controlled, fixture-based validation** (deterministic local pages). **AC-10 below is the primary real-world acceptance test**: the same end-to-end stack exercised against the user's designated real-world target, **Netflix**. AC-10 has **no single originating child** — it is the Milestone's own real-world gate covering the whole stack (detection → orange → click-removal → green → native PiP), so a failure does not auto-route to one child (see the routing note under it). It is **[BROWSER]** and requires **manual Netflix login** (the credentials are the user's; the tester pauses at the `Manual:` steps). `review → qa` still requires **every** root AC (AC-1..AC-6 and AC-10) to be `[x]`.

- [x] **AC-10** [BROWSER] — **real-world E2E validation (primary acceptance test), target: Netflix** — exercises the whole stack end-to-end (detection → orange → click-removal → green → native PiP) against a live blocking site rather than a local fixture. No single originating child (Milestone's real-world gate). Requires manual Netflix login.
  - **Setup (Manual):** PiP Unblocker extension is loaded **unpacked** in Chrome; the user is **logged into Netflix**. _(`Manual:` — the tester pauses here to sign in with the user's own credentials.)_
  - **Navigate:** open a Netflix title and **begin playback**.
  - **Verify:** the extension's toolbar icon turns **ORANGE automatically**, with no user action — Netflix suppresses native PiP via `disablePictureInPicture`, and detection surfaces the blocked state.
  - **Action:** **click** the toolbar icon.
  - **Verify:** the icon turns **GREEN** (suppression removed from the Netflix video).
  - **Action (Manual):** the user invokes the **browser's native Picture-in-Picture** on the Netflix video — e.g. the browser's PiP control, or the right-click-twice (double context-menu) gesture. _(`Manual:` — native PiP is the user's action, per FS-001.10; v1 is unblock-only and never enters PiP itself.)_
  - **Verify:** the Netflix video **opens in a floating Picture-in-Picture window and continues playing**.
  - **Result (2026-06-23):** PASS — verified **live on a Netflix `/watch` page in Brave** via AC-10's `Manual:` steps (product-owner-confirmed) plus automation DOM/console evidence. Pre-click DOM showed both attribute + property suppression (`disablepictureinpicture` present and `disablePictureInPicture === true`) with `pictureInPictureEnabled === true`, and the page console showed the content script loading, scanning, and sending `verdict=blocked`. Icon auto-turned **orange** on detection and **green** on click (PO-confirmed); the PO then invoked **native PiP** and the Netflix video popped into a floating PiP window and kept playing. End-to-end happy path held (no mid-invocation re-force), so no EPIC-004 robustness route triggered.

> **Robustness routing note for AC-10:** the **target behavior is exactly as written above**. However, if Netflix **re-forces `disablePictureInPicture` between the click-removal (green) and the native-PiP invocation** — so PiP fails to open or the icon falls back to orange at the moment of invocation — that is **not** a defect in the happy-path removal; it surfaces a **robustness gap** in **continuous re-application handling / property-setter interception**. That behavior is **out of v1 scope** and lives in **MILESTONE-002 → EPIC-004** (FS-001.8 / BS-001.6 — continuous re-removal & precedence; specifically US-006 / TS-008 continuous observer), so such a failure indicates work to be picked up under that milestone rather than a defect in this milestone's EPIC-003 removal child. AC-10 as accepted held the as-written happy path end-to-end (no mid-invocation re-force occurred).

## Cross-Epic Integration map (producer → consumer)
This milestone's ACs exist specifically to test the seams between epics (prevents integration-gap bugs):
- **EPIC-001 (Scaffold)** produces the manifest, content-script injection, service-worker registration, and per-tab icon API → **consumed by EPIC-002, EPIC-003** (and, downstream, MILESTONE-002's EPIC-004). Covered by **AC-1**.
- **EPIC-002 (Detection & Signaling)** produces the per-tab `{default|blocked}` state + the detected suppressed-video set → **consumed by EPIC-003** (removal needs the detected set and the orange precondition). Covered by **AC-2, AC-3**.
- **EPIC-003 (Removal & Confirmation)** produces the `unblocked`/green state after stripping suppression → **consumed by** the native-PiP step (and, downstream, MILESTONE-002's EPIC-004, where re-application handling baselines from green). Covered by **AC-4, AC-5, AC-6**.

**Cross-milestone seam:** EPIC-002's detection and EPIC-003's removal/green baseline are the v1 outputs that **MILESTONE-002 (Robustness)** consumes and hardens (lifecycle reset, dynamic-add, continuous re-application). That seam is verified by MILESTONE-002's own root journey, not here.

The integration seams explicitly verified by this milestone's root journey:
- detection signal **flows from content-script through to the toolbar icon color** (AC-2, AC-3).
- click intent **flows from the toolbar through to DOM removal and back to a green icon** (AC-4).
- removal output **flows into native PiP availability** (AC-5).

## Test Infrastructure (required for QA — provided by EPIC-001)
- A static **fixture page** containing at least one `<video>` carrying the `disablepictureinpicture` attribute (and a variant forcing the `disablePictureInPicture` property true), a **clear** control page (normal non-suppressed video), a **no-video** page, a **dynamic-add** page (adds a suppressed video via JS after load), and a **re-application** page (re-adds the attribute on an interval after removal). See EPIC-001 / TS for the fixture spec.
- These fixtures replace E2E browser-automation tooling for QA. Missing fixtures → ticket is **BLOCKED**, not skipped.
- Runtime/port: this is a pure client-side extension (content script + service worker), **no backend server, no port required**. If fixtures are served via a local static HTTP server instead of `file://`, allocate a port per the global `~/.claude/port-registry.md` convention and document it; otherwise none is needed.

## Checklist (Epics)
- [x] EPIC-001 — Extension Scaffold (MV3) _(done)_
- [x] EPIC-002 — Detection & Signaling _(done)_
- [x] EPIC-003 — Removal & Confirmation _(done)_

_(EPIC-004 — Robustness was re-homed to **MILESTONE-002** and is no longer a child of this milestone.)_

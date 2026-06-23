# FS-001: Picture-in-Picture Unblocker

## Overview

Some websites suppress the browser's native Picture-in-Picture (PiP) capability on their video players, preventing users from popping a video out into a floating, always-on-top window. This feature provides users with a toolbar control that **detects** when PiP has been suppressed on the current page, **signals** that state through the toolbar icon's color, and — on a single click — **removes the suppression** so the user can then invoke PiP through the browser's own native mechanism.

The value proposition is restoring a capability the user's browser already offers but that the page has deliberately disabled, with zero configuration and a single, obvious control.

**Scope boundary (v1):** This feature only *unblocks* PiP. It does not itself enter or trigger Picture-in-Picture mode — after unblocking, the user invokes PiP using the browser's native affordance (e.g., the player's PiP button or the browser's context menu). Triggering PiP automatically is explicitly out of scope for v1 (see FS-001.10).

---

## Functional Requirements

### FS-001.1: Detect PiP Suppression on the Current Page
**Description**: The system must determine, for the page currently shown in the active tab, whether any video on that page has Picture-in-Picture suppressed.

**Detection signals** (a video is considered "PiP-suppressed" if either is present):
- The video declares a marker indicating PiP is disabled (the `disablepictureinpicture` content attribute).
- The video's runtime PiP-disabled property is forced on (the `disablePictureInPicture` property evaluating to `true`).

**Acceptance Criteria**:
- Given a page containing at least one video with PiP suppressed, the system reports the page as "blocked".
- Given a page where no video has PiP suppressed, the system reports the page as "clear".
- Given a page with multiple videos where only some are suppressed, the system reports the page as "blocked".
- Detection occurs automatically when a page loads, without any user action.
- Detection re-runs when the page is reloaded or the tab navigates to a new page (see FS-001.6).

---

### FS-001.2: Signal "Blocker Detected" via Orange Icon
**Description**: When PiP suppression is detected on the active tab's page, the system must indicate this through the toolbar icon by displaying it in an **orange** state.

**Acceptance Criteria**:
- Given a page reported as "blocked" (FS-001.1), the toolbar icon for that tab is shown in the orange state.
- The orange state is specific to the tab where the blocker was detected; other tabs are unaffected (see BS-001.3).
- The orange state persists for that tab until one of: the blocker is removed (→ green, FS-001.4), the page is navigated/reloaded and re-evaluated (FS-001.6), or the page is found to be clear.

---

### FS-001.3: Signal "No Blocker" via Default Icon
**Description**: When no PiP suppression is detected on the active tab's page, the toolbar icon must be shown in its **default / neutral** state.

**Acceptance Criteria**:
- Given a page reported as "clear" (FS-001.1), the toolbar icon for that tab is shown in the default state.
- The default state is the initial state for any newly opened tab or any page that has not yet been evaluated.
- A page that transitions from "blocked" to "clear" without user removal (e.g., the page itself stops suppressing PiP) returns the icon to the default state on the next evaluation.

---

### FS-001.4: Remove the Blocker on Icon Click
**Description**: When the user clicks the toolbar icon on a page that has PiP suppression, the system must remove the suppression from every affected video on that page.

**Removal actions** (applied to each suppressed video):
- Remove the PiP-disabled marker (the `disablepictureinpicture` content attribute).
- Neutralize the runtime PiP-disabled property so that it no longer evaluates to `true` (the `disablePictureInPicture` property).

**Acceptance Criteria**:
- Given a page reported as "blocked", when the user clicks the toolbar icon, the suppression marker is removed from all affected videos.
- Given a page reported as "blocked", when the user clicks the toolbar icon, the runtime suppression property no longer evaluates to `true` for any affected video.
- After a successful removal, the page is considered "unblocked" and the icon transitions to the green state (FS-001.5).
- Clicking the icon on a page reported as "clear" performs no removal and does not produce a green state (see BS-001.5 for the no-op behavior).
- Removal applies to all suppressed videos present on the page at the moment of the click (see FS-001.7 for videos added later).

---

### FS-001.5: Confirm Removal via Green Icon
**Description**: After the system successfully removes PiP suppression on a page, it must confirm the result by displaying the toolbar icon in a **green** state for that tab.

**Acceptance Criteria**:
- Given a successful removal (FS-001.4), the toolbar icon for that tab is shown in the green state.
- The green state communicates that PiP is now available and the user may invoke it natively.
- The green state is specific to the tab and persists until the page is navigated/reloaded and re-evaluated (FS-001.6) or the blocker is re-applied and re-handled per FS-001.8.

---

### FS-001.6: Recompute State on Navigation and Reload
**Description**: The system must treat icon state as a property of the current page in a tab, recomputing it whenever the tab loads a different page or reloads the current one.

**Acceptance Criteria**:
- When a tab navigates to a new page, the icon resets and detection re-runs against the new page.
- When a tab reloads the current page, the icon resets and detection re-runs; a previously "green" page that re-applies suppression on reload is re-detected as "blocked" (orange).
- Icon state never leaks from one page to the next within a tab without re-evaluation.

---

### FS-001.7: Handle Dynamically Added Videos
**Description**: Pages may add videos after initial load, or replace existing players. The system must account for videos that appear after the page's first evaluation.

**Acceptance Criteria**:
- Given a page that loads "clear" and later adds a suppressed video, the system updates the tab's state to "blocked" (orange) without requiring a reload.
- Given a page already "unblocked" (green) where a newly added video is suppressed, the system reflects that a blocker is again present (see BS-001.6 for state precedence).
- When the user clicks to remove on a page with dynamically added suppressed videos, the most recently known set of suppressed videos is processed.

---

### FS-001.8: Handle Re-Application of the Blocker
**Description**: Some pages actively re-assert PiP suppression — re-adding the marker attribute or re-forcing the property — after it has been removed. The system must define its behavior when this occurs.

> **Implementation status — v1 (partial) / robustness deferred.**
> v1 implements *reactive* re-removal: after the user has unblocked a page, the system watches that page's affected videos and re-removes suppression that the page re-applies as it observes the change (re-added marker, re-forced property, or a replaced/re-added player), keeping the icon green for ordinary re-application. v1 makes a **best effort** but does **not guarantee** it can hold PiP open against a page that *aggressively or persistently re-forces* suppression (e.g. re-applying many times per second, or actively intercepting/reverting the removal). When such a page out-paces re-removal, v1 falls back honestly to the "blocked" (orange) state per BS-001.6.
> The **guaranteed, robust defeat of a persistent re-forcer** (so the page can never win the race) is **deferred to a future iteration (EPIC-004)**. The requirement below is retained in full as the target behavior; only the *strength of the guarantee against aggressive re-forcing* is deferred.

**Behavior**:
- The system watches affected videos (for as long as the page remains loaded, after the user has unblocked) and **re-removes** suppression that the page re-applies, so that ordinary re-application keeps PiP available without further user clicks.
- If re-removal cannot keep a video unblocked, the tab's state reflects "blocked" (orange) so the user is informed (see BS-001.6).

**Acceptance Criteria (v1)**:
- Given a page that re-adds the suppression marker after removal, the system removes it again automatically and the icon remains green.
- Given a page that re-forces the suppression property after it was neutralized, the system neutralizes it again automatically and the icon remains green.
- If the page's re-application out-paces or defeats automatic re-removal, the icon returns to orange to signal the blocker is active again (the user may click again to re-unblock).

**Deferred to a future iteration (EPIC-004):**
- A guarantee that suppression can be held off indefinitely even against a page that *persistently and aggressively re-forces* it — i.e. the page can never win the race and the icon need never fall back to orange for an already-unblocked page.

---

### FS-001.9: Operate Across All Sites by Default
**Description**: Detection and removal must be available on web pages generally, without the user having to enable the feature per site.

**Acceptance Criteria**:
- Detection runs on standard web pages the user visits, with no per-site opt-in required (see BS-001.7 and Assumption A1).
- On browser-internal pages or other contexts where content cannot be inspected, the icon shows the default state and clicking performs no action (see FS-001.11, BS-001.8).

---

### FS-001.10: PiP Invocation Remains Native (Out of Scope for Triggering)
**Description**: The feature's responsibility ends at making PiP available. Entering PiP is performed by the user through the browser's native mechanism.

**Acceptance Criteria**:
- After a successful removal (green state), the user is able to invoke PiP using the browser's native affordance on the unblocked video.
- The system does not, in v1, automatically place any video into PiP.
- No requirement in this specification depends on the system itself entering PiP.

---

### FS-001.11: Graceful Behavior Where the Feature Cannot Apply
**Description**: On pages or contexts where the system cannot inspect or modify content, it must behave predictably and harmlessly.

**Acceptance Criteria**:
- On a page with no video at all, the icon stays in the default state and a click performs no action.
- On a context where page content cannot be accessed, the icon stays in the default state and a click performs no action.
- The feature never produces a green state on a page where no removal actually occurred.

---

## Business Rules

### BS-001.1: Definition of "Blocked"
**Rule**: A page is "blocked" if **at least one** video on it is PiP-suppressed (by marker attribute or by forced property). A page is "clear" only if **no** video is suppressed.
**Rationale**: A single suppressed player is enough to deny the user PiP on the content they care about; the control should activate whenever any opportunity to restore PiP exists.
**Examples**:
- A page with three videos, one suppressed → blocked (orange).
- A page with three videos, none suppressed → clear (default).
- A page with one suppressed video → blocked (orange).

### BS-001.2: Removal Scope Is the Whole Page
**Rule**: A single click removes suppression from **all** suppressed videos currently known on the page, not just one.
**Rationale**: The user expresses a single intent — "let me use PiP here" — and should not have to repeat the action per player.
**Examples**:
- Page has two suppressed videos; one click unblocks both.
- Page has one suppressed and one already-clear video; the click unblocks the suppressed one and leaves the other unchanged.

### BS-001.3: Icon State Is Per-Tab
**Rule**: The icon's color reflects the state of the page in the specific tab it belongs to. Determining one tab's state never changes another tab's icon.
**Rationale**: Users browse many tabs; the control must speak only about the page in view.
**Examples**:
- Tab A (blocked) shows orange while Tab B (clear) shows default, simultaneously.
- Unblocking the page in Tab A turns only Tab A's icon green.

### BS-001.4: State Is Tied to the Current Page, Not Retained Across Navigations
**Rule**: Icon state belongs to the currently loaded page. Navigating or reloading discards the prior state and triggers fresh detection.
**Rationale**: A different page (or a reloaded one) is a different situation; stale signals would mislead the user. v1 does not remember or auto-apply removal across page loads.
**Examples**:
- A page unblocked to green, then reloaded, is re-evaluated; if it re-suppresses PiP it shows orange again and requires another click.
- Navigating from a blocked page to a clear page changes the icon from orange to default.

### BS-001.5: Clicking a Clear Page Is a No-Op
**Rule**: Clicking the icon when the page is "clear" (or has no inspectable content) performs no removal and produces no green confirmation.
**Rationale**: Green specifically means "a blocker was removed and PiP is now available." Showing it without an actual removal would be misleading.
**Examples**:
- User clicks the default icon on a page with no suppressed video → nothing changes.

### BS-001.6: State Precedence — Active Blocker Beats Prior Confirmation
**Rule**: If, at any moment, a suppressed video is present and unhandled on the page, the tab's state is "blocked" (orange), regardless of an earlier green confirmation. Green is shown only while all known videos are unblocked.
**Rationale**: The icon must always reflect the page's *current* truth so the user is never told PiP is available when it is not. This precedence is also how v1 stays honest when re-removal cannot keep up with an aggressive re-forcer (see FS-001.8 "Implementation status"): rather than falsely claiming green, the icon falls back to orange.
**Examples**:
- A green page adds a new suppressed video → orange (until handled per FS-001.7 / FS-001.8).
- A page that re-applies suppression faster than it can be removed → orange (the robust guarantee against this is deferred to EPIC-004 per FS-001.8).

### BS-001.7: Universal Availability, No Per-Site Configuration (v1)
**Rule**: The feature is available on web pages generally without a user-managed allowlist or per-site toggle in v1.
**Rationale**: The problem is simple and the action is non-destructive; configuration would add friction without clear benefit for the first version.
**Examples**:
- The user visits any video site and the icon reflects that page's state immediately, with no setup.

### BS-001.8: Harmless on Non-Applicable Pages
**Rule**: On pages or contexts where content cannot be inspected or modified, the feature stays inert: default icon, no action on click, no errors surfaced to the user.
**Rationale**: Predictable, quiet behavior avoids confusing or alarming the user where nothing can be done.
**Examples**:
- On a browser settings page, the icon is default and clicking does nothing.

---

## Data Requirements

Described functionally (no storage or implementation implied):

- **Per-tab page state**: one of `{ default, blocked, unblocked }`, associated with the currently loaded page in a given tab. Drives the icon color (default → neutral, blocked → orange, unblocked → green). Reset on navigation/reload (BS-001.4).
- **Set of affected videos (per page)**: the collection of videos on the current page currently identified as PiP-suppressed. Used to scope removal (BS-001.2) and to recompute state as videos are added or suppression is re-applied (FS-001.7, FS-001.8).
- **Suppression indicators (per video)**: whether the video carries the PiP-disabled marker and/or has the PiP-disabled property forced on — the two signals that define suppression (FS-001.1).

No user-level configuration data is required in v1 (BS-001.7).

---

## User Interactions

### Flow 1: Page suppresses PiP, user restores it
1. User navigates to a page whose video has PiP suppressed.
2. System detects suppression and shows the icon **orange** for that tab.
3. User clicks the icon.
4. System removes suppression from all affected videos and shows the icon **green**.
5. User invokes Picture-in-Picture using the browser's native mechanism on the video.

### Flow 2: Page does not suppress PiP
1. User navigates to a page with no PiP suppression.
2. System shows the icon in the **default** state.
3. (User can already use native PiP; clicking the icon does nothing — BS-001.5.)

### Flow 3: Page re-applies the blocker after removal
1. From a green state (Flow 1), the page re-asserts suppression.
2. System automatically re-removes ordinary re-application; icon stays **green** (FS-001.8).
3. If the page re-forces suppression faster than v1 can re-remove it, the icon returns to **orange** to inform the user, who may click again (the robust guarantee against an aggressive re-forcer is deferred to EPIC-004 — see FS-001.8).

### Flow 4: Page adds a video after load
1. User is on a page that loaded clear (**default**) or was unblocked (**green**).
2. The page adds a new suppressed video.
3. System updates the tab to **orange** to reflect the new blocker (FS-001.7, BS-001.6).
4. User clicks again to unblock; icon returns to **green**.

### Flow 5: Reload
1. A page shown as **green** is reloaded.
2. System re-evaluates; if the page re-suppresses PiP it shows **orange** again, requiring another click (BS-001.4).

---

## Edge Cases & Error Scenarios

- **No videos on the page**: icon stays default; click is a no-op (FS-001.11, BS-001.8).
- **Multiple suppressed videos**: one click unblocks all (BS-001.2).
- **Mixed videos (some suppressed, some not)**: page is blocked if any are suppressed; removal touches only the suppressed ones (BS-001.1, BS-001.2).
- **Dynamically added suppressed video**: state updates to blocked without reload (FS-001.7).
- **Page re-applies suppression**: system re-removes ordinary re-application automatically; falls back to orange if an aggressive/persistent re-forcer out-paces it (FS-001.8, BS-001.6). The guaranteed defeat of such a re-forcer is deferred to EPIC-004.
- **Navigation/reload mid-session**: state is discarded and recomputed (FS-001.6, BS-001.4).
- **Non-inspectable contexts** (browser-internal pages and similar): feature inert, icon default, click no-op (FS-001.11, BS-001.8).
- **Videos inside nested browsing contexts (iframes)**:
  - *Same-origin nested contexts*: treated as part of the page for detection and removal (Assumption A2).
  - *Cross-origin nested contexts*: **deferred from v1**. Suppression inside a cross-origin frame may not be detectable or removable; the top-level page is evaluated on its own videos. This is a known limitation (Assumption A2).
- **Videos within encapsulated/shadow content**: detection and removal aim to include encapsulated DOM where reachable; deeply encapsulated or closed content is a **known limitation** for v1 (Assumption A3).
- **Video removed/replaced between detection and click**: removal operates on the set known at click time; if a video no longer exists, it is simply skipped, and remaining suppressed videos are still processed (FS-001.7).
- **Rapid repeated clicks**: clicking when already unblocked (green) re-asserts removal and remains green; clicking a clear page stays a no-op (BS-001.5, BS-001.6).

---

## Assumptions

These are sensible defaults adopted to keep v1 moving; each can be revisited.

- **A1 — Universal content surface**: Detection runs on all standard web pages by default, with no per-site allowlist or opt-in in v1 (BS-001.7). If a curated allowlist is later desired, it becomes a separate requirement.
- **A2 — Iframe handling**: Same-origin nested browsing contexts are covered; cross-origin nested contexts are **deferred** from v1 and documented as a known limitation.
- **A3 — Encapsulated DOM**: Detection/removal target reachable encapsulated (shadow) content; deeply or fully closed encapsulated content is a known v1 limitation.
- **A4 — Continuous protection while loaded (v1 best-effort; robustness deferred)**: After the user unblocks a page, the system actively re-removes re-applied suppression for the lifetime of the loaded page (FS-001.8), rather than acting only once per click — treated as part of "removal" rather than a separate user action. v1 handles ordinary re-application; it does **not** guarantee victory against a page that *aggressively or persistently re-forces* suppression (it falls back to orange in that case, BS-001.6). The robust, guaranteed defeat of a persistent re-forcer is **deferred to EPIC-004** (see FS-001.8 "Implementation status").
- **A5 — No cross-load memory**: v1 does not persist a per-site preference or auto-unblock on future visits; each page load is handled fresh (BS-001.4). Persistence is a candidate for a future spec.
- **A6 — Three discrete icon states only**: default, orange, green — no intermediate/loading state is required; transitions are effectively immediate from the user's perspective.
- **A7 — Single toolbar control**: The entire interaction surface is the toolbar icon (color + click). No popup, options page, or additional UI is required in v1.

---

## Dependencies

- **External**: Relies on the browser's native Picture-in-Picture capability being present and invocable by the user after unblocking (FS-001.10). The feature restores access to that native capability but does not provide PiP itself.
- **Internal**: This is the foundational specification (FS-001) for the project; no prior specs are depended upon.

### Intra-Spec Dependency Graph (Forward)

Reads as "A → B": B depends on / is enabled by A.

```
FS-001.1 Detect
   ├─→ FS-001.2 Orange (blocked signal)
   ├─→ FS-001.3 Default (clear signal)
   └─→ FS-001.4 Remove on click
            └─→ FS-001.5 Green (confirmation)
                    └─→ FS-001.10 Native PiP invocation (user)

FS-001.6 Recompute on nav/reload ──→ resets/re-runs FS-001.1 (and therefore 1.2/1.3/1.4/1.5)

FS-001.7 Dynamic videos ──→ feeds FS-001.1 (re-detect) and scopes FS-001.4 (removal set)

FS-001.8 Re-application handling ──→ depends on FS-001.4 (removal) and re-evaluates FS-001.2/1.5 via BS-001.6

FS-001.9 Universal operation ──→ precondition for FS-001.1 running everywhere
FS-001.11 Graceful inert behavior ──→ constrains FS-001.2/1.3/1.4/1.5 on non-applicable pages
```

### Intra-Spec Dependency Graph (Reverse)

Reads as "X ⟵ depends on": what each item requires to be meaningful.

```
FS-001.10 Native PiP        ⟵ FS-001.5 Green ⟵ FS-001.4 Remove ⟵ FS-001.1 Detect ⟵ FS-001.9 Universal operation
FS-001.5 Green confirmation ⟵ FS-001.4 Remove ⟵ FS-001.1 Detect
FS-001.4 Remove on click    ⟵ FS-001.1 Detect ⟵ (FS-001.7 supplies the up-to-date video set)
FS-001.2 Orange signal      ⟵ FS-001.1 Detect ⟵ (BS-001.1 definition of "blocked"); precedence via BS-001.6
FS-001.3 Default signal     ⟵ FS-001.1 Detect
FS-001.8 Re-application      ⟵ FS-001.4 Remove (+ continuous watch) ; surfaces back to FS-001.2 via BS-001.6
FS-001.7 Dynamic videos      ⟵ FS-001.1 Detect (continuous) 
FS-001.6 Recompute           ⟵ navigation/reload events; drives a fresh FS-001.1
FS-001.11 Inert behavior     ⟵ FS-001.9 (defines where the feature does not apply)
```

**Critical path (build order implied):** FS-001.9 → FS-001.1 → FS-001.2 / FS-001.3 → FS-001.4 → FS-001.5 → FS-001.10. Then layer FS-001.6 (lifecycle), FS-001.7 (dynamic), FS-001.8 (re-application), with FS-001.11 as the guardrail throughout.

---

## Open Questions (Essential Only)

Each lists the default assumption adopted if unanswered, so work is not blocked.

1. **Iframe coverage in v1** — Should same-origin iframe videos be unblocked in v1, with cross-origin deferred?
   *Default (A2): yes — cover same-origin nested contexts; defer cross-origin as a known limitation.*

2. **Re-application behavior** — When a page keeps re-applying the blocker, should the system continuously re-remove it for the page's lifetime, or remove only once per click?
   *Default (A4): re-remove while the page is loaded; fall back to orange if it cannot keep PiP available. v1 covers ordinary re-application; robustly defeating an aggressive/persistent re-forcer is deferred to EPIC-004 (see FS-001.8).*

3. **Cross-load memory** — Should the extension remember a per-site choice and auto-unblock on future visits?
   *Default (A5): no — each page load is handled fresh in v1; persistence is deferred to a future spec.*

4. **Universal vs. allowlisted operation** — Run on all sites, or only on a user-managed list?
   *Default (A1): run on all standard pages with no per-site configuration in v1.*

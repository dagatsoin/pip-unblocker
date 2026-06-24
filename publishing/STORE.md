> **Superseded for v1.0.0.** The shipped extension is now named **Netflix PiP
> Unblocker** and scoped to `netflix.com`. Use **`publishing/SUBMISSION.md`** as
> the authoritative, guideline-validated, paste-ready listing copy. This file is
> kept for background/history.

# Store Listing Kit — PiP Unblocker

Copy-and-paste material for the Chrome Web Store (and Edge Add-ons) listing.
Keep this in sync with `manifest.json` — the `name`, `version`, and
`description` below mirror what ships in `dist/pip-unblocker-v1.0.0.zip`.

- **Item name:** PiP Unblocker
- **Version:** 1.0.0
- **Category:** Productivity  _(alternative: Tools — see "Category" below)_
- **Language:** English (United States)

---

## Short description (≤ 132 characters)

> Restores Picture-in-Picture on pages that block it. The icon turns orange when a blocker is detected; click it to re-enable PiP.

`128 / 132` characters. This is the exact string in `manifest.description`; the
store shows it under the item name in search results and the listing header.

---

## Detailed description

> **Watch any video in Picture-in-Picture — even on sites that try to disable it.**
>
> Some websites suppress your browser's built-in Picture-in-Picture (PiP) by
> marking their video players with `disablepictureinpicture`. PiP Unblocker
> quietly detects that and lets you turn PiP back on with a single click.
>
> **How it works**
> - The toolbar icon is the entire interface — there are no menus or pop-ups.
> - **Grey icon** — nothing to do on this page (no PiP blocker found).
> - **Orange icon** — a blocked video was detected on this page.
> - Click the orange icon and it turns **green**: the block has been lifted.
> - Now use your browser's normal Picture-in-Picture control on the video
>   (right-click the video, or use the browser's PiP button).
>
> **What it does and doesn't do**
> - It only removes the *block*. It never starts Picture-in-Picture for you —
>   you stay in control and invoke native PiP yourself.
> - It works entirely on your device. It makes **no network requests**, has
>   **no account or login**, shows **no ads**, and **collects no data**.
> - It keeps protecting a page after you click: if the site re-applies the
>   block, the extension removes it again automatically so PiP stays available.
>
> **Good to know (v1)**
> - Works on the page and its same-origin frames. Videos inside third-party
>   (cross-origin) embeds are not modified in this version.
> - State is per page and not remembered across reloads — each page load is
>   evaluated fresh.
>
> Open source, no trackers, no telemetry. Requires Chrome 111 or newer.

---

## Single-purpose statement (required by the Chrome Web Store)

The store requires every item to describe one narrow purpose. Paste this into
the **"Single purpose"** field:

> The single purpose of this extension is to re-enable the browser's native
> Picture-in-Picture on web pages that suppress it (via the
> `disablepictureinpicture` attribute or property), so the user can then invoke
> Picture-in-Picture themselves. It does nothing else: no data collection, no
> network activity, and no other page modification.

---

## Permission justifications (for the reviewer)

The store asks you to justify each permission in the **"Privacy practices"**
tab. The extension requests exactly one API permission (`webNavigation`), the
all-sites content-script host grant, and one web-accessible resource. Paste
these verbatim — each one states the narrow technical reason and confirms there
is no data use.

> **Host access — `<all_urls>` (all websites)**
> The extension is a content-script utility that must inspect a page's `<video>`
> elements at document start to detect Picture-in-Picture suppression and, on
> user click, remove it. PiP-blocking pages are not confined to any known set of
> domains, so the content script is declared for all sites. The extension reads
> only video PiP attributes/properties and modifies only those; it does not read
> page text, form data, cookies, or browsing history, and sends nothing off the
> device.

> **`webNavigation`**
> Used to keep the toolbar icon correct across navigations: `onCommitted`
> (frameId 0) resets the icon to neutral on a genuine top-frame page load, and
> `onHistoryStateUpdated` triggers a fresh scan on single-page-app route changes
> (e.g. Netflix `/watch`) where no new content script is injected.
> `getAllFrames` enumerates a tab's same-origin frames so the block can be
> removed in each. No navigation history is stored or sent anywhere.

> **`web_accessible_resources` — `src/lib/pip-core.js`**
> Manifest V3 content scripts run as classic scripts and cannot statically
> `import` a module, so the content script loads the shared detection/removal
> logic at runtime via a dynamic `import()` of its extension URL. That single
> file must therefore be web-accessible. The entry is scoped to exactly that one
> module — no other file is exposed.

> **Remote code**
> None. All code is bundled in the package. There is no `eval`, no remotely
> hosted script, and no remote configuration. The only dynamic `import()` targets
> a file shipped inside the extension (`src/lib/pip-core.js`).

> _Note on the host grant:_ in this package the all-sites grant is declared
> through `content_scripts[].matches: ["<all_urls>"]` (not a separate
> `host_permissions` key). The reviewer dashboard surfaces it as host access to
> all sites; the justification above covers it.

---

## Category

- **Recommended: Productivity.** PiP Unblocker removes friction from everyday
  media viewing (keep a video visible while you work in other tabs), which fits
  the Productivity shelf.
- **Acceptable alternative: Tools.** It is a small single-purpose utility, so
  "Tools" is also defensible. Either is fine; pick one at submission.

---

## Screenshot plan (manual — the user captures these)

The Chrome Web Store requires **at least one screenshot**, sized **1280×800**
or **640×400** (1280×800 is recommended for a crisper listing). PNG or JPEG,
maximum 5 screenshots. Capturing them is a **manual step** done in a real
browser with the extension loaded — this kit cannot generate them.

Suggested shots, in order (the icon is small, so zoom/crop the toolbar so the
icon color is unmistakable, or add a short caption to each):

1. **Neutral on a normal page.** A page with no PiP blocker (e.g. a plain
   article or `fixtures/clear.html`). Shows the **grey** icon = "nothing to do."
2. **Orange on a blocking site.** A site that suppresses PiP (Netflix, or open
   `fixtures/blocked.html`). Shows the **orange** icon = "blocker detected."
   This is the most important shot — it demonstrates the core value.
3. **Green after the click.** The same page right after clicking the icon. Shows
   the **green** icon = "block lifted, PiP available now."
4. **PiP in action (optional but recommended).** The video playing in the
   floating Picture-in-Picture window over another tab/app, proving the end
   result the user wanted.

Tips:
- Use the bundled QA fixtures for clean, reproducible shots over `file://`
  (`fixtures/blocked.html` for orange→green, `fixtures/clear.html` for grey).
- Pin the extension so the icon is visible in the toolbar before capturing.
- A simple one-line caption on each image ("Orange = a blocker was found")
  makes the three-state flow obvious in the listing.

A 440×280 or 1400×560 promotional tile is optional and not required to publish.

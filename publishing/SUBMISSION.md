# Chrome Web Store — paste-ready submission guide

Single source of truth for publishing **Netflix PiP Unblocker v1.0.0**. Every
field below is guideline-validated (adversarial review against the Chrome Web
Store program policies) and matches the shipped `manifest.json` (scoped to
`*://*.netflix.com/*`). Paste each block into the matching dashboard field.

Upload package: `dist/pip-unblocker-v1.0.0.zip`
Screenshots: `publishing/screenshots/01-hero.png … 05-private.png` (1280×800)
Privacy policy URL: `https://github.com/dagatsoin/pip-unblocker/blob/main/PRIVACY_POLICY.md`

---

## Store listing

**Item name**
```
Netflix PiP Unblocker
```

**Summary** (short description, ≤132 chars — mirrors manifest.description)
```
Re-enables Picture-in-Picture on Netflix when it is blocked. The toolbar icon turns orange; click it to turn PiP back on.
```

**Category:** Productivity  ·  **Language:** English (United States)

**Detailed description**
```
Watch Netflix in Picture-in-Picture — even when the player turns it off.

Netflix marks its video with the standard "disablepictureinpicture" flag, which
removes the pop-out button from your browser's media controls. Netflix PiP
Unblocker detects that flag and lets you switch Picture-in-Picture back on with
a single click.

How it works
- The toolbar icon is the entire interface — no menus, no pop-ups.
- Grey icon: nothing to do on this page.
- Orange icon: a blocked video was detected.
- Click the orange icon and it turns green: the block has been lifted.
- Now use your browser's normal Picture-in-Picture control (the button in the
  media panel, or right-click the video) to pop the video out.

What it does — and doesn't do
- It runs only on netflix.com and only removes the Picture-in-Picture
  suppression flag on the video element. It reads no page text, media, cookies,
  or browsing history.
- It never starts Picture-in-Picture for you; you stay in control.
- It runs entirely on your device: no network requests, no account, no ads, and
  no data collection of any kind.
- If the page re-applies the block after you click, the extension removes it
  again automatically so PiP stays available.

Open source: https://github.com/dagatsoin/pip-unblocker
Requires Chrome 111 or newer.

Not affiliated with, authorized by, or endorsed by Netflix, Inc. "Netflix" is a
trademark of Netflix, Inc., used here only to describe compatibility.
```

---

## Privacy → Single purpose
```
The single purpose of this extension is to re-enable the browser's native
Picture-in-Picture on Netflix, which suppresses it via the
disablepictureinpicture attribute/property, so the user can invoke
Picture-in-Picture themselves. It does nothing else: it runs only on
netflix.com, collects no data, makes no network requests, and performs no other
page modification.
```

## Privacy → Permission justifications

**Host access — `netflix.com`**
```
The content script is declared only for *://*.netflix.com/*. At document start
it checks Netflix's <video> elements for the standard "disablepictureinpicture"
suppression flag and, only on the user's click, removes that flag so the user
can invoke their browser's native Picture-in-Picture. It reads ONLY that flag
and modifies only that; it does not read page text, media, content, form data,
cookies, or browsing history, stores nothing, and sends nothing off the device.
```

**`webNavigation`**
```
Keeps the per-tab toolbar icon correct across Netflix navigations: onCommitted
(top frame, frameId 0) resets the icon on a genuine page load; onHistoryStateUpdated
triggers a fresh scan on Netflix's single-page-app route changes (e.g. /watch)
where no new content script is injected; getAllFrames enumerates same-origin
frames so the block can be removed in each. No navigation URLs or history are
stored, logged, or transmitted; the API is used only to sync the toolbar icon.
```

**Remote code**
```
None. All code is bundled in the package. There is no eval, no remotely hosted
script, and no remote configuration. The only dynamic import() targets a file
shipped inside the extension (src/lib/pip-core.js).
```

---

## Privacy → Data usage

Answer **No** to every data-type question (none of these are collected or used):
Personally identifiable information · Health · Financial and payment ·
Authentication · Personal communications · Location · Web history ·
User activity · Website content.

> Why "Website content = No": the extension reads only the boolean
> `disablepictureinpicture` control flag on the video element — not text, media,
> or hyperlinks — and never stores or transmits anything. Keep every field
> consistent on this point so there is no contradiction for the reviewer.

Check **all three** certifications (all true):
- I do not sell or transfer user data to third parties, outside of the approved use cases.
- I do not use or transfer user data for purposes unrelated to my item's single purpose.
- I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL**
```
https://github.com/dagatsoin/pip-unblocker/blob/main/PRIVACY_POLICY.md
```

---

## Screenshots (upload in this order)

1. `01-hero.png` — before/after of the media panel: PiP button missing → enabled.
2. `02-orange.png` — Step 1: PiP button missing; the icon turns orange.
3. `03-green.png` — Step 2: one click turns the icon green; the PiP button reappears.
4. `04-pip.png` — the payoff: video floating in Picture-in-Picture while you work.
5. `05-private.png` — private by design + the three icon states.

The screenshots reference `netflix.com` in text only (nominative) and use a
neutral favicon — no Netflix logo or brand colors — to stay clear of trademark
issues, consistent with comparable published extensions.

---

## Pre-submit checklist

- [ ] Sign into the dashboard with the intended publisher account.
- [ ] One-time **$5** developer registration (if not already done).
- [ ] Upload `dist/pip-unblocker-v1.0.0.zip`.
- [ ] Paste all fields above; set category Productivity, language en-US.
- [ ] Set all Data-usage answers to No; check the 3 certifications; add the privacy URL.
- [ ] Upload the 5 screenshots in order.
- [ ] Review once, then Submit.

## Notes / optional hardening

- `webNavigation` may surface a "Read your browsing history" install warning.
  It is justified above and accesses no host data. If you later want to drop that
  warning entirely, the icon-sync logic could be reworked to use `tabs` events
  scoped to the active tab — a code change, out of scope for v1.0.0.
- Edge Add-ons accepts the same zip and copy; it more often requires the privacy
  policy URL (already provided).

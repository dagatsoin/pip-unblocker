# PiP Unblocker (Chrome MV3)

Re-enables Picture-in-Picture on pages that suppress it. The toolbar icon is the
whole UI:

| Icon       | Meaning                                                            |
| ---------- | ----------------------------------------------------------------- |
| **slate**  | default — no PiP blocker on this page (or nothing to inspect)      |
| **orange** | a blocked video was detected on this page                         |
| **green**  | you clicked and the blocker was removed — use native PiP now       |

Implements `specs/FS-001-pip-unblocker.md`. No build step, no backend.

## Load the unpacked extension

There is **no build step** — load this folder directly.

1. Open `chrome://extensions` in Chrome (version **111+**).
2. Toggle **Developer mode** on (top-right).
3. Click **Load unpacked**.
4. Select this directory — the repository root (the folder that contains
   `manifest.json`).

5. The **PiP Unblocker** action icon appears in the toolbar (pin it if needed).

After editing source, click the **reload** ↻ icon on the extension card in
`chrome://extensions` to pick up changes.

## Run the unit tests

Requires Node 18+ (uses the built-in `node:test` runner). No dependencies to
install.

```bash
# from the repository root
npm test
```

Regenerate the toolbar icons (only needed if you change colors/sizes):

```bash
npm run icons
```

## QA fixtures

Open these directly via `file://` in the browser where the extension is loaded.
Each page shows a live inspector (bottom-right) of every video's
attribute/property state and the expected verdict.

| Fixture                                | Expected behavior                                                                |
| -------------------------------------- | -------------------------------------------------------------------------------- |
| `fixtures/blocked.html`                | orange on load; click → strips attribute → green; native PiP then works          |
| `fixtures/blocked-property.html`       | orange on load (property only); click → property no longer `true` → green        |
| `fixtures/blocked-multi.html`          | orange; one click unblocks both suppressed videos, leaves the clear one → green  |
| `fixtures/clear.html`                  | stays default; clicking does nothing (no green)                                  |
| `fixtures/no-video.html`               | stays default; clicking does nothing, no errors                                  |
| `fixtures/dynamic-add.html`            | starts default, flips to orange ~1.5s later when a blocked video is injected     |
| `fixtures/reapply.html`                | after click, stays green while auto-re-removing; aggressive variant may go orange|
| `fixtures/iframe-same-origin.html`     | same-origin embedded blocker detected → orange; click → green                    |

Example path to open (substitute the absolute path to your local clone):

```
file:///path/to/chrome-plugin-pip/fixtures/blocked.html
```

Browser-internal pages (e.g. `chrome://newtab`) should show the **default** icon
and do nothing on click — the inert case.

## Known v1 limitations

- Cross-origin iframe videos are not handled (same-origin only).
- Deeply nested / closed shadow DOM is out of reach (open shadow roots work).
- No persistence — every page load is evaluated fresh.
- The extension does not enter PiP itself; you invoke the browser's native PiP.

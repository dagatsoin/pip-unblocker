# Store screenshots — PiP Unblocker (Netflix)

Five ready-to-upload Chrome Web Store / Edge Add-ons screenshots, **1280×800 PNG**
(the recommended store size; max 5 images). The story they tell: Netflix strips
the browser's Picture-in-Picture button from the media panel, and one click of
the extension puts it back.

Upload in this order:

1. `01-hero.png` — "Pop Netflix out of the tab." Before/after of the browser
   media panel: no PiP button → PiP enabled.
2. `02-orange.png` — Step 1, detect. The media panel has no pop-out button; the
   icon turns **orange**.
3. `03-green.png` — Step 2, enable. One click turns the icon **green** and the
   PiP button reappears in the media panel.
4. `04-pip.png` — The payoff: Netflix floating in a Picture-in-Picture window
   while you work.
5. `05-private.png` — Private by design + the three icon states (grey/orange/green).

## Notes

- The extension's **real toolbar icons** (`icons/{default,orange,green}-128.png`)
  are embedded in every shot — colours are accurate.
- The "playing video" behind the UI is a procedurally generated, license-free
  still (`video-still.png`) — Netflix content renders black under screen capture
  (DRM), so a clean illustrative frame is used.
- "Netflix" and the red mark are used nominatively to show the supported site;
  no affiliation is implied.

## Regenerate

```bash
python3 make_video_still.py        # writes video-still.png
python3 generate-screenshots.py    # writes 01..05 *.png
```

Requires `cairosvg`, `pillow`, `numpy` (`pip install --break-system-packages …`).
Edit copy/branding at the top of `generate-screenshots.py`.

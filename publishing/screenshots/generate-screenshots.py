#!/usr/bin/env python3
"""
Polished 1280x800 Chrome Web Store marketing screenshots for PiP Unblocker.

Key story (per product owner): the browser's MEDIA control panel gains a
Picture-in-Picture toggle once the extension lifts the site's block. The shots
recreate the real Brave/Chrome media hub popover in a clean, legible way and
embed the extension's REAL toolbar icon PNGs (icons/{default,orange,green}-128).

Run:  python3 generate-screenshots.py   ->  01..05 *.png (all 1280x800)
"""
import base64
import os
import cairosvg

HERE = os.path.dirname(os.path.abspath(__file__))
ICONS = os.path.join(HERE, "..", "..", "icons")
W, H = 1280, 800

INK = "#0b1220"
INK2 = "#101a2e"
ORANGE = "#f97316"
GREEN = "#16a34a"
SLATE = "#4b5563"
WHITE = "#ffffff"
TXT = "#e7ecf3"
MUT = "#9fb0c7"
CHROME = "#f1f3f4"
PANEL = "#26262b"        # media popover bg (Brave dark)
PANEL_HI = "#34343b"
FONT = "Liberation Sans, Arial, sans-serif"


def b64_icon(name):
    with open(os.path.join(ICONS, name), "rb") as f:
        return "data:image/png;base64," + base64.b64encode(f.read()).decode()


IC_DEFAULT = b64_icon("default-128.png")
IC_ORANGE = b64_icon("orange-128.png")
IC_GREEN = b64_icon("green-128.png")
ICON = {"default": IC_DEFAULT, "orange": IC_ORANGE, "green": IC_GREEN}

with open(os.path.join(HERE, "video-still.png"), "rb") as _f:
    VIDEO_B64 = "data:image/png;base64," + base64.b64encode(_f.read()).decode()

_VCLIP = [0]


def place_video(x, y, w, h, r=12, dim=0.0, play=True, controls=True):
    """Embed the cinematic still as a 'playing video', cropped to fill."""
    _VCLIP[0] += 1
    cid = f"vclip{_VCLIP[0]}"
    s = f'<clipPath id="{cid}"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}"/></clipPath>'
    s += f'<g clip-path="url(#{cid})">'
    s += (f'<image x="{x}" y="{y}" width="{w}" height="{h}" href="{VIDEO_B64}" '
          f'preserveAspectRatio="xMidYMid slice"/>')
    if dim:
        s += f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="#0b1020" opacity="{dim}"/>'
    if play:
        pcx, pcy = x + w / 2, y + h / 2
        pr = max(18, h * 0.11)
        s += f'<circle cx="{pcx}" cy="{pcy}" r="{pr}" fill="#ffffff" opacity="0.92"/>'
        tri = pr * 0.42
        s += f'<path d="M{pcx-tri*0.5},{pcy-tri} L{pcx+tri*0.85},{pcy} L{pcx-tri*0.5},{pcy+tri} Z" fill="#1e293b"/>'
    if controls:
        by = y + h - 26
        s += f'<rect x="{x+18}" y="{by}" width="{w-36}" height="4" rx="2" fill="#ffffff" opacity="0.35"/>'
        s += f'<rect x="{x+18}" y="{by}" width="{(w-36)*0.4}" height="4" rx="2" fill="#ffffff"/>'
        s += f'<circle cx="{x+18+(w-36)*0.4}" cy="{by+2}" r="6" fill="#ffffff"/>'
    s += '</g>'
    return s


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def text(x, y, s, size, color=TXT, weight="normal", anchor="start", spacing=None, opacity=1):
    ls = f' letter-spacing="{spacing}"' if spacing is not None else ""
    return (f'<text x="{x}" y="{y}" font-family="{FONT}" font-size="{size}" '
            f'font-weight="{weight}" fill="{color}" text-anchor="{anchor}"'
            f'{ls} opacity="{opacity}">{esc(s)}</text>')


def defs():
    return f'''<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="0.4" y2="1">
    <stop offset="0" stop-color="{INK}"/><stop offset="1" stop-color="{INK2}"/>
  </linearGradient>
  <linearGradient id="video" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#1e293b"/><stop offset="0.55" stop-color="#3b2f6b"/>
    <stop offset="1" stop-color="#b4530f"/>
  </linearGradient>
  <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#ffd9a0"/><stop offset="0.6" stop-color="#fb923c"/>
    <stop offset="1" stop-color="#fb923c" stop-opacity="0"/>
  </radialGradient>
</defs>
<rect width="{W}" height="{H}" fill="url(#bg)"/>'''


def glow(cx, cy, r, color, op=0.16):
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{color}" opacity="{op}"/>'


def pip_glyph(cx, cy, stroke, scale=1.0, fill_inner=True):
    """Picture-in-Picture toggle glyph centred at (cx,cy)."""
    ow, oh = 26 * scale, 19 * scale
    x0, y0 = cx - ow / 2, cy - oh / 2
    iw, ih = 12 * scale, 9 * scale
    s = (f'<rect x="{x0}" y="{y0}" width="{ow}" height="{oh}" rx="{3*scale}" '
         f'fill="none" stroke="{stroke}" stroke-width="{2*scale}"/>')
    if fill_inner:
        s += (f'<rect x="{x0+ow-iw-2*scale}" y="{y0+oh-ih-2*scale}" width="{iw}" '
              f'height="{ih}" rx="{1.5*scale}" fill="{stroke}"/>')
    return s


def note_glyph(cx, cy, color):
    """Brave media 'now playing' music-note button glyph."""
    s = f'<circle cx="{cx-6}" cy="{cy+7}" r="4.5" fill="{color}"/>'
    s += f'<circle cx="{cx+7}" cy="{cy+4}" r="4.5" fill="{color}"/>'
    s += f'<rect x="{cx-2.2}" y="{cy-9}" width="2.2" height="16" fill="{color}"/>'
    s += f'<rect x="{cx+9}" y="{cy-12}" width="2.2" height="16" fill="{color}"/>'
    s += f'<path d="M{cx-2.2},{cy-9} L{cx+11.2},{cy-12} L{cx+11.2},{cy-7} L{cx-2.2},{cy-4} Z" fill="{color}"/>'
    return s


def netflix_favicon(x, y, sz=22):
    """Red rounded square with a stylised white 'N'."""
    s = f'<rect x="{x}" y="{y}" width="{sz}" height="{sz}" rx="6" fill="#e50914"/>'
    s += (f'<path d="M{x+6},{y+sz-4} V{y+4} h3.5 l5,11 V{y+4} h3.5 V{y+sz-4} h-3.5 '
          f'l-5,-11 V{y+sz-4} Z" fill="#ffffff"/>')
    return s


def media_popover(x, y, w, with_pip, highlight=None, site="netflix.com", title="Netflix"):
    """Recreate the browser media-control popover. with_pip toggles the PiP
    button; highlight (color) rings the PiP button to draw the eye."""
    h = 196
    s = f'<rect x="{x-5}" y="{y-5}" width="{w+10}" height="{h+10}" rx="18" fill="#000000" opacity="0.28"/>'
    s += f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="14" fill="{PANEL}"/>'
    s += f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="14" fill="none" stroke="#ffffff" stroke-opacity="0.08"/>'
    # header: favicon + domain
    s += netflix_favicon(x + 24, y + 21)
    s += text(x + 46 + 14, y + 39, site, 16, "#c9cdd6", "normal")
    # PiP toggle (top-right) — the hero element
    px, py = x + w - 38, y + 33
    if with_pip:
        if highlight:
            s += f'<circle cx="{px}" cy="{py}" r="22" fill="{highlight}" fill-opacity="0.16"/>'
            s += f'<circle cx="{px}" cy="{py}" r="22" fill="none" stroke="{highlight}" stroke-width="2.5"/>'
        s += pip_glyph(px, py, "#f2f4f8", 1.0)
    else:
        # absent: faint dashed placeholder
        s += pip_glyph(px, py, "#4b4b52", 1.0, fill_inner=False)
        s += f'<line x1="{px-15}" y1="{py+15}" x2="{px+15}" y2="{py-15}" stroke="#6b6b73" stroke-width="2" stroke-linecap="round"/>'
    # title + big play
    s += text(x + 26, y + 96, title, 26, "#ffffff", "bold")
    bcx, bcy = x + w - 58, y + 92
    s += f'<circle cx="{bcx}" cy="{bcy}" r="27" fill="#c4c0f5"/>'
    s += f'<path d="M{bcx-7},{bcy-11} L{bcx+12},{bcy} L{bcx-7},{bcy+11} Z" fill="#2a2350"/>'
    # transport row
    ty = y + 150
    cc = "#d6d9e0"
    # prev
    s += f'<path d="M{x+34},{ty-7} v14 M{x+34},{ty} l11,-8 v16 Z" stroke="{cc}" stroke-width="2" fill="{cc}"/>'
    # rewind 10
    s += f'<circle cx="{x+74}" cy="{ty}" r="9" fill="none" stroke="{cc}" stroke-width="2" stroke-dasharray="40 8"/>'
    s += text(x + 74, ty + 4, "10", 8, cc, "bold", "middle")
    # scrubber
    sx0, sx1 = x + 104, x + w - 96
    s += f'<line x1="{sx0}" y1="{ty}" x2="{sx1}" y2="{ty}" stroke="#55555d" stroke-width="3" stroke-linecap="round"/>'
    s += f'<line x1="{sx0}" y1="{ty}" x2="{sx0+18}" y2="{ty}" stroke="#d6d9e0" stroke-width="3" stroke-linecap="round"/>'
    s += f'<circle cx="{sx0+18}" cy="{ty}" r="5" fill="#ffffff"/>'
    # fwd 10
    s += f'<circle cx="{x+w-72}" cy="{ty}" r="9" fill="none" stroke="{cc}" stroke-width="2" stroke-dasharray="40 8"/>'
    s += text(x + w - 72, ty + 4, "10", 8, cc, "bold", "middle")
    # next
    s += f'<path d="M{x+w-34},{ty-7} v14 M{x+w-34},{ty} l-11,-8 v16 Z" stroke="{cc}" stroke-width="2" fill="{cc}"/>'
    return s, (px, py), h


def toolbar_strip(x, y, w, url, icon_state, media_hi=None, ext_hi=None):
    """A light browser toolbar: address pill + media(note) button + extension
    icon + menu. Returns media-button and ext-icon centres."""
    th = 58
    s = f'<rect x="{x}" y="{y}" width="{w}" height="{th}" rx="14" fill="{CHROME}"/>'
    # nav arrows
    s += f'<path d="M{x+30},{y+22} l-8,7 l8,7" fill="none" stroke="#5b6675" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>'
    s += f'<circle cx="{x+62}" cy="{y+29}" r="9" fill="none" stroke="#9aa2af" stroke-width="2.4" stroke-dasharray="40 10"/>'
    # address pill
    ax = x + 92
    aw = w - 300
    s += f'<rect x="{ax}" y="{y+13}" width="{aw}" height="32" rx="16" fill="#ffffff"/>'
    s += f'<circle cx="{ax+22}" cy="{y+29}" r="6" fill="none" stroke="#7b8493" stroke-width="2"/>'
    s += text(ax + 40, y + 34, url, 14, "#5b6675", "normal")
    # right cluster
    mcx = x + w - 150          # media button
    if media_hi:
        s += f'<circle cx="{mcx}" cy="{y+29}" r="20" fill="{media_hi}" fill-opacity="0.14"/>'
        s += f'<circle cx="{mcx}" cy="{y+29}" r="20" fill="none" stroke="{media_hi}" stroke-width="2"/>'
    s += note_glyph(mcx, y + 29, "#3c4655")
    # extension icon (real)
    ecx = x + w - 92
    if ext_hi:
        s += f'<circle cx="{ecx}" cy="{y+29}" r="20" fill="{ext_hi}" fill-opacity="0.16"/>'
        s += f'<circle cx="{ecx}" cy="{y+29}" r="20" fill="none" stroke="{ext_hi}" stroke-width="2"/>'
    s += f'<image x="{ecx-15}" y="{y+14}" width="30" height="30" href="{ICON[icon_state]}"/>'
    # menu dots
    for i in range(3):
        s += f'<circle cx="{x+w-40}" cy="{y+20+i*9}" r="2.4" fill="#5b6675"/>'
    return s, (mcx, y + 29), (ecx, y + 29)


def video_scene(x, y, w, h, r=12):
    cid = f"clip{int(x)}{int(y)}{int(w)}"
    s = f'<clipPath id="{cid}"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}"/></clipPath>'
    s += f'<g clip-path="url(#{cid})">'
    s += f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="url(#video)"/>'
    sx, sy = x + w * 0.66, y + h * 0.42
    s += f'<circle cx="{sx}" cy="{sy}" r="{h*0.5}" fill="url(#sun)"/>'
    s += f'<circle cx="{sx}" cy="{sy}" r="{h*0.16}" fill="#ffe7c2"/>'
    hy = y + h * 0.72
    s += (f'<path d="M{x},{hy+30} Q{x+w*0.25},{hy-20} {x+w*0.5},{hy+15} '
          f'T{x+w},{hy} V{y+h} H{x} Z" fill="#2a1b3d" opacity="0.85"/>')
    s += '</g>'
    pcx, pcy = x + w / 2, y + h / 2
    pr = max(16, h * 0.12)
    s += f'<circle cx="{pcx}" cy="{pcy}" r="{pr}" fill="#ffffff" opacity="0.92"/>'
    tri = pr * 0.42
    s += f'<path d="M{pcx-tri*0.5},{pcy-tri} L{pcx+tri*0.85},{pcy} L{pcx-tri*0.5},{pcy+tri} Z" fill="#1e293b"/>'
    return s


def _wrap(s, n):
    words, lines, cur = s.split(), [], ""
    for w in words:
        if len(cur + " " + w) <= n:
            cur = (cur + " " + w).strip()
        else:
            lines.append(cur)
            cur = w
    lines.append(cur)
    return lines


def callout(px, py, bx, by, bw, bh, icon, label, sub, accent, side="left"):
    ax = bx + bw if side == "left" else bx
    s = f'<line x1="{ax}" y1="{by+bh/2}" x2="{px}" y2="{py}" stroke="{accent}" stroke-width="2" stroke-dasharray="2 5" stroke-linecap="round"/>'
    s += f'<circle cx="{px}" cy="{py}" r="4" fill="{accent}"/>'
    s += f'<rect x="{bx}" y="{by}" width="{bw}" height="{bh}" rx="16" fill="#0e1a2e" stroke="{accent}" stroke-opacity="0.55" stroke-width="1.5"/>'
    s += f'<rect x="{bx+18}" y="{by+20}" width="50" height="50" rx="13" fill="{accent}" fill-opacity="0.16"/>'
    if icon in ICON:
        s += f'<image x="{bx+25}" y="{by+27}" width="36" height="36" href="{ICON[icon]}"/>'
    else:
        s += pip_glyph(bx + 43, by + 45, accent, 1.15)
    tx = bx + 82
    s += text(tx, by + 42, label, 19, TXT, "bold")
    lines = _wrap(sub, 18)
    for j, ln in enumerate(lines[:2]):
        s += text(tx, by + 64 + j * 19, ln, 13.5, MUT)
    return s


def wrapper(inner):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" '
            f'viewBox="0 0 {W} {H}">{inner}</svg>')


def render(name, svg):
    cairosvg.svg2png(bytestring=svg.encode(), write_to=os.path.join(HERE, name + ".png"),
                     output_width=W, output_height=H)
    print("wrote", name + ".png")


# ---- 01 HERO: before -> after of the media panel --------------------------
def shot_hero():
    s = defs()
    # full-bleed playing video, heavily dimmed, as the page behind everything
    s += place_video(0, 0, W, H, r=0, dim=0.72, play=False, controls=False)
    s += glow(250, 150, 280, ORANGE, 0.13)
    s += glow(1040, 700, 320, GREEN, 0.12)
    s += text(640, 120, "PICTURE-IN-PICTURE UNBLOCKER FOR NETFLIX", 15, ORANGE, "bold", spacing="2", anchor="middle")
    s += text(640, 186, "Pop Netflix out of the tab", 52, WHITE, "bold", anchor="middle")
    s += text(640, 226, "Netflix hides your browser’s Picture-in-Picture button. PiP Unblocker puts it back — in one click.", 19, MUT, anchor="middle")
    # before panel
    pw = 430
    bs, _, ph = media_popover(120, 330, pw, with_pip=False)
    s += bs
    s += text(120 + pw / 2, 330 + ph + 42, "Before — no PiP button", 18, MUT, "bold", anchor="middle")
    # after panel
    ax = W - 120 - pw
    asx, (apx, apy), _ = media_popover(ax, 330, pw, with_pip=True, highlight=GREEN)
    s += asx
    s += text(ax + pw / 2, 330 + ph + 42, "After — Picture-in-Picture enabled", 18, "#9be8b6", "bold", anchor="middle")
    # center arrow with icon flip
    midx = W / 2
    s += f'<circle cx="{midx}" cy="428" r="40" fill="#0e1a2e" stroke="#ffffff" stroke-opacity="0.1"/>'
    s += f'<image x="{midx-22}" y="406" width="44" height="44" href="{IC_GREEN}"/>'
    s += f'<path d="M{midx-70},428 h44" stroke="#5b6b85" stroke-width="3" stroke-linecap="round"/>'
    s += f'<path d="M{midx+26},428 h44 m-12,-7 l12,7 l-12,7" fill="none" stroke="{GREEN}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'
    s += text(640, 690, "No accounts · no network calls · no tracking · no ads · open source", 17, "#7d8ca3", anchor="middle")
    render("01-hero", wrapper(s))


def browser_window(x, y, w, h, url, icon_state, media_hi=None, ext_hi=None, dim=0.0):
    """Full browser window whose content area is a playing video. Returns
    media-button and extension-icon centres (for connectors/popover anchor)."""
    s = f'<rect x="{x-4}" y="{y-4}" width="{w+8}" height="{h+8}" rx="18" fill="#000000" opacity="0.22"/>'
    s += f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="16" fill="#ffffff"/>'
    th = 50
    s += f'<path d="M{x+16},{y} H{x+w-16} A16,16 0 0 1 {x+w},{y+16} V{y+th} H{x} V{y+16} A16,16 0 0 1 {x+16},{y} Z" fill="{CHROME}"/>'
    for i, c in enumerate(["#ff5f57", "#febc2e", "#28c840"]):
        s += f'<circle cx="{x+24+i*20}" cy="{y+25}" r="6" fill="{c}"/>'
    # address pill
    ax = x + 100
    aw = w - 300
    s += f'<rect x="{ax}" y="{y+13}" width="{aw}" height="26" rx="13" fill="#ffffff"/>'
    s += f'<circle cx="{ax+18}" cy="{y+26}" r="5.5" fill="none" stroke="#7b8493" stroke-width="2"/>'
    s += text(ax + 34, y + 31, url, 13.5, "#5b6675")
    # right cluster: media button + extension icon + menu
    mcx = x + w - 132
    if media_hi:
        s += f'<circle cx="{mcx}" cy="{y+26}" r="18" fill="{media_hi}" fill-opacity="0.16"/>'
        s += f'<circle cx="{mcx}" cy="{y+26}" r="18" fill="none" stroke="{media_hi}" stroke-width="2"/>'
    s += note_glyph(mcx, y + 26, "#3c4655")
    ecx = x + w - 82
    if ext_hi:
        s += f'<circle cx="{ecx}" cy="{y+26}" r="18" fill="{ext_hi}" fill-opacity="0.18"/>'
        s += f'<circle cx="{ecx}" cy="{y+26}" r="18" fill="none" stroke="{ext_hi}" stroke-width="2"/>'
    s += f'<image x="{ecx-14}" y="{y+12}" width="28" height="28" href="{ICON[icon_state]}"/>'
    for i in range(3):
        s += f'<circle cx="{x+w-38}" cy="{y+18+i*8}" r="2.2" fill="#5b6675"/>'
    # content area = playing video, clipped to bottom rounded corners
    cy0 = y + th
    s += place_video(x, cy0, w, h - th, r=0, dim=dim)
    # re-round bottom corners with two corner masks
    s += f'<path d="M{x},{y+h-16} V{y+h} H{x+16} A16,16 0 0 1 {x},{y+h-16} Z" fill="{INK2}"/>'
    s += f'<path d="M{x+w},{y+h-16} V{y+h} H{x+w-16} A16,16 0 0 0 {x+w},{y+h-16} Z" fill="{INK2}"/>'
    return s, (mcx, y + 26), (ecx, y + 26)


# ---- 02 ORANGE: detected --------------------------------------------------
def shot_orange():
    s = defs()
    s += glow(1090, 150, 300, ORANGE, 0.14)
    s += text(110, 112, "STEP 1 — DETECT", 16, ORANGE, "bold", spacing="2")
    s += text(108, 172, "Netflix hides the PiP button", 48, WHITE, "bold")
    s += text(110, 214, "On Netflix the browser’s media panel has no pop-out button — so PiP", 19, MUT)
    s += text(110, 240, "Unblocker spots the block and turns its icon orange.", 19, MUT)
    bs, (mcx, mcy), (ecx, ecy) = browser_window(110, 286, 900, 454, "netflix.com/watch/81234876", "orange", media_hi=ORANGE, ext_hi=ORANGE, dim=0.12)
    s += bs
    # media popover dropping from the media button
    pw = 540
    px0 = min(mcx - pw + 60, 110 + 900 - pw - 20)
    pop, (px, py), ph = media_popover(px0, mcy + 30, pw, with_pip=False)
    s += pop
    s += f'<line x1="{mcx}" y1="{mcy+18}" x2="{mcx}" y2="{mcy+30}" stroke="#cfd3da" stroke-width="2"/>'
    s += callout(px, py, 1018, 318, 244, 124, "orange", "Orange", "Blocked video found", ORANGE, side="right")
    s += callout(px, py, 1018, 470, 244, 124, "pip", "No PiP yet", "Media panel can’t pop out", "#94a3b8", side="right")
    render("02-orange", wrapper(s))


# ---- 03 GREEN: enabled ----------------------------------------------------
def shot_green():
    s = defs()
    s += glow(1090, 150, 300, GREEN, 0.16)
    s += text(110, 112, "STEP 2 — ENABLE", 16, GREEN, "bold", spacing="2")
    s += text(108, 172, "One click brings it back", 48, WHITE, "bold")
    s += text(110, 214, "Click the icon — it turns green and Netflix’s Picture-in-Picture button", 19, MUT)
    s += text(110, 240, "reappears in your browser’s media controls, ready to use.", 19, MUT)
    bs, (mcx, mcy), (ecx, ecy) = browser_window(110, 286, 900, 454, "netflix.com/watch/81234876", "green", media_hi=GREEN, ext_hi=GREEN, dim=0.12)
    s += bs
    pw = 540
    px0 = min(mcx - pw + 60, 110 + 900 - pw - 20)
    pop, (px, py), ph = media_popover(px0, mcy + 30, pw, with_pip=True, highlight=GREEN)
    s += pop
    s += f'<line x1="{mcx}" y1="{mcy+18}" x2="{mcx}" y2="{mcy+30}" stroke="#cfd3da" stroke-width="2"/>'
    s += callout(px, py, 1018, 318, 244, 124, "green", "Green", "Unblocked instantly", GREEN, side="right")
    s += callout(px, py, 1018, 470, 244, 124, "pip", "PiP is back", "Pop out & multitask", GREEN, side="right")
    render("03-green", wrapper(s))


# ---- 04 PiP IN ACTION -----------------------------------------------------
def doc_app(x, y, w, h):
    s = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="#ffffff"/>'
    pad = 46
    s += text(x + pad, y + 60, "Quarterly report", 27, "#0f172a", "bold")
    yy = y + 96
    for i in range(7):
        ww = w - pad * 2 - (i % 3) * 80
        s += f'<rect x="{x+pad}" y="{yy}" width="{ww}" height="13" rx="6.5" fill="#e8edf3"/>'
        yy += 32
    return s


def shot_pip():
    s = defs()
    s += glow(220, 690, 320, GREEN, 0.12)
    s += text(110, 116, "THE PAYOFF", 16, GREEN, "bold", spacing="2")
    s += text(108, 176, "Keep Netflix playing while you work", 50, WHITE, "bold")
    s += text(110, 220, "Pop Netflix into a floating window that stays on top — switch tabs and", 20, MUT)
    s += text(110, 248, "apps without missing a second.", 20, MUT)
    # work window
    x0, y0, w0, h0 = 110, 308, 1060, 432
    s += f'<rect x="{x0}" y="{y0}" width="{w0}" height="{h0}" rx="16" fill="#ffffff"/>'
    th = 46
    s += f'<path d="M{x0+16},{y0} H{x0+w0-16} A16,16 0 0 1 {x0+w0},{y0+16} V{y0+th} H{x0} V{y0+16} A16,16 0 0 1 {x0+16},{y0} Z" fill="{CHROME}"/>'
    for i, c in enumerate(["#ff5f57", "#febc2e", "#28c840"]):
        s += f'<circle cx="{x0+24+i*20}" cy="{y0+23}" r="6" fill="{c}"/>'
    s += text(x0 + 110, y0 + 30, "docs.example/q3-report", 14, "#5b6675")
    s += doc_app(x0, y0 + th, w0, h0 - th)
    # floating PiP window
    fx, fy, fw, fh = 760, 470, 360, 222
    s += f'<rect x="{fx-6}" y="{fy-6}" width="{fw+12}" height="{fh+12}" rx="16" fill="#000000" opacity="0.28"/>'
    s += f'<rect x="{fx}" y="{fy}" width="{fw}" height="{fh}" rx="12" fill="#0b1220"/>'
    s += place_video(fx + 6, fy + 6, fw - 12, fh - 42, r=8, play=True, controls=False)
    s += netflix_favicon(fx + 14, fy + fh - 27, 16)
    s += text(fx + 38, fy + fh - 13, "Netflix · Picture-in-Picture", 14, "#cbd5e1")
    s += pip_glyph(fx + fw - 24, fy + fh - 18, "#cbd5e1", 0.8)
    render("04-pip", wrapper(s))


# ---- 05 PRIVATE / SUMMARY -------------------------------------------------
def shot_private():
    s = defs()
    s += glow(640, 130, 340, ORANGE, 0.10)
    s += text(640, 128, "PRIVATE BY DESIGN", 16, ORANGE, "bold", spacing="2", anchor="middle")
    s += text(640, 192, "Does one job. Asks for nothing.", 50, WHITE, "bold", anchor="middle")
    s += text(640, 234, "Runs entirely on your device. No account, no network calls, no analytics.", 20, MUT, anchor="middle")
    cards = [
        ("No data collected", "Nothing is stored or sent off your device."),
        ("No tracking or ads", "Zero telemetry, zero advertising, ever."),
        ("Single purpose", "Only unblocks Netflix Picture-in-Picture."),
        ("Open source", "Auditable code. Requires Chrome 111+."),
    ]
    cw, ch, gap = 270, 150, 24
    total = cw * 4 + gap * 3
    sx = (W - total) / 2
    ty = 320
    for i, (title, sub) in enumerate(cards):
        cx = sx + i * (cw + gap)
        s += f'<rect x="{cx}" y="{ty}" width="{cw}" height="{ch}" rx="18" fill="#0e1a2e" stroke="#ffffff" stroke-opacity="0.08"/>'
        bcx, bcy = cx + 40, ty + 44
        s += f'<circle cx="{bcx}" cy="{bcy}" r="20" fill="{GREEN}" fill-opacity="0.16"/>'
        s += f'<path d="M{bcx-9},{bcy} l6,7 l12,-14" fill="none" stroke="{GREEN}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>'
        s += text(cx + 24, ty + 96, title, 19, TXT, "bold")
        words, lines, cur = sub.split(), [], ""
        for wd in words:
            if len(cur + " " + wd) <= 30:
                cur = (cur + " " + wd).strip()
            else:
                lines.append(cur)
                cur = wd
        lines.append(cur)
        for j, ln in enumerate(lines[:2]):
            s += text(cx + 24, ty + 122 + j * 20, ln, 14.5, MUT)
    # three-state recap
    ry = 540
    s += text(640, ry, "The whole interface is one icon", 24, WHITE, "bold", anchor="middle")
    states = [(IC_DEFAULT, "Grey", "nothing to do", SLATE),
              (IC_ORANGE, "Orange", "blocker detected", ORANGE),
              (IC_GREEN, "Green", "block lifted", GREEN)]
    sw = 300
    x0 = (W - sw * 3) / 2
    for i, (ic, lab, sub, ac) in enumerate(states):
        cx = x0 + i * sw + sw / 2
        s += f'<circle cx="{cx}" cy="{ry+66}" r="40" fill="{ac}" fill-opacity="0.14"/>'
        s += f'<image x="{cx-28}" y="{ry+38}" width="56" height="56" href="{ic}"/>'
        s += text(cx, ry + 138, lab, 22, TXT, "bold", anchor="middle")
        s += text(cx, ry + 164, sub, 16, MUT, anchor="middle")
        if i < 2:
            s += text(cx + sw / 2, ry + 76, "→", 30, "#5b6b85", "bold", anchor="middle")
    render("05-private", wrapper(s))


if __name__ == "__main__":
    shot_hero()
    shot_orange()
    shot_green()
    shot_pip()
    shot_private()
    print("done")

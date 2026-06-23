#!/usr/bin/env python3
"""Procedurally render a cinematic 'video frame' still (license-free) used as
the playing-video background behind the UI in the store screenshots."""
import numpy as np
from PIL import Image, ImageFilter
import os

HERE = os.path.dirname(os.path.abspath(__file__))
Wd, Hd = 1600, 900


def lerp(a, b, t):
    return a + (b - a) * t


# vertical sky gradient: indigo -> violet -> warm orange near horizon
top = np.array([22, 26, 58])
mid = np.array([86, 52, 120])
hor = np.array([243, 146, 54])
img = np.zeros((Hd, Wd, 3), np.float64)
horizon = int(Hd * 0.66)
for y in range(Hd):
    if y < horizon:
        t = y / horizon
        if t < 0.6:
            c = lerp(top, mid, t / 0.6)
        else:
            c = lerp(mid, hor, (t - 0.6) / 0.4)
    else:
        c = lerp(hor * 0.5, np.array([20, 12, 24]), (y - horizon) / (Hd - horizon))
    img[y, :] = c

# sun glow (radial), just above horizon, right of centre
sx, sy = int(Wd * 0.64), int(horizon - Hd * 0.05)
yy, xx = np.mgrid[0:Hd, 0:Wd]
dist = np.sqrt((xx - sx) ** 2 + (yy - sy) ** 2)
glow = np.clip(1 - dist / (Hd * 0.55), 0, 1) ** 2.2
sun_col = np.array([255, 226, 168])
for i in range(3):
    img[:, :, i] += glow * (sun_col[i] - img[:, :, i]) * 0.85
# bright sun disc
disc = np.clip(1 - dist / (Hd * 0.10), 0, 1) ** 0.6
for i in range(3):
    img[:, :, i] = lerp(img[:, :, i], np.full((Hd, Wd), 255), disc)

# layered mountain silhouettes
rng = np.random.default_rng(7)
def ridge(base_y, amp, color, jitter):
    xs = np.linspace(0, Wd, 14)
    ys = base_y + np.cumsum(rng.normal(0, jitter, xs.size)) * 0 + \
        amp * np.sin(xs / Wd * np.pi * rng.uniform(1.5, 3)) + rng.normal(0, jitter, xs.size)
    prof = np.interp(np.arange(Wd), xs, ys)
    mask = yy >= prof[None, :]
    for i in range(3):
        img[:, :, i] = np.where(mask, color[i], img[:, :, i])

ridge(horizon - 6, 36, np.array([60, 40, 78]), 14)
ridge(horizon + 40, 30, np.array([40, 26, 56]), 12)
ridge(horizon + 110, 26, np.array([18, 12, 30]), 16)

im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), "RGB")
im = im.filter(ImageFilter.GaussianBlur(0.6))

# film grain
grain = (rng.normal(0, 6, (Hd, Wd, 1)).repeat(3, 2))
arr = np.clip(np.asarray(im, np.float64) + grain, 0, 255).astype(np.uint8)
im = Image.fromarray(arr, "RGB")

# vignette
vig = np.clip(1 - (np.sqrt((xx - Wd / 2) ** 2 + (yy - Hd / 2) ** 2) /
                   (0.72 * np.sqrt((Wd / 2) ** 2 + (Hd / 2) ** 2))) ** 2.2 * 0.55, 0, 1)
arr = (np.asarray(im, np.float64) * vig[:, :, None]).clip(0, 255).astype(np.uint8)
Image.fromarray(arr, "RGB").save(os.path.join(HERE, "video-still.png"))
print("wrote video-still.png", Wd, "x", Hd)

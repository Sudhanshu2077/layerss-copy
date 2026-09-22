"""Layerss brand mark generator (Pillow, stdlib + PIL only).
Minimal premium 'layers' badge: cream rounded square, three maroon layer bars,
gold cherry dot. Flat, readable at 32px, on-brand (#400010 + cream).
Outputs: frontend/public/logo.png (512), logo-180.png, logo-32.png.
"""
from PIL import Image, ImageDraw

CREAM = (248, 241, 226, 255)
MAROON_DARK = (64, 0, 16, 255)
MAROON_MID = (110, 36, 52, 255)
MAROON_SOFT = (166, 61, 74, 255)
GOLD = (201, 162, 39, 255)

def draw_mark(size):
    s = size
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # Cream badge
    r = int(s * 0.22)
    d.rounded_rectangle([0, 0, s - 1, s - 1], radius=r, fill=CREAM)
    # Thin maroon rim
    rim = max(2, s // 128)
    d.rounded_rectangle([rim // 2, rim // 2, s - 1 - rim // 2, s - 1 - rim // 2],
                        radius=r, outline=MAROON_DARK, width=rim)
    cx = s / 2
    # Cherry dot (gold) above layers
    dot_r = s * 0.045
    dot_cy = s * 0.24
    d.ellipse([cx - dot_r, dot_cy - dot_r, cx + dot_r, dot_cy + dot_r], fill=GOLD)
    # Three layer bars (rounded), widths widen downward like a cake/tub stack
    widths = [0.42, 0.54, 0.66]
    colors = [MAROON_SOFT, MAROON_MID, MAROON_DARK]
    bar_h = s * 0.11
    gap = s * 0.045
    top = s * 0.36
    for idx, (wfrac, col) in enumerate(zip(widths, colors)):
        w = s * wfrac
        y0 = top + idx * (bar_h + gap)
        d.rounded_rectangle([cx - w / 2, y0, cx + w / 2, y0 + bar_h],
                            radius=int(bar_h * 0.45), fill=col)
    return img

import pathlib
out = pathlib.Path("frontend/public")
for name, size in (("logo.png", 512), ("logo-180.png", 180), ("logo-32.png", 32)):
    im = draw_mark(size)
    p = out / name
    im.save(p, "PNG", optimize=True)
    print(f"MADE {p.as_posix()} {p.stat().st_size}b {size}x{size}")

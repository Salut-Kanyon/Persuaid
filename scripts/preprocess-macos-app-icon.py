#!/usr/bin/env python3
"""
Build a 1024×1024 macOS app-icon master: logo padded and centered on black, then clipped to a
Big Sur–style rounded rectangle (transparent outside the curve) so the Dock reads like other apps.

AppIcon 1024.png is often fully opaque (solid black behind the mark). Alpha-only bbox then fails;
we treat near-black RGB as background for cropping. We also scale the mark into an inner safe
box so it does not run into the squircle corners (which looked like top/bottom “cut off”).
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageOps

SIZE = 1024
DEFAULT_RADIUS = 185
# Balanced for full-height logos: enough inset so the squircle mask does not clip top/bottom.
# Override with MAC_ICON_PADDING_FRAC / MAC_ICON_INNER_SAFE_SCALE if needed.
DEFAULT_PADDING_FRAC = 0.20
# After padding_frac, shrink so the mark clears the rounded-mask corners (lower = more inset).
DEFAULT_INNER_SAFE_SCALE = 0.88
# Pixels with max(R,G,B) <= this are treated as background when alpha is opaque (typ. black mat).
DEFAULT_BG_RGB_MAX = 28


def foreground_bbox(
    im: Image.Image,
    bg_rgb_max: int,
) -> tuple[int, int, int, int] | None:
    """Bounding box of foreground pixels (not near-black, or any visible transparency)."""
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()
    min_x, min_y = w, h
    max_x, max_y = -1, -1
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 40:
                if a > 0:
                    min_x = min(min_x, x)
                    min_y = min(min_y, y)
                    max_x = max(max_x, x)
                    max_y = max(max_y, y)
                continue
            if max(r, g, b) <= bg_rgb_max:
                continue
            min_x = min(min_x, x)
            min_y = min(min_y, y)
            max_x = max(max_x, x)
            max_y = max(max_y, y)
    if max_x < min_x:
        return None
    return (min_x, min_y, max_x + 1, max_y + 1)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument(
        "--radius",
        type=int,
        default=DEFAULT_RADIUS,
        help="Rounded-rect corner radius at 1024px (default 185)",
    )
    parser.add_argument(
        "--padding-frac",
        type=float,
        default=DEFAULT_PADDING_FRAC,
        help="Margin on each side as a fraction of width; inner side = 1 - 2*frac (default 0.20)",
    )
    parser.add_argument(
        "--inner-safe-scale",
        type=float,
        default=DEFAULT_INNER_SAFE_SCALE,
        help="Fit the mark into (inner * this) so it clears the squircle corners (default 0.88)",
    )
    parser.add_argument(
        "--bg-rgb-max",
        type=int,
        default=DEFAULT_BG_RGB_MAX,
        help="max(R,G,B) <= this counts as background for bbox on opaque-black mats (default 28)",
    )
    parser.add_argument(
        "--edge-pad",
        type=int,
        default=2,
        help="Extra pixels around foreground bbox before scaling (default 2)",
    )
    args = parser.parse_args()

    src = Image.open(args.input).convert("RGBA")

    bbox = foreground_bbox(src, args.bg_rgb_max)
    if bbox is not None:
        x0, y0, x1, y1 = bbox
        pad = max(0, args.edge_pad)
        x0 = max(0, x0 - pad)
        y0 = max(0, y0 - pad)
        x1 = min(src.width, x1 + pad)
        y1 = min(src.height, y1 + pad)
        src = src.crop((x0, y0, x1, y1))

    inner = max(1, int(SIZE * (1.0 - 2.0 * args.padding_frac)))
    fit = max(1, int(inner * args.inner_safe_scale))
    src = ImageOps.contain(src, (fit, fit), Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 255))
    x = (SIZE - src.width) // 2
    y = (SIZE - src.height) // 2
    canvas.paste(src, (x, y), src)

    mask = Image.new("L", (SIZE, SIZE), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, SIZE - 1, SIZE - 1), radius=args.radius, fill=255)

    _r, _g, _b, a = canvas.split()
    a = ImageChops.multiply(a, mask)
    canvas.putalpha(a)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(args.output, "PNG", optimize=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())

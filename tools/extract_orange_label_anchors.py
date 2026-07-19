#!/usr/bin/env python3
"""Extract orange label anchors from a sample map.

This helper supports the sample-map-to-handdrawn workflow:

1. Detect orange rounded label plaques in a supplied sample map.
2. Print each label box and center coordinate.
3. Save a contact sheet of cropped labels for manual name matching.

The script intentionally does not OCR labels. Human review is still required
to map each numbered crop to the exact Chinese label text.

Dependencies: Pillow and numpy.
"""

from __future__ import annotations

import argparse
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter


def connected_boxes(mask: np.ndarray, min_area: int) -> list[tuple[int, int, int, int, int]]:
    h, w = mask.shape
    seen = np.zeros_like(mask, dtype=bool)
    boxes: list[tuple[int, int, int, int, int]] = []
    ys, xs = np.nonzero(mask)

    for sy, sx in zip(ys, xs):
        if seen[sy, sx]:
            continue

        q: deque[tuple[int, int]] = deque([(int(sy), int(sx))])
        seen[sy, sx] = True
        pts: list[tuple[int, int]] = []

        while q:
            y, x = q.popleft()
            pts.append((y, x))
            for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    q.append((ny, nx))

        if len(pts) < min_area:
            continue

        arr = np.array(pts)
        y1, x1 = arr.min(axis=0)
        y2, x2 = arr.max(axis=0)
        boxes.append((int(x1), int(y1), int(x2 + 1), int(y2 + 1), len(pts)))

    return boxes


def build_sheet(
    image: Image.Image,
    boxes: list[tuple[int, int, int, int, int]],
    out_path: Path,
    cols: int,
    thumb_w: int,
    thumb_h: int,
    pad: int,
) -> None:
    rows = max(1, (len(boxes) + cols - 1) // cols)
    sheet = Image.new("RGB", (cols * thumb_w, rows * thumb_h), (245, 238, 212))
    draw = ImageDraw.Draw(sheet)
    ref = image.convert("RGB")

    for i, box in enumerate(boxes, 1):
        x1, y1, x2, y2, _ = box
        crop = ref.crop(
            (
                max(0, x1 - pad),
                max(0, y1 - pad),
                min(ref.width, x2 + pad),
                min(ref.height, y2 + pad),
            )
        )
        crop.thumbnail((thumb_w - 10, thumb_h - 24))
        cx = (i - 1) % cols * thumb_w
        cy = (i - 1) // cols * thumb_h
        sheet.paste(crop, (cx + 5, cy + 20))
        draw.text((cx + 6, cy + 4), f"{i:02d} center=({(x1 + x2)//2},{(y1 + y2)//2})", fill=(0, 0, 0))

    sheet.save(out_path)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("image", type=Path)
    parser.add_argument("--out-dir", type=Path, default=Path("."))
    parser.add_argument("--sheet-name", default="label_coordinate_sheet.png")
    parser.add_argument("--dilate", type=int, default=7, help="Odd MaxFilter size used to connect each plaque.")
    parser.add_argument("--min-area", type=int, default=50)
    parser.add_argument("--min-width", type=int, default=25)
    parser.add_argument("--max-width", type=int, default=220)
    parser.add_argument("--min-height", type=int, default=15)
    parser.add_argument("--max-height", type=int, default=70)
    parser.add_argument("--cols", type=int, default=3)
    args = parser.parse_args()

    image = Image.open(args.image).convert("RGBA")
    arr = np.asarray(image)
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]

    # Orange plaque heuristic. This intentionally over-detects slightly; use
    # the generated contact sheet to remove roads/arrows by manual review.
    base = (r > 220) & (g > 95) & (g < 185) & (b < 105) & ((r.astype(int) - g.astype(int)) > 55)
    dilate = args.dilate if args.dilate % 2 == 1 else args.dilate + 1
    mask = np.asarray(Image.fromarray((base * 255).astype("uint8"), "L").filter(ImageFilter.MaxFilter(dilate))) > 0

    boxes = []
    for box in connected_boxes(mask, args.min_area):
        x1, y1, x2, y2, area = box
        bw, bh = x2 - x1, y2 - y1
        if args.min_width <= bw <= args.max_width and args.min_height <= bh <= args.max_height:
            boxes.append(box)

    boxes.sort(key=lambda t: (t[1], t[0]))
    args.out_dir.mkdir(parents=True, exist_ok=True)
    sheet_path = args.out_dir / args.sheet_name
    build_sheet(image, boxes, sheet_path, args.cols, 260, 92, 24)

    print(f"canvas {image.width} {image.height} boxes {len(boxes)}")
    for i, (x1, y1, x2, y2, area) in enumerate(boxes, 1):
        cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
        print(
            f"{i:02d}: bbox=({x1},{y1},{x2},{y2}) center=({cx},{cy}) "
            f"pct=({cx/image.width:.3f},{cy/image.height:.3f}) size=({x2-x1}x{y2-y1}) area={area}"
        )
    print(sheet_path)


if __name__ == "__main__":
    main()

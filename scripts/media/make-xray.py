"""Turn a build photo into an "x-ray" line scan for the inspection lens.

Edge-detects the photo (auto Canny thresholds), thickens the lines a touch and writes them as
light strokes on transparent, same size as the source, so the lens lines up with the photo.

Usage: python make-xray.py <photo.jpg> <out.webp> [sensitivity, default 1; lower = more lines]
Needs: pillow, opencv-python-headless.
"""
import sys

import cv2
import numpy as np
from PIL import Image


def main():
    src, out = sys.argv[1], sys.argv[2]
    k = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
    im = cv2.imread(src)
    h, w = im.shape[:2]
    s = 1100 / max(h, w)
    im = cv2.resize(im, (round(w * s), round(h * s)), interpolation=cv2.INTER_AREA)
    g = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
    g = cv2.bilateralFilter(g, 9, 60, 9)
    med = float(np.median(g))
    edges = cv2.Canny(g, int(max(0, 0.55 * med * k)), int(min(255, 1.25 * med * k)))
    # drop speckle: keep connected edge runs longer than a few px
    n, lab, stats, _ = cv2.connectedComponentsWithStats(edges, 8)
    keep = np.isin(lab, [i for i in range(1, n) if stats[i, cv2.CC_STAT_AREA] >= 18])
    edges = (keep * 255).astype(np.uint8)
    edges = cv2.dilate(edges, np.ones((2, 2), np.uint8))
    rgba = np.zeros((*edges.shape, 4), np.uint8)
    rgba[..., :3] = (233, 232, 226)
    rgba[..., 3] = edges
    Image.fromarray(rgba).save(out, 'WEBP', quality=80, alpha_quality=70, method=6)
    print(out, Image.fromarray(rgba).size)


if __name__ == '__main__':
    main()

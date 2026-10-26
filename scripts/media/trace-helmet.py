"""Trace the Iron Man helmet photo into line-art polygons for the hero machine.

- shell:     outer silhouette (background removed with rembg)
- faceplate: the gold region (HSV threshold inside the silhouette)
- eyes:      dark slits inside the faceplate
- details:   a few long internal edges (Canny), for drawing-like texture

Output is normalised to a 0..1 box (y down) in src/data/hero/helmet.json.
Usage: python trace-helmet.py <helmet-photo>
"""
import json
import os
import sys

import cv2
import numpy as np
from PIL import Image
from rembg import new_session, remove

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.abspath(os.path.join(HERE, '..', '..'))


def biggest(mask, n=1):
    cs, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    return sorted(cs, key=cv2.contourArea, reverse=True)[:n]


def simplify(c, eps):
    return cv2.approxPolyDP(c, eps, True).reshape(-1, 2)


def main():
    im = Image.open(sys.argv[1]).convert('RGB')
    im.thumbnail((1400, 1400))
    rgb = np.array(im)
    alpha = np.array(remove(im, session=new_session('isnet-general-use'), only_mask=True, post_process_mask=True))
    sil = (alpha > 128).astype(np.uint8) * 255
    sil = cv2.morphologyEx(sil, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))

    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    gold = ((h >= 12) & (h <= 35) & (s > 40) & (v > 70)).astype(np.uint8) * 255
    gold = cv2.bitwise_and(gold, sil)
    gold = cv2.morphologyEx(gold, cv2.MORPH_CLOSE, np.ones((25, 25), np.uint8))
    gold = cv2.morphologyEx(gold, cv2.MORPH_OPEN, np.ones((9, 9), np.uint8))

    dark = ((v < 60) & (sil > 0)).astype(np.uint8) * 255
    face_box = cv2.boundingRect(biggest(gold)[0])
    fx, fy, fw, fh = face_box
    eyes_mask = np.zeros_like(dark)
    eyes_mask[fy:fy + int(fh * 0.55), fx:fx + fw] = dark[fy:fy + int(fh * 0.55), fx:fx + fw]
    eyes_mask = cv2.morphologyEx(eyes_mask, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))

    shell = biggest(sil)[0]
    x, y, w, hh = cv2.boundingRect(shell)
    size = max(w, hh)

    def norm(pts):
        return [[round((px - x) / size, 4), round((py - y) / size, 4)] for px, py in pts]

    edges = cv2.Canny(cv2.GaussianBlur(cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY), (5, 5), 0), 40, 110)
    edges = cv2.bitwise_and(edges, cv2.erode(sil, np.ones((15, 15), np.uint8)))
    ecs, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)
    details = [simplify(c, 2.2) for c in ecs if cv2.arcLength(c, False) > size * 0.18]
    details = sorted(details, key=lambda c: -len(c))[:14]

    out = {
        'aspect': round(w / hh, 4),
        'w': round(w / size, 4),
        'h': round(hh / size, 4),
        'shell': norm(simplify(shell, 2.5)),
        'faceplate': norm(simplify(biggest(gold)[0], 2.5)),
        'eyes': [norm(simplify(c, 1.5)) for c in biggest(eyes_mask, 2) if cv2.contourArea(c) > 40],
        'details': [norm(d) for d in details],
    }
    dest = os.path.join(SITE, 'src', 'data', 'hero', 'helmet.json')
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    json.dump(out, open(dest, 'w'))
    print('shell', len(out['shell']), 'face', len(out['faceplate']), 'eyes', [len(e) for e in out['eyes']],
          'details', [len(d) for d in out['details']], 'aspect', out['aspect'])

    # preview
    prev = np.full((900, 900, 3), 236, np.uint8)
    def draw(pts, col, closed=True):
        p = np.array([[px * 800 + 50, py * 800 + 50] for px, py in pts], np.int32)
        cv2.polylines(prev, [p], closed, col, 2, cv2.LINE_AA)
    draw(out['shell'], (20, 20, 20))
    draw(out['faceplate'], (0, 79, 255))
    for e in out['eyes']:
        draw(e, (0, 0, 200))
    for d in out['details']:
        draw(d, (120, 120, 120), False)
    cv2.imwrite(sys.argv[2] if len(sys.argv) > 2 else 'helmet-preview.png', prev)


if __name__ == '__main__':
    main()

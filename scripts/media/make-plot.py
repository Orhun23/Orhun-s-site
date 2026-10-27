"""Height maps for the 'Plotted' hero.

For each subject: crop the photo, cut the person (and board/bike) out, and write a small
greyscale PNG where 0 = flat paper and 255 = highest. Inside the subject, height follows how
dark the photo is (after local contrast), so features read as relief in the plotted lines.

Usage: python make-plot.py
Writes public/media/hero/plot-<name>.png and src/data/plot.json.
Needs: pillow, rembg[cpu], opencv-python-headless, numpy.
"""
import json
import os

import cv2
import numpy as np
from PIL import Image
from rembg import new_session, remove

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.abspath(os.path.join(HERE, '..', '..'))
MEDIA = os.path.join(SITE, 'src', 'assets', 'media')

# name, source, crop (l, t, r, b as fractions), segmentation model, label
SUBJECTS = [
    ('snow', 'field/snow-spray.jpg', (0.04, 0.04, 0.96, 1.0), 'u2net_human_seg', 'Snow'),
    ('skate', 'field/skate-bowl-air.jpg', (0.47, 0.36, 0.99, 0.69), 'u2net_human_seg', 'Skate'),
    ('surf', 'field/surf.jpg', (0.37, 0.4, 0.6, 0.74), 'u2net_human_seg', 'Surf'),
    ('tallbike', 'builds/tallbike/riding.jpg', (0.18, 0.0, 0.94, 0.74), 'isnet-general-use', 'Tallbike'),
]
WIDTH = 180  # samples across; height follows the crop's aspect


def main():
    out_dir = os.path.join(SITE, 'public', 'media', 'hero')
    os.makedirs(out_dir, exist_ok=True)
    meta = []
    sessions = {}
    for name, src, (l, t, r, b), model, label in SUBJECTS:
        im = Image.open(os.path.join(MEDIA, src)).convert('RGB')
        w, h = im.size
        im = im.crop((int(l * w), int(t * h), int(r * w), int(b * h)))
        sess = sessions.setdefault(model, new_session(model))
        mask = np.array(remove(im, session=sess, only_mask=True, post_process_mask=True)).astype(np.float32) / 255
        # keep the biggest blob (the rider), drop specks
        bin_ = (mask > 0.45).astype(np.uint8)
        n, lab, stats, _ = cv2.connectedComponentsWithStats(bin_, 8)
        if n > 1:
            keep = [i for i in range(1, n) if stats[i, cv2.CC_STAT_AREA] >= stats[1:, cv2.CC_STAT_AREA].max() * 0.08]
            mask = mask * np.isin(lab, keep)
        gray = cv2.cvtColor(np.array(im), cv2.COLOR_RGB2GRAY)
        gray = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(6, 6)).apply(gray)
        dark = 1 - gray.astype(np.float32) / 255
        # normalise darkness inside the subject only
        inside = dark[mask > 0.5]
        lo, hi = (np.percentile(inside, 4), np.percentile(inside, 96)) if inside.size else (0, 1)
        dark = np.clip((dark - lo) / max(1e-3, hi - lo), 0, 1)
        height = mask * (0.38 + 0.62 * dark)
        aspect = im.size[1] / im.size[0]
        rows = round(WIDTH * aspect)
        small = cv2.resize(height, (WIDTH, rows), interpolation=cv2.INTER_AREA)
        small = cv2.GaussianBlur(small, (0, 0), 0.7)
        out = os.path.join(out_dir, f'plot-{name}.png')
        Image.fromarray((np.clip(small, 0, 1) * 255).astype(np.uint8), 'L').save(out, optimize=True)
        meta.append({'name': name, 'label': label, 'src': f'/media/hero/plot-{name}.png', 'w': WIDTH, 'h': rows})
        print(name, (WIDTH, rows), os.path.getsize(out) // 1024, 'KB')
    json.dump(meta, open(os.path.join(SITE, 'src', 'data', 'plot.json'), 'w'), indent=1)


if __name__ == '__main__':
    main()

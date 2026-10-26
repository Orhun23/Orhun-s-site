"""Cut Orhun out of action frames and pack them into sprite sheets for the hero's strobe sequences.

Two segmentation passes per frame:
  - a human model (clean body, but drops the board)
  - a general model (keeps board + rail, but also grabs background clutter)
Final mask = human ∪ (general ∩ (human grown slightly ∪ a band under the feet)).
The human pass guarantees head and arms; the general pass adds the board without the statues.

Usage: python make-strobes.py <frames-dir> <name> <frame,frame,...> [--height 220]
Writes public/media/hero/<name>.webp (sprite), <name>-outline.webp (the same frames as
drawn outlines, so the browser doesn't have to compute them) and src/data/strobes/<name>.json.
Needs: pillow, rembg[cpu], opencv-python-headless (rembg downloads two ~170 MB models on first run).
"""
import json
import os
import sys

from PIL import Image, ImageChops, ImageFilter
from rembg import new_session, remove

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.abspath(os.path.join(HERE, '..', '..'))


def clean(mask):
    """Drop specks (snow spray, dust), keep the athlete + board, smooth the edge."""
    import numpy as np
    import cv2
    m = (np.array(mask) > 110).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(m, 8)
    if n > 1:
        biggest = stats[1:, cv2.CC_STAT_AREA].max()
        keep = [i for i in range(1, n) if stats[i, cv2.CC_STAT_AREA] >= biggest * 0.06]
        m = np.isin(lab, keep).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    soft = cv2.GaussianBlur(m.astype(np.float32), (0, 0), 1.6)
    return Image.fromarray((np.clip((soft - 0.5) * 3 + 0.5, 0, 1) * 255).astype(np.uint8))


def mask_of(im, session):
    return remove(im, session=session, only_mask=True, post_process_mask=True)


def main():
    src, name, picks = sys.argv[1], sys.argv[2], sys.argv[3].split(',')
    height = int(sys.argv[sys.argv.index('--height') + 1]) if '--height' in sys.argv else 220
    human, general = new_session('u2net_human_seg'), new_session('isnet-general-use')

    cuts = []
    for p in picks:
        im = Image.open(os.path.join(src, p + '.jpg')).convert('RGB')
        mh = mask_of(im, human).point(lambda a: 255 if a > 60 else 0)
        mg = mask_of(im, general)
        bb = mh.getbbox()
        if not bb:
            print(p, 'no person found, skipped')
            continue
        keep = mh.filter(ImageFilter.MaxFilter(9))  # grow the body a touch (edges, hair)
        band = Image.new('L', im.size, 0)
        x0, y0, x1, y1 = bb
        h = y1 - y0
        band.paste(255, (max(0, x0 - 90), max(0, y1 - int(h * 0.18)), min(im.width, x1 + 90), min(im.height, y1 + int(h * 0.12))))
        final = ImageChops.lighter(mh, ImageChops.multiply(mg, ImageChops.lighter(keep, band)))
        final = clean(final)
        rgba = im.copy()
        rgba.putalpha(final)
        box = final.point(lambda a: 255 if a > 40 else 0).getbbox()
        cuts.append((p, rgba.crop(box), box))
        print(p, box)

    # one scale for the whole clip so the athlete doesn't change size between frames
    scale = height / max(c.height for _, c, _ in cuts)
    frames, x = [], 0
    sized = []
    for p, c, box in cuts:
        w, h = max(1, round(c.width * scale)), max(1, round(c.height * scale))
        sized.append((p, c.resize((w, h), Image.LANCZOS)))
    sheet = Image.new('RGBA', (sum(c.width for _, c in sized) + 4 * len(sized), height), (0, 0, 0, 0))
    for p, c in sized:
        sheet.alpha_composite(c, (x, height - c.height))  # feet on the baseline
        frames.append({'id': p, 'x': x, 'y': height - c.height, 'w': c.width, 'h': c.height})
        x += c.width + 4

    out_img = os.path.join(SITE, 'public', 'media', 'hero', name + '.webp')
    out_json = os.path.join(SITE, 'src', 'data', 'strobes', name + '.json')
    os.makedirs(os.path.dirname(out_img), exist_ok=True)
    os.makedirs(os.path.dirname(out_json), exist_ok=True)
    sheet.save(out_img, 'WEBP', quality=82, alpha_quality=90, method=6)
    # outline = alpha minus an eroded alpha, about 2 px wide at sprite size
    import numpy as np
    import cv2
    a = np.array(sheet.getchannel('A'))
    ring = cv2.subtract(a, cv2.erode(a, np.ones((5, 5), np.uint8)))
    outline = Image.new('RGBA', sheet.size, (0, 0, 0, 0))
    outline.putalpha(Image.fromarray(ring))
    outline.save(out_img.replace('.webp', '-outline.webp'), 'WEBP', lossless=True)
    json.dump({'src': f'/media/hero/{name}.webp', 'outline': f'/media/hero/{name}-outline.webp', 'height': height, 'frames': frames},
              open(out_json, 'w'), indent=1)
    print(out_img, os.path.getsize(out_img) // 1024, 'KB', sheet.size)


if __name__ == '__main__':
    main()

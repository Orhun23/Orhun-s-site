"""Build a chronophotograph (one still, many exposures) from a handheld clip.

Takes a background frame, cuts the athlete out of the chosen frames, aligns each frame to the
background (ORB features on the background only + a RANSAC homography, so camera pan and shake
cancel out) and pastes each exposure back where it really was. Earlier exposures are slightly
faded so the order reads.

Usage: python make-chronophoto.py <frames-dir> <background> <frame,frame,...> <out.jpg> [--crop l,t,r,b]
Needs: pillow, rembg[cpu], opencv-python-headless.
"""
import os
import sys

import cv2
import numpy as np
from PIL import Image
from rembg import new_session, remove


def person_mask(im, sess):
    m = np.array(remove(im, session=sess, only_mask=True, post_process_mask=True))
    m = (m > 100).astype(np.uint8)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(m, 8)
    if n > 1:  # keep the athlete, drop splashes
        m = (lab == 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))).astype(np.uint8)
    return m


def main():
    src, bg_name, picks, out = sys.argv[1], sys.argv[2], sys.argv[3].split(','), sys.argv[4]
    crop = [int(v) for v in sys.argv[sys.argv.index('--crop') + 1].split(',')] if '--crop' in sys.argv else None
    sess = new_session('u2net_human_seg')
    base = Image.open(os.path.join(src, bg_name + '.jpg')).convert('RGB')
    comp = base.copy()
    orb = cv2.ORB_create(4000)
    base_np = np.array(base)
    base_mask = person_mask(base, sess)
    kb, db = orb.detectAndCompute(cv2.cvtColor(base_np, cv2.COLOR_RGB2GRAY), (1 - base_mask) * 255)
    matcher = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
    hh, ww = base_np.shape[:2]
    for i, p in enumerate(picks):
        im = Image.open(os.path.join(src, p + '.jpg')).convert('RGB')
        arr = np.array(im)
        m = person_mask(im, sess)
        # align this frame's background onto the base frame
        kf, df = orb.detectAndCompute(cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY), (1 - cv2.dilate(m, np.ones((25, 25), np.uint8))) * 255)
        matches = sorted(matcher.match(df, db), key=lambda x: x.distance)[:600]
        src_pts = np.float32([kf[x.queryIdx].pt for x in matches]).reshape(-1, 1, 2)
        dst_pts = np.float32([kb[x.trainIdx].pt for x in matches]).reshape(-1, 1, 2)
        H, inl = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 3.0)
        warped = cv2.warpPerspective(arr, H, (ww, hh))
        wm = cv2.warpPerspective(m.astype(np.float32), H, (ww, hh))
        soft = cv2.GaussianBlur(wm, (0, 0), 1.2)
        fade = 0.62 + 0.38 * (i / max(1, len(picks) - 1))  # last exposure fully opaque
        alpha = Image.fromarray((np.clip(soft, 0, 1) * 255 * fade).astype(np.uint8))
        comp.paste(Image.fromarray(warped), (0, 0), alpha)
        print(p, 'inliers', int(inl.sum()), 'of', len(matches))
    if crop:
        comp = comp.crop(crop)
    comp.save(out, 'JPEG', quality=90, optimize=True, progressive=True)
    print(out, comp.size)


if __name__ == '__main__':
    main()

"""Compare two baseline folders pixel by pixel.

Usage: python compare.py <dirA> <dirB>
Prints every file that differs (with the share of changed pixels) and writes a red diff image
next to dirB for each one. Exit code 1 if anything differs.
"""
import os
import sys

from PIL import Image, ImageChops

a_dir, b_dir = sys.argv[1], sys.argv[2]
bad = 0
names = sorted(set(os.listdir(a_dir)) & set(os.listdir(b_dir)))
missing = sorted(set(os.listdir(a_dir)) ^ set(os.listdir(b_dir)))
for n in names:
    if not n.endswith('.png'):
        continue
    a = Image.open(os.path.join(a_dir, n)).convert('RGB')
    b = Image.open(os.path.join(b_dir, n)).convert('RGB')
    if a.size != b.size:
        print(f'SIZE  {n}: {a.size} vs {b.size}')
        bad += 1
        continue
    diff = ImageChops.difference(a, b).convert('L').point(lambda v: 255 if v > 24 else 0)
    changed = sum(diff.histogram()[255:]) / (a.size[0] * a.size[1])
    if changed > 0.0005:
        bad += 1
        print(f'DIFF  {n}: {changed * 100:.2f}% of pixels')
        red = Image.new('RGB', a.size, (255, 0, 0))
        Image.composite(red, b, diff).save(os.path.join(b_dir, 'diff-' + n))
print(f'{len(names)} compared, {bad} differ, {len(missing)} only in one folder')
for m in missing:
    print('  only in one:', m)
sys.exit(1 if bad else 0)

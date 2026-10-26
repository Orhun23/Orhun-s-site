"""Import selected source photos/videos into the site.

Reads the manifest (media.json), and for each entry:
  - images -> src/assets/media/<out>.jpg  (auto-rotated, max 2400px, metadata stripped)
  - videos -> public/media/<out>.mp4 (H.264, no audio, faststart) + poster in src/assets/media
GPS is read before stripping and written (rounded to 2 decimals, place-level)
to src/data/gps.json so the site can show coordinates without leaking exact spots.

Usage: python import-media.py <photos-root> [--only name1,name2]
Needs: pillow, pillow-heif, imageio-ffmpeg (see README).
"""
import io
import json
import os
import subprocess
import sys

import imageio_ffmpeg
import pillow_heif
from PIL import Image, ImageOps

pillow_heif.register_heif_opener()
FF = imageio_ffmpeg.get_ffmpeg_exe()
HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.abspath(os.path.join(HERE, '..', '..'))
IMG_OUT = os.path.join(SITE, 'src', 'assets', 'media')
VID_OUT = os.path.join(SITE, 'public', 'media')
GPS_FILE = os.path.join(SITE, 'src', 'data', 'gps.json')
MAX_EDGE = 2400
SOI, EOI = bytes.fromhex('ffd8ff'), bytes.fromhex('ffd9')


def open_image(path):
    if path.lower().endswith('.cr3'):
        return cr3_preview(path)
    return Image.open(path)


def cr3_preview(path):
    # Canon CR3 isn't readable by Pillow; the largest embedded JPEG preview is full-res
    data = open(path, 'rb').read()
    best, i = b'', 0
    while (i := data.find(SOI, i)) != -1:
        j = data.find(EOI, i)
        while j != -1:
            try:
                Image.open(io.BytesIO(data[i:j + 2])).load()
                break
            except Exception:
                j = data.find(EOI, j + 2)
        if j != -1 and j + 2 - i > len(best):
            best = data[i:j + 2]
        i += 3
    return Image.open(io.BytesIO(best))


def gps_of(im):
    try:
        g = im.getexif().get_ifd(0x8825)
        if not g or 2 not in g:
            return None

        def deg(v):
            return float(v[0]) + float(v[1]) / 60 + float(v[2]) / 3600

        lat, lon = deg(g[2]), deg(g[4])
        if g.get(1) == 'S':
            lat = -lat
        if g.get(3) == 'W':
            lon = -lon
        return [round(lat, 2), round(lon, 2)]
    except Exception:
        return None


def save_image(im, out, crop=None):
    im = ImageOps.exif_transpose(im)
    if crop:  # [left, top, right, bottom] as fractions
        w, h = im.size
        im = im.crop((int(crop[0] * w), int(crop[1] * h), int(crop[2] * w), int(crop[3] * h)))
    im = im.convert('RGB')
    im.thumbnail((MAX_EDGE, MAX_EDGE), Image.LANCZOS)
    dest = os.path.join(IMG_OUT, out + '.jpg')
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    im.save(dest, 'JPEG', quality=88, optimize=True, progressive=True)  # no exif= -> stripped
    return im.size


def save_video(src, out, start=None, dur=None, width=None):
    dest = os.path.join(VID_OUT, out + '.mp4')
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    cut = (['-ss', str(start)] if start is not None else []) + (['-t', str(dur)] if dur else [])
    # long edge 1280 keeps files small; full-bleed video is soft anyway behind type
    scale = f"scale='if(gt(iw,ih),{width or 1280},-2)':'if(gt(iw,ih),-2,{width or 1280})'"
    subprocess.run([FF, '-y', '-loglevel', 'error', *cut, '-i', src, '-an', '-vf', scale + ',fps=30',
                    '-c:v', 'libx264', '-preset', 'slow', '-crf', '27', '-pix_fmt', 'yuv420p',
                    '-movflags', '+faststart', '-map_metadata', '-1', dest], check=True)
    poster = os.path.join(IMG_OUT, out + '.jpg')
    os.makedirs(os.path.dirname(poster), exist_ok=True)
    subprocess.run([FF, '-y', '-loglevel', 'error', '-i', dest, '-frames:v', '1', '-q:v', '3', poster],
                   check=True)
    return os.path.getsize(dest)


def main():
    root = sys.argv[1]
    only = set(sys.argv[3].split(',')) if len(sys.argv) > 3 and sys.argv[2] == '--only' else None
    manifest = json.load(open(os.path.join(HERE, 'media.json')))
    gps = json.load(open(GPS_FILE)) if os.path.exists(GPS_FILE) else {}
    for item in manifest:
        if only and item['out'] not in only:
            continue
        src = os.path.join(root, item['src'])
        if item['src'].lower().endswith(('.mp4', '.mov')):
            size = save_video(src, item['out'], item.get('start'), item.get('dur'), item.get('width'))
            print(f"video {item['out']:40s} {size / 1e6:.2f} MB")
        else:
            im = open_image(src)
            g = gps_of(im)
            if g:
                gps[item['out']] = g
            size = save_image(im, item['out'], item.get('crop'))
            print(f"image {item['out']:40s} {size} gps={g}")
    os.makedirs(os.path.dirname(GPS_FILE), exist_ok=True)
    json.dump(dict(sorted(gps.items())), open(GPS_FILE, 'w'), indent=1)


if __name__ == '__main__':
    main()

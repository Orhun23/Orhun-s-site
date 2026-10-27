"""Lighter copies of every site video for phones: <name>.m.mp4 next to <name>.mp4.

Long edge 640 px, H.264 CRF 30, no audio, faststart. Phones show these clips at a few hundred
CSS pixels wide, so this is plenty, at roughly a third of the bytes.

Usage: python make-mobile-videos.py
Needs: imageio-ffmpeg.
"""
import glob
import os
import subprocess

import imageio_ffmpeg

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.abspath(os.path.join(HERE, '..', '..'))
FF = imageio_ffmpeg.get_ffmpeg_exe()


def main():
    for src in sorted(glob.glob(os.path.join(SITE, 'public', 'media', '**', '*.mp4'), recursive=True)):
        if src.endswith('.m.mp4'):
            continue
        dest = src[:-4] + '.m.mp4'
        scale = "scale='if(gt(iw,ih),640,-2)':'if(gt(iw,ih),-2,640)'"
        subprocess.run([FF, '-y', '-loglevel', 'error', '-i', src, '-an', '-vf', scale, '-c:v', 'libx264',
                        '-preset', 'slow', '-crf', '30', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
                        '-map_metadata', '-1', dest], check=True)
        a, b = os.path.getsize(src), os.path.getsize(dest)
        print(f'{os.path.relpath(dest, SITE):48s} {a // 1024:5d} KB -> {b // 1024:5d} KB')


if __name__ == '__main__':
    main()

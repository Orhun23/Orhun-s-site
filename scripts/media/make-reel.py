"""Cut one short reel (hard cuts, no audio) out of the site's clips, for the hero.

One file instead of eight separate <video>s: one decoder, smooth on phones, and the labels
are synced to its currentTime from the JSON written next to it.

Usage: python make-reel.py
Writes public/media/hero/reel.mp4 + reel.webm, src/assets/media/hero/reel.jpg and
src/data/reel.json. Needs: imageio-ffmpeg.
"""
import json
import os
import subprocess

import imageio_ffmpeg

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.abspath(os.path.join(HERE, '..', '..'))
FF = imageio_ffmpeg.get_ffmpeg_exe()
W, H = 640, 800  # 4:5
FPS = 30
FRAMES = 33  # frames per cut (trimmed by frame count, so the JSON timing is exact)
SEG = FRAMES / FPS

# clip, start, label, where
CUTS = [
    ('field/skate-trocadero.mp4', 7.6, 'Skate', 'Trocadéro · 48.86°N 2.29°E'),
    ('builds/tallbike/welding.mp4', 0.6, 'Tallbike · welding', 'Uni workshop · Eindhoven'),
    ('field/snow-jump.mp4', 1.35, 'Snow', 'Alps · 47.33°N 12.36°E'),
    ('builds/printer/printing.mp4', 1.2, 'Own 3D printer', 'CoreXY · Klipper'),
    ('trips/whale-shark.mp4', 3.0, 'Whale shark', 'Lombok · 8.41°S 116.46°E'),
    ('builds/helmet/faceplate.mp4', 1.3, 'Iron Man helmet', '360° servo · 1 while loop'),
    ('field/backfull.mp4', 0.75, 'Backfull', 'Cape Verde · 14.95°N 24.34°W'),
    ('builds/tallbike/riding.mp4', 2.2, 'Tallbike · test ride', 'Eindhoven · 51.44°N 5.47°E'),
    ('field/skate-indoor.mp4', 4.2, 'Skate', 'Indoor park'),
]


def main():
    media = os.path.join(SITE, 'public', 'media')
    out_dir = os.path.join(media, 'hero')
    os.makedirs(out_dir, exist_ok=True)
    args, chains = [], []
    for i, (src, start, *_rest) in enumerate(CUTS):
        args += ['-ss', str(start), '-t', str(SEG + 0.5), '-i', os.path.join(media, src)]
        chains.append(
            f'[{i}:v]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},setsar=1,fps={FPS},'
            f'trim=end_frame={FRAMES},setpts=PTS-STARTPTS[v{i}]'
        )
    graph = ';'.join(chains) + ';' + ''.join(f'[v{i}]' for i in range(len(CUTS))) + f'concat=n={len(CUTS)}:v=1:a=0[out]'
    mp4 = os.path.join(out_dir, 'reel.mp4')
    webm = os.path.join(out_dir, 'reel.webm')
    subprocess.run([FF, '-y', '-loglevel', 'error', *args, '-filter_complex', graph, '-map', '[out]', '-an',
                    '-c:v', 'libx264', '-preset', 'slow', '-crf', '27', '-pix_fmt', 'yuv420p',
                    '-movflags', '+faststart', '-map_metadata', '-1', mp4], check=True)
    subprocess.run([FF, '-y', '-loglevel', 'error', '-i', mp4, '-c:v', 'libvpx-vp9', '-b:v', '900k',
                    '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', '-an', webm], check=True)
    poster_dir = os.path.join(SITE, 'src', 'assets', 'media', 'hero')
    os.makedirs(poster_dir, exist_ok=True)
    subprocess.run([FF, '-y', '-loglevel', 'error', '-ss', '0.5', '-i', mp4, '-frames:v', '1', '-q:v', '3',
                    os.path.join(poster_dir, 'reel.jpg')], check=True)
    meta = {'seg': SEG, 'cuts': [{'label': c[2], 'where': c[3]} for c in CUTS]}
    json.dump(meta, open(os.path.join(SITE, 'src', 'data', 'reel.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
    for f in (mp4, webm):
        print(os.path.basename(f), os.path.getsize(f) // 1024, 'KB')


if __name__ == '__main__':
    main()

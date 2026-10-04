"""Render a Vichaar film to MP4, frame by frame.
   python3 film/http server on :8790 must be serving the project root.
   python3 render.py hero en hero.wav out.mp4"""
import sys, subprocess, time
from playwright.sync_api import sync_playwright

v, lang, audio, out = sys.argv[1:5]
FPS = 30
W, H = (1920, 1080) if v == 'hero' else (1080, 1920)

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width': W, 'height': H})
    page.goto(f'http://127.0.0.1:8790/film/film.html?v={v}&lang={lang}')
    page.wait_for_function('window.FILM_READY === true', timeout=30000)
    duration = page.evaluate('window.FILM.DURATION')
    frames = int(duration * FPS)
    ff = subprocess.Popen([
        'ffmpeg', '-y', '-loglevel', 'error',
        '-f', 'image2pipe', '-framerate', str(FPS), '-c:v', 'mjpeg', '-i', '-',
        '-i', audio,
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-tune', 'film',
        '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out,
    ], stdin=subprocess.PIPE)
    t0 = time.time()
    for i in range(frames):
        page.evaluate(f'render({i / FPS})')
        ff.stdin.write(page.screenshot(type='jpeg', quality=93))
        if i % 300 == 0:
            print(f'{v}-{lang}: {i}/{frames} frames, {time.time() - t0:.0f}s', flush=True)
    ff.stdin.close()
    ff.wait()
    browser.close()
print(f'done {out} in {time.time() - t0:.0f}s', flush=True)

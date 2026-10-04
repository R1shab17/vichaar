"""Original ambient score for the Vichaar films (synthesised, no samples).
Tanpura-style drone in D, a warm pad, singing bowls on each revelation,
soft bell pings as parallel minds appear.   python3 audio.py hero|reveal out.wav"""
import sys
import numpy as np
from scipy.signal import fftconvolve, butter, lfilter
from scipy.io import wavfile

SR = 44100
V = sys.argv[1] if len(sys.argv) > 1 else 'hero'
OUT = sys.argv[2] if len(sys.argv) > 2 else f'{V}.wav'
DUR = 86.0 if V == 'hero' else 112.0
rng = np.random.default_rng(7)
N = int(DUR * SR)
L = np.zeros(N); R = np.zeros(N)

def add(sig, at, pan=0.0, gain=1.0):
    i = int(at * SR)
    if i >= N: return
    sig = sig[: N - i]
    l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    L[i:i + len(sig)] += sig * l * gain * 1.41
    R[i:i + len(sig)] += sig * r * gain * 1.41

def tanpura(f, dur=6.5):
    t = np.arange(int(dur * SR)) / SR
    out = np.zeros_like(t)
    for k in range(1, 26):
        fk = f * k * (1 + 0.00035 * k)
        if fk > 9000: break
        base = 1 / k ** 0.85
        bloom = 1 + 1.8 * (k / 25) * np.sin(np.pi * np.clip(t / 2.4, 0, 1))
        env = np.exp(-t / (3.0 + 2.5 / k)) * (1 - np.exp(-t * 90))
        out += base * bloom * env * np.sin(2 * np.pi * fk * t + rng.uniform(0, 2 * np.pi))
    return out * 0.05

def bowl(f0=220.0, dur=11.0, amp=0.32):
    t = np.arange(int(dur * SR)) / SR
    out = np.zeros_like(t)
    for ratio, a, d in [(1, 1.0, 9.0), (2.76, 0.5, 6.0), (5.40, 0.22, 3.6), (8.93, 0.1, 2.2)]:
        for det in (-0.7, 0.7):
            out += a * np.exp(-t / d) * np.sin(2 * np.pi * (f0 * ratio + det * ratio ** 0.5) * t + rng.uniform(0, 6.28))
    return out * (1 - np.exp(-t * 300)) * amp * 0.5

def bell(f, dur=3.2, amp=0.1):
    t = np.arange(int(dur * SR)) / SR
    out = sum(a * np.exp(-t / d) * np.sin(2 * np.pi * f * r * t) for r, a, d in [(1, 1, 2.2), (2.0, 0.35, 1.2), (3.01, 0.18, 0.7), (4.17, 0.08, 0.4)])
    return out * (1 - np.exp(-t * 600)) * amp

def riser(dur=1.8, amp=0.05):
    n = int(dur * SR)
    noise = rng.standard_normal(n)
    b, a = butter(2, [1800 / (SR / 2), 7000 / (SR / 2)], btype='band')
    x = lfilter(b, a, noise)
    env = (np.linspace(0, 1, n) ** 2.4)
    return x * env * amp

def tap(amp=0.05):
    n = int(0.03 * SR)
    x = rng.standard_normal(n) * np.exp(-np.arange(n) / (0.004 * SR))
    b, a = butter(2, 2500 / (SR / 2))
    return lfilter(b, a, x) * amp

# ── drone: Pa, Sa, Sa, low Sa (D) ──
SA = 146.83
cycle = 5.2
notes = [(0.0, SA * 3 / 4 * 1.0, -0.3), (1.3, SA, 0.15), (2.6, SA, 0.25), (3.9, SA / 2, -0.1)]
t0 = 0.4
while t0 < DUR - 3:
    for off, f, pan in notes:
        add(tanpura(f), t0 + off, pan, 0.9)
    t0 += cycle

# ── pad with automation ──
t = np.arange(N) / SR
def automation(points):
    xs, ys = zip(*points)
    return np.interp(t, xs, ys)
if V == 'hero':
    pad_pts = [(0, 0), (4, .18), (12, .25), (14, .62), (21, .45), (35, .4), (36.5, .7), (47, .55), (49, .75), (60, .5), (77, .45), (79, .8), (84, .6), (86, 0)]
else:
    pad_pts = [(0, 0), (4, .18), (16, .3), (17.5, .7), (24, .45), (39, .4), (40.5, .72), (53, .55), (55, .7), (72, .45), (100, .45), (101.5, .82), (110, .6), (112, 0)]
pad_env = automation(pad_pts)
pad = np.zeros(N)
for f, a in [(SA, 1.0), (SA * 1.5, 0.7), (SA * 2, 0.55), (SA * 2.25, 0.32), (SA * 3, 0.18)]:
    for det in (-0.18, 0.21):
        lfo = 1 + 0.25 * np.sin(2 * np.pi * (0.05 + 0.02 * rng.random()) * t + rng.uniform(0, 6.28))
        pad += a * lfo * np.sin(2 * np.pi * (f + det) * t + rng.uniform(0, 6.28))
b, a = butter(2, 1400 / (SR / 2))
pad = lfilter(b, a, pad) * pad_env * 0.035
L += pad; R += pad * 0.98

# ── events ──
PENTA = [587.33, 659.26, 739.99, 880.0, 987.77, 1174.66, 1318.5]
if V == 'hero':
    blooms = [13.0, 35.9, 48.6, 78.2]
    stars = [47.8 + 1.6 + i * 0.85 for i in range(6)]
    taps = [24.6, 32.4]
    words = [35.8 + 1.3 + i * 0.13 for i in range(11)]
    soft = [(65.2, 880.0), (69.8, 587.33)]
else:
    blooms = [16.8, 39.7, 101.0]
    stars = [53.6 + 1.0 + i * 0.35 for i in range(3)]
    taps = [25.6, 33.6, 52.4]
    words = [39.6 + 1.3 + i * 0.13 for i in range(11)]
    soft = [(53.8, 440.0), (78.2, 880.0), (86.8, 587.33)]
for i, b0 in enumerate(blooms):
    add(riser(), b0 - 1.8, 0.0, 1.0)
    add(bowl(220.0 if i % 2 == 0 else 196.0), b0, -0.15, 1.0)
    add(bowl(440.0, 7, 0.12), b0 + 0.02, 0.3, 1.0)
for i, s in enumerate(stars):
    add(bell(PENTA[i % len(PENTA)], amp=0.085), s, -0.6 + 1.2 * i / max(1, len(stars) - 1))
for tp in taps:
    add(tap(), tp, 0.1)
for i, w in enumerate(words):
    add(bell(PENTA[(i * 3) % len(PENTA)] * 2, 1.4, 0.018), w, rng.uniform(-0.6, 0.6))
for at, f in soft:
    add(bell(f, 3.6, 0.06), at, 0.0)

# ── reverb ──
ir_len = int(3.4 * SR)
ti = np.arange(ir_len) / SR
def ir():
    x = rng.standard_normal(ir_len) * np.exp(-ti / 0.85)
    b2, a2 = butter(1, 5000 / (SR / 2))
    return lfilter(b2, a2, x) / np.sqrt(ir_len) * 6
wetL = fftconvolve(L, ir())[:N]; wetR = fftconvolve(R, ir())[:N]
mixL = L * 0.72 + wetL * 0.42
mixR = R * 0.72 + wetR * 0.42

# ── master ──
fade = np.ones(N)
fi = int(1.5 * SR); fo = int(3.5 * SR)
fade[:fi] = np.linspace(0, 1, fi) ** 2
fade[-fo:] = np.linspace(1, 0, fo) ** 1.6
st = np.stack([mixL, mixR], 1) * fade[:, None]
st = np.tanh(st * 1.4) / 1.4
st *= 0.89 / np.max(np.abs(st))
wavfile.write(OUT, SR, (st * 32767).astype(np.int16))
print(OUT, f'{DUR}s')

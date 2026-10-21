import numpy as np, subprocess, os, sys
from scipy.signal import fftconvolve, butter, lfilter
SR = 44100
OUT = sys.argv[1]
rng = np.random.default_rng(7)

def t_(d): return np.arange(int(SR * d)) / SR

def env(n, a, d, curve=6.0):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) * curve / max(d, 1e-4))
    return e

def bell(f, d, a=0.004, decay=None, bright=0.35):
    t = t_(d)
    decay = decay or d
    s = np.sin(2 * np.pi * f * t) + bright * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t * 6) + 0.12 * bright * np.sin(2 * np.pi * f * 3.01 * t) * np.exp(-t * 10)
    return s * env(len(t), a, decay, 5.0)

def pluck(f, d, a=0.002):
    t = t_(d)
    s = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 18)
    return s * env(len(t), a, d, 7.0)

def lp(x, fc):
    b, a = butter(2, fc / (SR / 2), 'low')
    return lfilter(b, a, x)

def hp(x, fc):
    b, a = butter(2, fc / (SR / 2), 'high')
    return lfilter(b, a, x)

def bp(x, lo, hi):
    return lp(hp(x, lo), hi)

def place(buf, x, at):
    i = int(at * SR)
    need = i + len(x)
    if need > len(buf):
        buf = np.concatenate([buf, np.zeros(need - len(buf))])
    buf[i:i + len(x)] += x
    return buf

def reverb(x, rt=0.8, mix=0.18):
    n = int(SR * rt)
    ir = rng.standard_normal(n) * np.exp(-np.arange(n) / SR * 6.9 / rt)
    ir = lp(ir, 6000)
    ir /= np.sqrt(np.sum(ir ** 2))
    wet = fftconvolve(x, ir)
    wet = np.concatenate([wet, np.zeros(max(0, len(x) + n - len(wet)))])[:len(x) + n]
    dry = np.concatenate([x, np.zeros(n)])
    return dry * (1 - mix) + wet * mix * 0.6

def fin(x, name, tail=0.6, mix=0.18):
    x = reverb(x, tail, mix)
    nz = np.nonzero(np.abs(x) > 1e-4 * np.max(np.abs(x)))[0]
    x = x[:nz[-1] + 1]
    fade = min(len(x), int(0.03 * SR))
    x[-fade:] *= np.linspace(1, 0, fade)
    x = x / np.max(np.abs(x)) * 0.9
    st = np.stack([x, x], 1)
    wav = OUT + '/' + name + '.wav'
    import wave
    with wave.open(wav, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((st * 32767).astype('<i2').tobytes())
    print(name, round(len(x) / SR, 2))

N = lambda m: 440 * 2 ** ((m - 69) / 12)

b = np.zeros(1)
for k, (m, at) in enumerate([(79, 0.0), (83, 0.045), (86, 0.09)]):
    b = place(b, pluck(N(m), 0.25) * (0.7 - 0.12 * k), at)
w = rng.standard_normal(int(SR * 0.28))
w = bp(w, 900, 5000) * np.sin(np.linspace(0, np.pi, len(w))) ** 2 * 0.35
b = place(b, w, 0.0)
fin(b, 'reroll', 0.5, 0.15)

b = np.zeros(1)
for k, m in enumerate([72, 76, 79, 84]):
    b = place(b, bell(N(m), 0.9, bright=0.25) * (0.55 + 0.1 * k), k * 0.085)
pad = np.zeros(int(SR * 1.1))
tt = t_(1.1)
for m in (72, 76, 79):
    pad += np.sin(2 * np.pi * N(m) * tt) * 0.12
pad *= np.minimum(1, tt / 0.25) * np.exp(-np.maximum(0, tt - 0.3) * 3)
b = place(b, pad, 0.2)
b = place(b, bell(N(88), 0.9, bright=0.15) * 0.35, 0.36)
fin(b, 'levelup', 1.0, 0.22)

b = np.zeros(1)
tt = t_(0.09)
pop = np.sin(2 * np.pi * (300 + 900 * tt / 0.09) * tt) * env(len(tt), 0.002, 0.06, 6) * 0.5
b = place(b, pop, 0)
b = place(b, bell(N(91), 0.35, bright=0.2) * 0.5, 0.03)
b = place(b, bell(N(96), 0.4, bright=0.15) * 0.45, 0.09)
fin(b, 'buy', 0.45, 0.15)

tt = t_(0.16)
f = 180 * np.exp(-tt * 9) + 90
ph = 2 * np.pi * np.cumsum(f) / SR
th = np.sin(ph) * env(len(tt), 0.002, 0.1, 6)
cl = lp(rng.standard_normal(len(tt)), 2500) * np.exp(-tt * 70) * 0.25
b = th + cl
fin(b, 'place', 0.25, 0.1)

b = np.zeros(1)
b = place(b, bell(N(88), 0.35, bright=0.2) * 0.5, 0)
b = place(b, bell(N(81), 0.45, bright=0.2) * 0.5, 0.08)
for k in range(5):
    b = place(b, bell(N(96 - k * 2) * (1 + rng.uniform(-0.01, 0.01)), 0.12, bright=0.1) * 0.15, 0.14 + k * 0.035)
fin(b, 'sell', 0.45, 0.15)

def star(name, big):
    dur = 2.0
    b = np.zeros(int(SR * dur))
    sw = 1.45
    tt = t_(sw)
    f0, f1 = (N(67), N(91)) if not big else (N(64), N(96))
    f = f0 * (f1 / f0) ** ((tt / sw) ** 1.6)
    ph = 2 * np.pi * np.cumsum(f) / SR
    trem = 0.75 + 0.25 * np.sin(2 * np.pi * (4 + 14 * (tt / sw) ** 2) * tt)
    rise = (np.sin(ph) * 0.5 + 0.18 * np.sin(2 * ph)) * (tt / sw) ** 1.2 * trem
    rise *= np.minimum(1, (sw - tt) / 0.06)
    b = place(b, rise * (0.35 if not big else 0.4), 0.0)
    nsp = 10 if not big else 22
    for k in range(nsp):
        at = 0.25 + (sw - 0.3) * (k / nsp) + rng.uniform(-0.03, 0.03)
        m = 84 + rng.integers(0, 14)
        b = place(b, bell(N(m), 0.18, bright=0.05) * (0.1 + 0.12 * k / nsp), at)
    chord = [72, 76, 79, 84] if not big else [72, 76, 79, 84, 88, 91]
    for k, m in enumerate(chord):
        b = place(b, bell(N(m), 1.4 if big else 1.0, a=0.003, bright=0.3) * (0.5 if k == 0 else 0.35), 1.5 + k * (0.0 if not big else 0.025))
    hit = rng.standard_normal(int(SR * 0.4))
    hit = bp(hit, 2500, 9000) * np.exp(-np.arange(len(hit)) / SR * 12) * 0.25
    b = place(b, hit, 1.5)
    if big:
        tt2 = t_(1.6)
        pad = sum(np.sin(2 * np.pi * N(m) * tt2) for m in (60, 67, 72)) * 0.1
        pad *= np.minimum(1, tt2 / 0.1) * np.exp(-tt2 * 2.2)
        b = place(b, pad, 1.5)
    fin(b, name, 1.2, 0.25)

star('star2', False)
star('star3', True)

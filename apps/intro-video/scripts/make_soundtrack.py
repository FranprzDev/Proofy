"""Synthesizes public/soundtrack.wav: an original hybrid-trailer cue synced to ProofyPromo's cuts.

Run: python scripts/make_soundtrack.py  (needs numpy + scipy)
Cut times mirror src/ProofyPromo.tsx: scene starts at frames 0, 56, 118, 213, 413, 529 of 649 @ 30fps.
"""
import wave
from pathlib import Path

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR = 44100
FPS = 30
DURATION = 649 / FPS
N = int(DURATION * SR)
rng = np.random.default_rng(7)

CUT_HOOK, CUT_HEADLINE, CUT_FLOW, CUT_ARCH, CUT_OUTRO = (f / FPS for f in (56, 118, 213, 413, 529))
STEP_2, STEP_3 = (213 + 70) / FPS, (213 + 140) / FPS
PAID = (213 + 140 + 40) / FPS
CTA = (529 + 44) / FPS
BEAT = 60 / 128

# D minor: Dm - Bb - F - C, one chord per bar.
CHORDS = [(73.42, 87.31, 110.0), (58.27, 73.42, 87.31), (87.31, 110.0, 130.81), (65.41, 82.41, 98.0)]


def t_axis(n):
    return np.arange(n) / SR


def lowpass(x, hz, order=2):
    return sosfilt(butter(order, hz, "low", fs=SR, output="sos"), x)


def highpass(x, hz, order=2):
    return sosfilt(butter(order, hz, "high", fs=SR, output="sos"), x)


def bandpass(x, lo, hi):
    return sosfilt(butter(2, [lo, hi], "band", fs=SR, output="sos"), x)


def place(bus, sound, at, gain=1.0):
    i = int(at * SR)
    if i >= len(bus) or i < 0:
        return
    end = min(len(bus), i + len(sound))
    bus[i:end] += sound[: end - i] * gain


def saw(freq, n, detune=0.0):
    ph = np.cumsum(np.full(n, freq * (1 + detune) / SR))
    return 2 * (ph % 1) - 1


def kick(length=0.45):
    t = t_axis(int(length * SR))
    freq = 45 + 110 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-t * 7)


def snare():
    t = t_axis(int(0.25 * SR))
    noise = bandpass(rng.standard_normal(len(t)), 1200, 6000) * np.exp(-t * 18)
    body = np.sin(2 * np.pi * 185 * t) * np.exp(-t * 25)
    return noise * 0.8 + body * 0.5


def hat():
    t = t_axis(int(0.06 * SR))
    return highpass(rng.standard_normal(len(t)), 7000) * np.exp(-t * 70)


def boom(length=2.5, size=1.0):
    t = t_axis(int(length * SR))
    freq = 32 + 90 * np.exp(-t * 6)
    sub = np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-t * 1.6)
    crack = lowpass(rng.standard_normal(len(t)), 2500) * np.exp(-t * 14)
    return (sub + crack * 0.6) * size


def riser(length):
    n = int(length * SR)
    noise = rng.standard_normal(n)
    out = np.zeros(n)
    chunks = 24
    for c in range(chunks):
        a, b = c * n // chunks, (c + 1) * n // chunks
        out[a:b] = bandpass(noise[a:b], 200 + 6000 * (c / chunks) ** 2, 9000 + 2000 * c / chunks)
    tone = saw(110, n) * np.linspace(0, 1, n) ** 2
    pitch = np.sin(2 * np.pi * np.cumsum(np.linspace(200, 1400, n)) / SR) * 0.15
    return (out * 0.5 + lowpass(tone, 1500) * 0.3 + pitch) * np.linspace(0, 1, n) ** 3


def whoosh(length=0.45):
    n = int(length * SR)
    env = np.sin(np.linspace(0, np.pi, n)) ** 2
    return bandpass(rng.standard_normal(n), 400, 4000) * env


def bell(freq):
    t = t_axis(int(1.6 * SR))
    return sum(np.sin(2 * np.pi * freq * m * t) * np.exp(-t * (3 + m)) / m for m in (1, 2.01, 3.02))


def reverb(x, seconds=1.4):
    ir_t = t_axis(int(seconds * SR))
    ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t * 4.5)
    wet = fftconvolve(x, lowpass(ir, 5000))[: len(x)]
    return wet / (np.max(np.abs(wet)) + 1e-9) * np.max(np.abs(x))


drums = np.zeros(N)
music = np.zeros(N)
fx = np.zeros(N)

# Intro tension: low drone and a ticking clock that speeds up into the drop.
drone_end = int(CUT_HEADLINE * SR)
drone = lowpass(saw(36.71, drone_end) + saw(36.71, drone_end, 0.004), 180)
music[:drone_end] += drone * np.linspace(0.15, 0.6, drone_end)
tick_t = 0.25
while tick_t < CUT_HEADLINE - 0.1:
    place(drums, hat(), tick_t, 0.35 + 0.4 * tick_t / CUT_HEADLINE)
    tick_t += BEAT if tick_t < CUT_HOOK else BEAT / 2

# Main groove from the headline drop; the architecture section is a half-time breakdown.
beat_t, beat = CUT_HEADLINE, 0
while beat_t < CTA:
    breakdown = CUT_ARCH <= beat_t < CUT_OUTRO - 0.05
    if not breakdown or beat % 2 == 0:
        place(drums, kick(), beat_t, 0.55 if breakdown else 1.0)
    if beat % 4 in (1, 3) and not breakdown:
        place(drums, snare(), beat_t, 0.7)
    for half in (0, 0.5):
        place(drums, hat(), beat_t + half * BEAT, 0.3 if half else 0.18)
    beat_t += BEAT
    beat += 1

# Bass pulses, pad and arp follow the chord grid; after the CTA a final Dm rings out.
bar = 4 * BEAT
pad = np.zeros(N)
bar_t, bar_i = CUT_HEADLINE, 0
while bar_t < DURATION:
    final = bar_t >= CTA
    root, third, fifth = CHORDS[0] if final else CHORDS[bar_i % 4]
    length = DURATION - bar_t if final else min(bar, CTA - bar_t)
    n = int(length * SR)
    seg = t_axis(n)
    chord = sum(saw(f * 2, n, d) for f in (root, third, fifth) for d in (-0.006, 0.006)) / 6
    place(pad, lowpass(chord, 1800) * np.minimum(seg / 0.25, 1), bar_t, 0.6 if final else 0.5)
    if not final:
        for k in range(int(length / (BEAT / 2))):
            pulse_n = int(BEAT / 2 * SR)
            pulse_t = t_axis(pulse_n)
            place(music, lowpass(saw(root, pulse_n), 420) * np.exp(-pulse_t * 6) * (1 - np.exp(-pulse_t * 200)), bar_t + k * BEAT / 2, 0.55)
        if CUT_FLOW <= bar_t < CUT_OUTRO:
            notes = [root * 4, third * 4, fifth * 4, third * 4]
            for k in range(int(length / (BEAT / 4))):
                note_n = int(BEAT / 4 * SR)
                note = np.sign(np.sin(2 * np.pi * notes[k % 4] * t_axis(note_n))) * np.exp(-t_axis(note_n) * 18)
                place(music, lowpass(note, 3500), bar_t + k * BEAT / 4, 0.12)
    else:
        break
    bar_t += length
    bar_i += 1

music += pad + reverb(pad) * 0.35

# Impacts on every cut, risers into the big drops, whooshes on transitions.
for at, size in ((0.2, 0.8), (CUT_HOOK, 0.7), (CUT_HEADLINE, 1.2), (CUT_FLOW, 0.8), (CUT_ARCH, 0.7), (CUT_OUTRO, 1.2), (CTA, 1.4)):
    place(fx, boom(size=size), at)
for target, length in ((CUT_HEADLINE, 1.6), (CUT_OUTRO, 2.4), (CTA, 1.0), (CUT_FLOW, 0.6)):
    place(fx, riser(length), target - length, 0.7)
for at in (CUT_HOOK, CUT_HEADLINE, CUT_FLOW, CUT_ARCH, CUT_OUTRO, STEP_2, STEP_3):
    place(fx, whoosh(), at - 0.2, 0.45)
place(fx, bell(1318.5), PAID, 0.35)
place(fx, bell(1975.5), PAID + 0.09, 0.25)
fx += reverb(fx, 2.0) * 0.4

mix = drums * 0.8 + music * 0.7 + fx * 0.9
mix = np.tanh(mix * 1.3)
fade = int(0.8 * SR)
mix[-fade:] *= np.linspace(1, 0, fade) ** 2
mix /= np.max(np.abs(mix)) / 0.89

# A small Haas delay on the right channel for width.
delay = int(0.012 * SR)
right = np.concatenate([np.zeros(delay), mix[:-delay]]) * 0.6 + mix * 0.4
stereo = np.stack([mix, right], axis=1)
pcm = (stereo * 32767).astype("<i2")

out = Path(__file__).resolve().parent.parent / "public" / "soundtrack.wav"
with wave.open(str(out), "wb") as f:
    f.setnchannels(2)
    f.setsampwidth(2)
    f.setframerate(SR)
    f.writeframes(pcm.tobytes())
print(f"wrote {out} ({DURATION:.2f}s)")

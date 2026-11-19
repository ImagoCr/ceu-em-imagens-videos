"""Trilha (órgão sintetizado + sinos), voz e mixagem -> out/mix.wav (48 kHz, estéreo).
Tudo lido de timeline.json, a mesma linha do tempo da imagem."""
import json, os
import numpy as np, soundfile as sf, soxr
from scipy.signal import fftconvolve, butter, sosfilt

HERE = os.path.dirname(os.path.abspath(__file__))
TL = json.load(open(os.path.join(HERE, 'timeline.json'), encoding='utf-8'))
SR = 48000
N = int(TL['dur'] * SR) + SR
rng = np.random.default_rng(3)
line = {l['id']: l for l in TL['lines']}
scene = {s['scene']: s for s in TL['scenes']}
mtof = lambda m: 440 * 2 ** ((m - 69) / 12)

def env_ad(n, a, r):
    e = np.ones(n); ai, ri = int(a * SR), int(r * SR)
    e[:ai] = np.linspace(0, 1, ai) ** 2 if ai else 1
    if ri: e[-ri:] *= np.linspace(1, 0, ri) ** 1.5
    return e

# ---------- órgão: acordes por cena, ataque e soltura lentos ----------
CHORDS = {1: [50, 57, 62, 64], 2: [50, 57, 62, 66, 69], 3: [47, 54, 59, 62, 66], 4: [43, 50, 55, 59, 62],
          5: [40, 52, 55, 59, 62], 6: [45, 52, 57, 62, 64], 7: [42, 54, 57, 62, 66], 8: [43, 55, 59, 62, 67], 9: [38, 50, 57, 62, 66, 69]}
PARTIALS = [(1, 1.0), (2, .5), (3, .22), (4, .16), (6, .07), (8, .05)]
organ = np.zeros((N, 2))
for k, s in scene.items():
    t0, t1 = max(0, s['t0'] - .4), min(TL['dur'] + .5, s['t1'] + 1.6)
    n = int((t1 - t0) * SR); tt = np.arange(n) / SR
    e = env_ad(n, 1.6 if k > 1 else 3.0, 2.0)
    for i, m in enumerate(CHORDS[k]):
        f = mtof(m); vol = (.55 if m < 48 else .32) / len(CHORDS[k]) ** .5
        for side, det in ((0, -.8), (1, .8)):
            sig = sum(a * np.sin(2 * np.pi * f * h * (1 + det * 1e-3 * h / 4) * tt + i + side) for h, a in PARTIALS)
            trem = 1 + .05 * np.sin(2 * np.pi * (4.7 + .3 * i) * tt)
            organ[int(t0 * SR):int(t0 * SR) + n, side] += sig * trem * e * vol
sos = butter(2, 3200, 'low', fs=SR, output='sos'); organ = sosfilt(sos, organ, axis=0)
# o gancho começa só com o pedal e o órgão cresce quando o vitral acende
organ *= np.clip(np.arange(N) / SR / 3.5, .25, 1)[:, None]

# ---------- sinos (parciais inarmônicas) ----------
bells = np.zeros((N, 2))
def bell(t, m, g=.25, pan=0.):
    f = mtof(m); n = int(4.5 * SR); tt = np.arange(n) / SR
    sig = sum(a * np.exp(-tt * d) * np.sin(2 * np.pi * f * r * tt) for r, a, d in [(1, 1, 1.1), (2.32, .45, 1.8), (4.25, .25, 2.6), (6.63, .12, 3.5), (9.38, .06, 5)])
    sig *= np.minimum(1, tt / .004)
    i = int(t * SR); j = min(N, i + n)
    bells[i:j, 0] += sig[:j - i] * g * (1 - pan) ; bells[i:j, 1] += sig[:j - i] * g * (1 + pan)
MOTIF = [74, 78, 81, 86, 81]
for k, s in scene.items():
    if k > 1: bell(s['t0'] + .15, MOTIF[(k - 2) % len(MOTIF)], .16, (-1) ** k * .3)
for i, (lid, m) in enumerate([('l09', 86), ('l12', 81), ('l16', 78), ('l22', 86), ('l23', 90), ('l24', 81)]):
    bell(line[lid]['t0'] - .05, m, .13, (-1) ** i * .25)
for i, lid in enumerate(['l18', 'l19', 'l20', 'l21']):   # os quatro momentos: uma nota por orbe
    bell(line[lid]['t0'] - .05, [74, 76, 78, 81][i], .12, -.45 + .3 * i)
bell(3.0, 62, .2); bell(3.02, 74, .12)                 # o vitral acende
for i, m in enumerate([81, 78, 74, 69]): bell(.25 + i * .32, m, .1, -.4 + .27 * i)   # as velas acendem

# ---------- sopro de ar nas transições ----------
air = np.zeros((N, 2))
for k, s in scene.items():
    if k == 1: continue
    n = int(2.2 * SR); tt = np.linspace(0, 1, n)
    noise = rng.standard_normal((n, 2))
    noise = sosfilt(butter(2, [300, 2500], 'band', fs=SR, output='sos'), noise, axis=0)
    e = np.sin(np.pi * tt) ** 2
    i = int((s['t0'] - 1.1) * SR); air[i:i + n] += noise * e[:, None] * .05

# ---------- reverberação de igreja ----------
def ir(sec=4.2):
    n = int(sec * SR); tt = np.arange(n) / SR
    r = rng.standard_normal((n, 2)) * np.exp(-tt * 6.9 / sec)[:, None]
    r = sosfilt(butter(1, 5000, 'low', fs=SR, output='sos'), r, axis=0)
    r[:int(.02 * SR)] = 0
    return r / np.sqrt((r ** 2).sum(0))
IR = ir()
def verb(x, wet):
    y = np.stack([fftconvolve(x[:, c], IR[:, c])[:N] for c in range(2)], 1)
    return x * (1 - wet) + y * wet * 3.0

music = verb(organ * .55 + bells, .45) + verb(air, .3)

# ---------- voz ----------
voice = np.zeros(N)
for l in TL['lines']:
    a, sr = sf.read(os.path.join(HERE, 'voice', l['id'] + '.wav'))
    if a.ndim > 1: a = a.mean(1)
    a = soxr.resample(a, sr, SR)
    i = int(l['t0'] * SR); voice[i:i + len(a)] += a[:N - i]
voice = sosfilt(butter(2, 90, 'high', fs=SR, output='sos'), voice)
voice /= np.abs(voice).max() + 1e-9
vst = np.stack([voice, voice], 1)
vst = verb(vst, .07)

# ducking: música cai ~9 dB sob a voz
def smooth(x, w):
    c = np.cumsum(np.concatenate([np.zeros(w // 2 + 1), x, np.zeros(w // 2)]))
    return (c[w:] - c[:-w])[:len(x)] / w
act = smooth(np.abs(voice), int(.25 * SR))
duck = 1 - (1 - 10 ** (-9 / 20)) * np.clip(act / (act.max() * .08), 0, 1)
duck = smooth(duck, int(.3 * SR))
mix = vst * .9 + music * duck[:, None] * .1

# fecho: tudo esvai no final
fade = np.clip((TL['dur'] - np.arange(N) / SR) / 2.0, 0, 1)
mix *= fade[:, None]
mix = mix[:int(TL['dur'] * SR)]
mix /= np.abs(mix).max() / .89
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR, subtype='PCM_24')
print('mix.wav', round(len(mix) / SR, 2), 's')

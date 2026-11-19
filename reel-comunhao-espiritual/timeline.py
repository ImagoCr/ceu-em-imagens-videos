"""Monta timeline.json (fonte única de tempo) a partir de lines.json e voice/dur.json."""
import json, os, re
HERE = os.path.dirname(os.path.abspath(__file__))
lines = json.load(open(os.path.join(HERE, 'lines.json'), encoding='utf-8'))
import wave
def wav_dur(p):
    with wave.open(p) as w: return w.getnframes() / w.getframerate()
# duração lida dos próprios arquivos de voz: trocar a voz sintética por gravações reais (mesmos nomes) basta
dur = {l['id']: round(wav_dur(os.path.join(HERE, 'voice', l['id'] + '.wav')), 3) for l in lines}
LEAD, GAP, SCENE_GAP, TAIL = 1.4, 0.38, 1.05, 3.6

def chunks(text, maxc=30):
    # quebra em pedaços curtos para a legenda, respeitando a pontuação
    parts = re.split(r'(?<=[,.:?!])\s+', text)
    out = []
    for p in parts:
        words, cur = p.split(), ''
        for w in words:
            if cur and len(cur) + 1 + len(w) > maxc:
                out.append(cur); cur = w
            else:
                cur = (cur + ' ' + w).strip()
        if cur: out.append(cur)
    # junta pedaços muito curtos ao anterior
    merged = []
    for c in out:
        if merged and len(c) <= 6 and len(merged[-1]) + len(c) < maxc + 8: merged[-1] += ' ' + c
        else: merged.append(c)
    return merged

t, prev_scene, L, scenes = LEAD, None, [], {}
for l in lines:
    if prev_scene is not None:
        t += SCENE_GAP if l['scene'] != prev_scene else GAP
    d = dur[l['id']]
    cs = chunks(l['text']); tot = sum(len(c) + 4 for c in cs); acc = t; caps = []
    for c in cs:
        cd = d * (len(c) + 4) / tot
        caps.append({'t0': round(acc, 3), 't1': round(acc + cd, 3), 'text': c}); acc += cd
    L.append({**l, 't0': round(t, 3), 't1': round(t + d, 3), 'caps': caps})
    s = scenes.setdefault(l['scene'], {'scene': l['scene'], 't0': round(t - (0.6 if prev_scene else LEAD), 3)})
    s['t1'] = round(t + d, 3)
    t += d; prev_scene = l['scene']
DUR = round(t + TAIL, 2)
S = [scenes[k] for k in sorted(scenes)]
for i in range(len(S) - 1): S[i]['t1'] = S[i + 1]['t0']
S[0]['t0'] = 0; S[-1]['t1'] = DUR
json.dump({'dur': DUR, 'lines': L, 'scenes': S}, open(os.path.join(HERE, 'timeline.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('DUR', DUR)
for s in S: print('cena', s['scene'], s['t0'], s['t1'])

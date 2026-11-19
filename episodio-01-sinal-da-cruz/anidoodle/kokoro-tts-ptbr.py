#!/root/.local/share/uv/tools/kokoro-tts/bin/python
# Invólucro mínimo da CLI kokoro-tts para pt-BR, com a mesma assinatura que o AniDoodle chama:
#   kokoro-tts in.txt out.wav --voice pf_dora --speed 0.85 --lang pt-BR
# Por que existe: a CLI original recusa "pt-br" (lista fixa do kokoro_onnx) e o fonemizador do
# kokoro_onnx aplica regras do inglês que estragam o português (x -> k fazia "respondem" virar
# "kespondem"; r -> ɹ; o til da nasal é descartado). Aqui o espeak-ng gera os fonemas em pt-br e só
# três ajustes são feitos: ɹ/r -> ɾ, x fica x, e vogal nasal sem consoante nasal depois ganha ŋ.
import sys, os, re, soundfile as sf, phonemizer
from kokoro_onnx import Kokoro
from kokoro_onnx.tokenizer import VOCAB
a = sys.argv[1:]
def opt(n, d):
    return a[a.index(n) + 1] if n in a else d
src, out = a[0], a[1]
voice, speed, lang = opt("--voice", "pf_dora"), float(opt("--speed", "1")), opt("--lang", "pt-br").lower()
home = os.path.expanduser("~/.cache/kokoro")
k = Kokoro(os.path.join(home, "kokoro-v1.0.onnx"), os.path.join(home, "voices-v1.0.bin"))
text = open(src, encoding="utf-8").read().strip()
ph = phonemizer.phonemize(text, lang, preserve_punctuation=True, with_stress=True)
if lang.startswith("pt"):
    ph = ph.replace("ɹ", "ɾ").replace("r", "ɾ")
    ph = re.sub(r"((?:[a-zɐɛɔʊɪæ]̃)+)(?![ŋmn])", lambda m: m.group(1) + "ŋ", ph)
ph = ph.replace("̃", "").replace("ʲ", "j")
ph = "".join(c for c in ph if c in VOCAB).strip()
if "--debug-phonemes" in a:
    print(ph, file=sys.stderr)
audio, sr = k.create(text, voice=voice, speed=speed, lang="en-us", phonemes=ph)
sf.write(out, audio, sr)

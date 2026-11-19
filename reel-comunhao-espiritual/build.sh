#!/bin/sh
# Gera o reel do zero. Precisa da biblioteca Lemo Opuscar instalada (sh setup.sh deps voice).
# Uso: LIB=/caminho/para/lemo-opuscar sh build.sh
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$HOME/lemo-opuscar}
[ -f "$LIB/core/render/video.mjs" ] || { echo "defina LIB com a pasta da biblioteca Lemo Opuscar"; exit 1; }
PY="$LIB/.venv/bin/python"

# 1. voz (Kokoro, pt-BR) e linha do tempo
"$PY" -c "
import json; L = json.load(open('$HERE/lines.json'))
for l in L: l.update(voice='pf_dora', speed=1.05, lang='pt-br')
json.dump(L, open('$HERE/voice/tts_lines.json', 'w'), ensure_ascii=False, indent=0)"
(cd "$LIB" && "$PY" core/tts/tts.py "$HERE/voice/tts_lines.json" "$HERE/voice")
python3 "$HERE/timeline.py"

# 2. imagem (Three.js, quadro a quadro). Em máquina sem GPU: LEMO_ANGLE=swiftshader
mkdir -p "$HERE/out"
(cd "$LIB" && node core/render/video.mjs "$HERE" --fps 30 --workers 4 --size 1080x1920 --out "$HERE/out/video.mp4")

# 3. trilha e mixagem
"$PY" "$HERE/mix.py"

# 4. junta imagem e som, normaliza em -14 LUFS (padrão de Reels e YouTube)
ffmpeg -y -loglevel error -i "$HERE/out/video.mp4" -i "$HERE/out/mix.wav" \
  -map 0:v -map 1:a -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -profile:v high -movflags +faststart \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11" -ar 48000 -c:a aac -b:a 192k -shortest "$HERE/reel-comunhao-espiritual.mp4"
echo "pronto: $HERE/reel-comunhao-espiritual.mp4"

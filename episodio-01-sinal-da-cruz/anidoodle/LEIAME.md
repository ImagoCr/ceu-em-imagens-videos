# Código do filme do episódio 1

Os arquivos daqui vão para dentro de um projeto AniDoodle (criado com `scaffold.mjs`).

- `sinalDaCruz.ts` e `sinalDaCruzScore.ts` ficam em `src/canvas-core/`. O primeiro é o filme (cenas, poses, tempos presos às palavras da narração) e o segundo é a trilha de caixinha de música.
- `imagens-meta.json` vai para `assets/ep01/prep/meta.json`. As imagens em si (personagens e cenários gerados no ChatGPT) estão na pasta do Google Drive "Ceu em Imagens - Episodio 01 - imagens". Antes de entrar no filme, cada uma passa por um preparo: o canal alfa é limpo, as bordas vazias são cortadas e os cenários são ajustados para 1080x1920 em JPEG.
- `kokoro-tts-ptbr.py` é o invólucro que faz a voz Kokoro falar pt-BR (a CLI original recusa pt-br). Só serve enquanto a narração for Kokoro. Com a voz do VoiceStudio, o provedor passa a ser `files`.
- A narração vem de `../narration.json`. Rodar `narrate.mjs bake` gera `src/canvas-core/sinalDaCruzVoice.ts`.

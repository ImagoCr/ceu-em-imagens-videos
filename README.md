# Céu em Imagens — Vídeos da Santa Missa (série infantil)

Repositório de produção dos vídeos infantis da série **Partes da Santa Missa**, do projeto Céu em Imagens (@ceuemimagens). Cada episódio explica um momento da Missa para crianças, em desenho feito em código, com narração gratuita em português.

## O vídeo da vez

**Episódio 1 — O Sinal da Cruz** (cobre o item 2 do roteiro: saudação inicial, sinal da cruz e saudação do padre). Roteiro mestre em `roteiro.md`: 4 blocos, 21 momentos, base IGMR / CNBB (terceira edição típica do Missal Romano).

Personagens: Padre, Leo (menino coroinha), Menina e o livro mascote (nome de trabalho "Milo" — nome ainda NÃO confirmado pelo Rafael). Desenho em código (Canvas 2D, sem IA de imagem), proporção normal, não chibi.

## Ferramentas

- **AniDoodle** (principal, para o vídeo narrado): arte e animação em código, 32 estilos. Estilos certos para esta série: Crayon, Coloured pencil, Pencil & watercolour, Storybook.
- **Lemo Opuscar** (alternativo): filmes em código, estilos Crayon Picture Book e Watercolor Brush.
- **Voz:** Kokoro, gratuita, em pt-BR, roda na máquina. **Testar UMA linha e ouvir antes de narrar o roteiro inteiro** — o módulo Kokoro do AniDoodle ainda não foi testado contra o serviço real.

## Como gerar — Opção A (testar primeiro): Claude Code na web

1. Abrir claude.ai/code e conectar este repositório.
2. Modelo: **Opus 5.5** (os estilos foram ajustados para ele; outros modelos podem não reproduzir igual).
3. Instalar o plugin do AniDoodle:
   ```
   /plugin marketplace add alexgreensh/anidoodle
   /plugin install anidoodle@alexgreensh-anidoodle
   ```
4. Pedir ao Claude Code (copiar e colar):
   > "Escreva as falas do episódio 1, O Sinal da Cruz, a partir do roteiro.md, em linguagem simples para crianças, sem inventar nada de doutrina. Depois gere o vídeo narrado em 9:16 com o AniDoodle, estilo Crayon, voz Kokoro em pt-BR. Antes, faça o teste de uma linha de narração e confira com narrate.mjs check. Mostre o storyboard antes de renderizar."
5. Baixar o vídeo pronto e postar (Instagram e YouTube; no YouTube, marcar "Feito para crianças").

## Opção C (se a Opção A não renderizar): GitHub Codespaces

1. Neste repositório, botão Code → Codespaces → Create codespace on main (máquina menor; o plano gratuito dá 120 horas de núcleo por mês).
2. No terminal: `node --version` (20+), `ffmpeg -version`, `python3 --version` (3.11+).
3. Instalar o Claude Code no Codespace e entrar com a conta Max.
4. Instalar o plugin (mesmos comandos da Opção A).
5. Mesmo pedido do passo 4 acima.
6. **Parar o Codespace ao terminar**, para não gastar as horas gratuitas.

## Lemo Opuscar (alternativo ao AniDoodle)

```
claude plugin marketplace add lemomo-ai/lemo-opuscar
claude plugin install lemo-opuscar@lemolab
```

Primeiro teste (30 segundos): "Faça um filme de 30 segundos no estilo Crayon Picture Book, formato vertical 9:16, para crianças, explicando de forma simples e carinhosa o momento da missa em que o padre eleva a hóstia. Use narração em português do Brasil e peça para ver o storyboard antes."

## Avisos honestos

- Cada filme leva de 30 a 60 minutos do agente e usa bastante token.
- O estilo 3D tipo Pixar não existe nestes projetos.
- O Claude Code na web ainda não foi confirmado para renderizar vídeo — é o teste da Opção A.
- A narração do AniDoodle precisa de ffmpeg e whisper.cpp para a conferência (`narrate.mjs check`).
- As falas do episódio 1 ainda não estão escritas: o arquivo `episodio-01-sinal-da-cruz/narration.json` está com a estrutura pronta e as linhas vazias, para o Claude Code preencher a partir do roteiro. Não renderizar antes disso.

## Reel avulso: Comunhão espiritual

Pasta `reel-comunhao-espiritual/`. Reel vertical de cerca de 2 min, feito em código com a biblioteca Lemo Opuscar (renderizador, voz Kokoro, conferência com Whisper) e Three.js: capela escura com vitral, altar com velas, Hóstia com resplendor e coração de partículas de luz. Narração com o roteiro na íntegra (voz sintética pf_dora), legenda na tela, trilha de órgão e sinos sintetizada. Tratamento em `TREATMENT.md`, legenda do post em `legenda.txt`.

Para gerar de novo: instalar a biblioteca (`claude plugin install lemo-opuscar@lemolab` ou clonar `lemomo-ai/lemo-opuscar` e rodar `sh plugin/skills/lemo-opuscar/scripts/setup.sh deps voice`) e depois `LIB=<pasta da biblioteca> sh reel-comunhao-espiritual/build.sh`. Para trocar a voz sintética por uma gravação real: gravar uma frase por arquivo, com os mesmos nomes (`voice/l01.wav` a `voice/l24.wav`, WAV PCM, frases em `lines.json`), pular o passo 1 do `build.sh` e rodar o resto. A linha do tempo, as legendas e a trilha se ajustam sozinhas às novas durações.

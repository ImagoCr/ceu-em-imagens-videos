# Episódio 1 — O Sinal da Cruz

## O que falta antes de renderizar

As falas (linhas de narração) ainda não estão escritas. O `narration.json` ao lado está com a estrutura pronta e `lines` vazio de propósito: **não renderizar antes de preencher as linhas**.

## Prompt para o Claude Code (Opus 5.5)

Copiar e colar na sessão do Claude Code, com este repositório conectado:

> "Escreva as falas do episódio 1, O Sinal da Cruz, a partir do item 2 do roteiro.md (saudação inicial: sinal da cruz e saudação do padre), em linguagem simples para crianças, sem inventar nada de doutrina. Preencha o `lines` do episodio-01-sinal-da-cruz/narration.json com essas falas, uma por linha, com id próprio. Depois gere o vídeo narrado em 9:16 com o AniDoodle, estilo Crayon, voz Kokoro em pt-BR. Mostre o storyboard antes de renderizar."

## Voz

- Provedor: `kokoro` (gratuito, roda na máquina, `pipx install kokoro-tts`).
- Voz inicial: `pf_dora` (pt-BR). Alternativas em pt-BR do Kokoro, a testar: `pm_alex`, `pm_santa`.
- **As vozes Kokoro em pt-BR ainda não foram testadas na prática.** Antes de narrar o roteiro inteiro: gerar UMA linha, ouvir, e só depois seguir. O módulo Kokoro do AniDoodle também não foi testado contra o serviço real.

## Comandos (dentro do projeto AniDoodle)

```bash
node tools/narrate.mjs providers                  # quais vozes a máquina pode usar
node tools/narrate.mjs say   episodio-01-sinal-da-cruz/narration.json   # gera as tomadas (com cache)
node tools/narrate.mjs time  episodio-01-sinal-da-cruz/narration.json   # tempos palavra por palavra
node tools/narrate.mjs check episodio-01-sinal-da-cruz/narration.json   # confere cada tomada ouvindo de volta; tem que passar
node tools/narrate.mjs bake  episodio-01-sinal-da-cruz/narration.json   # grava os tempos e as tomadas no filme
node tools/narrate.mjs all   episodio-01-sinal-da-cruz/narration.json   # check e depois bake, quando passar
```

## Regras

- O texto das falas vem do roteiro.md. Não inventar doutrina, frases de santos, números ou datas.
- `narrate.mjs check` tem que passar antes do `bake`. Se uma palavra sumir ou mudar na tomada, corrigir o texto e rodar o check de novo.
- A narração marca o tempo do filme: a imagem é cortada em cima das palavras, nunca o contrário.
- Uma pessoa precisa ouvir a narração antes de publicar. O agente não consegue ouvir a voz.

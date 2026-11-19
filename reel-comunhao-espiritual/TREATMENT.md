# Reel "Comunhão espiritual": tratamento

Formato: vertical 1080x1920, 30 fps, cerca de 2 min 02 s. Narração com o roteiro do Céu em Imagens na íntegra (sem emojis e sem hashtags na fala), voz Kokoro pf_dora em pt-BR, legenda queimada na tela.

## Estilo

A biblioteca Lemo Opuscar não tem um estilo chamado "cinematic". O mais próximo é o Stained Glass (vitral visto de dentro de um salão de pedra escuro), mas a regra 1 dele proíbe imagem religiosa. Por isso este reel usa a gramática de luz desse estilo (o vitral só vive quando a luz passa por ele, a mancha colorida no chão, os feixes com poeira, o órgão com sinos) num estilo próprio, com o tema católico: capela escura, altar com quatro velas, vitral de losangos com a Hóstia no medalhão, Hóstia com resplendor e um coração formado por partículas de luz.

Ferramentas: Three.js (cena 3D e pós-processamento com bloom) renderizada quadro a quadro pelo Chromium headless do Lemo Opuscar (`core/render/video.mjs`), voz pelo `core/tts/tts.py`, trilha sintetizada em Python (`mix.py`), conferência da fala com Whisper.

## Estruturas consideradas

1. Uma noite na capela, do escuro ao vitral aceso, com cada bloco do roteiro como um momento de luz. Escolhida: a luz que "entra" é a imagem direta do "vem morar em mim", e o ambiente segura dois minutos sem cansar.
2. Uma única lanceta lida de baixo para cima, um medalhão por bloco. Descartada: em 9:16 obriga a câmera a subir o tempo todo e os textos ficam disputando espaço com o vidro.
3. Casa e igreja alternadas (a família rezando em casa, o altar na Missa). Descartada: pediria personagens desenhados, que a série infantil ainda está definindo com o Rafael.

## Cenas

1. Gancho (0 a 4 s): escuro, as velas acendem uma a uma, o vitral acende. Título "Com que idade você descobriu isso aqui?" já no primeiro quadro.
2. A Hóstia sobe do altar com resplendor dourado: mesmos benefícios da comunhão sacramental.
3. O que é: a poeira do feixe se junta e forma um coração de luz.
4. Aqui em casa: o coração encolhe e entra numa casinha de luz. "Jesus, vem morar no meu coração."
5. O adulto também pode: o coração volta, maior. "Jesus, vem morar na minha alma."
6. Atenção: câmera baixa, Hóstia e vitral acima. Não substitui a comunhão sacramental.
7. Quando fazer: quatro luzes acendem sobre o altar, uma por momento, com a lista na tela.
8. Não é fórmula mágica: o coração fica dourado e se abre em partículas, "um dos tesouros da nossa fé católica".
9. Fecho: plano aberto da capela, pergunta final e "Conta nos comentários", com @ceuemimagens.

Som: órgão em acordes que mudam a cada cena, sinos com parciais inarmônicas nas entradas de cena e nas frases-oração, sopro de ar nas transições, reverberação de igreja, música abaixada cerca de 9 dB sob a voz.

# Episódio 1, O Sinal da Cruz: storyboard

Formato 9:16 (1080 x 1920), 24 fps, estilo Crayon do AniDoodle (`balloon.ts`: giz de cera em papel com textura, preenchimento em rabisco de vai e vem que pula os vales do papel, contorno grosso passado duas vezes). Duração medida pela narração: 1779 quadros, 74,1 s. Os tempos abaixo vêm de `narrate.mjs time` e mudam se alguma fala mudar.

A ideia do filme em uma frase: a criança vê o padre começar a Missa com o sinal da cruz e aprende a fazê-lo com a mão, gesto por gesto. O elemento que volta é um traço amarelo de giz de cera que desenha a cruz seguindo a mão da Menina, na cena 5 e de novo na cena 10.

Vozes: narradora `pf_dora` (velocidade 0,85; na oração final, 0,75), padre `pm_alex` (0,85 no sinal da cruz, 0,82 na saudação). Legendas queimadas em frases curtas (máximo de 22 caracteres por linha em 9:16), na faixa inferior e fora das zonas de interface do celular.

## Cenas

| # | Quadros (tempo) | Falas | Imagem |
|---|---|---|---|
| 1 | 0 a 119 (0,0 a 5,0 s) | abertura | Interior de uma igreja em giz de cera, luz quente pelas janelas. O livro mascote abre as páginas no banco; a Menina, ao lado, olha para quem assiste. O título "O Sinal da Cruz" se escreve em letras de giz no alto, nos primeiros 2 s. |
| 2 | 120 a 279 (5,0 a 11,6 s) | entrada, altar | Plano geral da nave. Notas musicais de giz flutuam sobre o povo que canta. Em "o padre" (q. 200) a câmera acompanha a entrada: Leo, de veste de coroinha, à frente; o padre atrás. Chegam ao altar no fim da fala. |
| 3 | 280 a 429 (11,7 a 17,9 s) | padre_sinal, amem | Plano médio do padre diante do altar, fazendo o sinal da cruz enquanto fala. Em "Amém!" (q. 365) corte para os bancos: a Menina e as pessoas respondem juntas. |
| 4 | 430 a 534 (17,9 a 22,3 s) | todos | A Menina e Leo, lado a lado, começam o gesto. |
| 5 | 535 a 877 (22,3 a 36,5 s) | testa, peito, ombros | Close da Menina, de frente. A mão toca a testa na palavra "Pai", desce ao peito em "Filho", vai ao ombro esquerdo em "esquerdo" e ao direito em "direito". O traço amarelo de giz segue a mão e deixa a cruz desenhada. De frente, o ombro esquerdo dela aparece à direita da tela: o desenho respeita isso. |
| 6 | 878 a 1004 (36,6 a 41,8 s) | um_deus, tres | A cruz amarela fica no quadro; as palavras "Pai", "Filho" e "Espírito Santo" se escrevem em giz quando são ditas, dentro de um único contorno que se fecha em "Santo". |
| 7 | 1005 a 1105 (41,9 a 46,0 s) | sentido_amem | O livro mascote abre uma página onde se escreve "Amém = assim seja". |
| 8 | 1106 a 1396 (46,1 a 58,2 s) | saudacao, padre_graca | Plano médio do padre no altar. Em "abre os braços" ele abre os braços; segura o gesto durante toda a saudação. |
| 9 | 1397 a 1522 (58,2 a 63,4 s) | desejo | Plano geral da igreja cheia; uma luz de giz amarelo se espalha devagar sobre todos os bancos. |
| 10 | 1523 a 1778 (63,5 a 74,1 s) | convite, convite2, final | A Menina de frente para quem assiste, convidando. Na oração final ela faz o sinal da cruz devagar e o traço amarelo desenha a cruz de novo, terminando em "Amém". Os 30 quadros finais seguram a imagem parada com a cruz. |

## Personagens

Padre, Leo (menino coroinha), Menina e o livro mascote, em proporção normal (não chibi). Os desenhos já feitos deles (`/src/canvas-core/characters/` do projeto de vídeo) não estão neste repositório, então serão redesenhados no estilo Crayon a partir das descrições do README. O nome "Milo" não é dito nem escrito no filme, porque ainda não foi confirmado.

## Pontos de conteúdo para conferir antes de publicar

- A saudação do padre foi escrita de memória: "A graça de Nosso Senhor Jesus Cristo, o amor do Pai e a comunhão do Espírito Santo estejam convosco." A transcrição depende de conferência no Missal Romano, terceira edição típica, tradução da CNBB.
- A resposta do povo à saudação ficou fora de propósito, porque o roteiro não a traz e não a transcrevo de memória.
- "O padre abre os braços" na saudação: conferir na IGMR (o roteiro não diz o gesto).
- "Amém quer dizer: assim seja" é o sentido corrente da palavra; o roteiro não traz essa explicação.
- A ordem do gesto (testa, peito, ombro esquerdo, ombro direito) é a do rito romano; o roteiro não descreve o gesto.
- "Deus é um só, em três Pessoas: Pai, Filho e Espírito Santo" é a única afirmação de doutrina do texto, e não vem do roteiro.

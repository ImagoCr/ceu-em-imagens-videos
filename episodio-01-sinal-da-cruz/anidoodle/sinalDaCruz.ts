// O SINAL DA CRUZ · episódio 1 da série infantil "Partes da Santa Missa" (Céu em Imagens). 9:16, 24 fps.
// Personagens e cenários: imagens geradas pelo usuário no ChatGPT (assets/ep01/prep, preparadas por
// recorte e limpeza do canal alfa), embutidas no filme pelo manifesto. A animação é de recorte: cada
// personagem troca de pose em cima da palavra que a nomeia, com um pequeno "pulo" na troca, e respira
// devagar o tempo todo. A narração marca o relógio (sinalDaCruzVoice.ts, de narrate.mjs bake): cortes no
// tempo da grade antes da fala, poses na palavra (cue). O elemento que volta é uma cruz dourada que se
// desenha no alto da tela quando a Menina faz o sinal da cruz (cena 5) e de novo no fim (cena 10).
import { rng, type Ctx, type Env, type P } from "./core";
import type { Film } from "./film";
import { clamp, lerp } from "./gallery";
import { writeOn, measure } from "./kinetic";
import { filmAudio } from "./music/render";
import { cue, cueEnd, drawSubtitles, phrases, toCaptions } from "./subtitles";
import { narrationAudio, syncMarks } from "./voice";
import { sinalDaCruzVoice as VOICE } from "./sinalDaCruzVoice";
import { sinalDaCruzScore } from "./sinalDaCruzScore";
import META from "../../assets/ep01/prep/meta.json";

const W = 1080, H = 1920, FPS = 24, BPM = 120, BEAT = (60 / BPM) * FPS; // grade de corte: 12 quadros
// early 14: a frase "o amor do Pai" da saudação (fórmula litúrgica, não se reescreve) precisa surgir 13 quadros antes
const T = VOICE.timing, EVENTS = phrases(T, { shape: "9x16", early: 14 });
const N = Math.ceil(T.totalFrames / BEAT) * BEAT;

// ---------------------------------------------------------------- tempo
const ease = (t: number) => { const c = clamp(t); return c * c * (3 - 2 * c); };
const span = (f: number, a: number, b: number) => ease((f - a) / Math.max(1, b - a));
const C = (k: string) => cue(T, k), CE = (k: string) => cueEnd(T, k);
const lineStart = (id: string) => T.lines.find((l) => l.id === id)!.start;
const lineEnd = (id: string) => T.lines.find((l) => l.id === id)!.end;
const cutBefore = (id: string, prev?: string) => {
  const s = lineStart(id), lo = prev ? lineEnd(prev) : 0, k = Math.floor(s / BEAT) * BEAT;
  return k >= lo ? k : Math.min(Math.ceil(lo / BEAT) * BEAT, Math.ceil(s / BEAT) * BEAT);
};
const CUT = {
  procissao: cutBefore("entrada", "abertura"), padre: cutBefore("padre_sinal", "altar"), povo: Math.floor(C("amem:amém") / BEAT) * BEAT,
  todos: cutBefore("todos", "amem"), gesto: cutBefore("testa", "todos"), deus: cutBefore("um_deus", "ombros"), livro: cutBefore("sentido_amem", "tres"),
  saudacao: cutBefore("saudacao", "sentido_amem"), nos: cutBefore("desejo", "padre_graca"), convite: cutBefore("convite", "desejo"),
};

// ---------------------------------------------------------------- as imagens
type Name = keyof typeof META;
const FIGS = Object.keys(META) as Name[];
const BGS = ["cenario_igreja", "cenario_parede_altar", "cenario_vitral"] as const;
const IMAGES: Record<string, string> = {
  ...Object.fromEntries(FIGS.map((n) => [n, `assets/ep01/prep/${n}.png`])),
  ...Object.fromEntries(BGS.map((n) => [n, `assets/ep01/prep/${n}.jpg`])),
};
// zoom: aproximação lenta da câmera em torno de (zx, zy), 1 = enquadramento inteiro
const bg = (ctx: Ctx, env: Env, name: (typeof BGS)[number], zoom = 1, zx = 540, zy = 960) => {
  const im = env.image?.(name), s = env.scale * zoom; ctx.setTransform(s, 0, 0, s, env.scale * zx * (1 - zoom), env.scale * zy * (1 - zoom));
  if (im) ctx.drawImage(im, 0, 0, W, H); else { ctx.fillStyle = "#f3dfb8"; ctx.fillRect(0, 0, W, H); }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
};
// a altura de referência de cada personagem é a da pose em pé: todas as poses saem no mesmo tamanho de corpo
const REF: Record<string, number> = { menina: META.menina_em_pe.h, padre: META.padre_em_pe.h, leo: META.leo_em_pe.h, livro: META.livro_fechado.h, altar: META.altar_frente.h };
const who = (n: Name) => n.split("_")[0];
// desenha a figura com os pés em (x, footY), o corpo com `height` px; respiração e balanço em torno dos pés
type FigO = { breathe?: number; sway?: number; pop?: number; alpha?: number; f?: number; phase?: number };
const fig = (ctx: Ctx, env: Env, n: Name, x: number, footY: number, height: number, o: FigO = {}) => {
  const im = env.image?.(n); if (!im) return;
  const m = META[n], f = o.f ?? 0, ph = o.phase ?? 0, k = Math.min(1, height / REF[who(n)]);
  const br = 1 - (o.breathe ?? 1) * 0.007 * (0.5 + 0.5 * Math.sin(((f + ph) / 56) * Math.PI * 2));
  const sw = ((o.sway ?? 1) * 0.5 * Math.sin(((f + ph) / 90) * Math.PI * 2) * Math.PI) / 180;
  const pop = o.pop ?? 1, sx = k * pop, sy = k * br * pop;
  const s = env.scale, c = Math.cos(sw), si = Math.sin(sw);
  ctx.setTransform(s * c * sx, s * si * sx, -s * si * sy, s * c * sy, s * x, s * footY);
  ctx.globalAlpha = o.alpha ?? 1; ctx.drawImage(im, -m.foot, -m.h); ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
};
// a pose da vez numa sequência de (quadro, nome), e o "pulo" curto de cada troca
type Seq = [number, Name][];
const poseAt = (seq: Seq, f: number) => { let cur = seq[0], at = -1e9; for (const s of seq) if (f >= s[0]) { cur = s; at = s[0]; } return { n: cur[1], pop: 0.965 + 0.035 * ease((f - at) / 6) }; };

// ---------------------------------------------------------------- o que é vivo
const motes = (ctx: Ctx, env: Env, f: number, seed: number, area: [number, number, number, number], n = 40) => {
  const r = rng(seed); ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0);
  for (let i = 0; i < n; i++) {
    const x0 = area[0] + r() * (area[2] - area[0]), y0 = area[1] + r() * (area[3] - area[1]), sp = 0.6 + r() * 0.8, ph = r() * 6.28, rad = 3 + r() * 4;
    const x = x0 + Math.sin(f / 40 + ph) * 18, hh = area[3] - area[1], y = area[1] + (((y0 - area[1] - f * sp) % hh) + hh) % hh;
    ctx.globalAlpha = 0.4 + 0.4 * Math.sin(f / 18 + ph) ** 2; ctx.fillStyle = "#ffe08a"; ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
};
// notas musicais no traço das imagens: contorno escuro, cor chapada
const notes = (ctx: Ctx, env: Env, f: number, from: number, to: number) => {
  const a = span(f, from - 6, from + 10) * (1 - span(f, to, to + 30)); if (a <= 0) return;
  const r = rng(55); ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0); ctx.lineJoin = "round"; ctx.lineCap = "round";
  for (let i = 0; i < 7; i++) {
    const x = 120 + r() * 840, y0 = 1250 + r() * 380, ph = r() * 6, life = (f - from + i * 9) / 60, y = y0 - life * 90, xx = x + Math.sin(life * 3 + ph) * 22;
    const col = ["#8d4fc7", "#2f7de1", "#e5392d", "#3dae49"][i % 4];
    ctx.globalAlpha = 0.95 * a; ctx.strokeStyle = "#3a2418"; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(xx + 17, y); ctx.lineTo(xx + 17, y - 56); if (i % 2) ctx.quadraticCurveTo(xx + 40, y - 46, xx + 34, y - 26); ctx.stroke();
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(xx + 4, y + 2, 17, 12, -0.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  ctx.globalAlpha = 1;
};
// a cruz dourada: a haste desce (Pai, Filho); a travessa vai da direita para a esquerda de quem olha,
// porque o ombro esquerdo da Menina, tocado primeiro, fica à direita de quem olha
const goldCross = (ctx: Ctx, env: Env, v: number, h: number, cx = 540, top = 190, alpha = 1) => {
  if (v <= 0 && h <= 0) return;
  ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0); ctx.globalAlpha = alpha; ctx.lineCap = "round";
  const len = 280, armY = top + 92, arm = 110, bar = (x0: number, y0: number, x1: number, y1: number) => {
    for (const [w, col] of [[58, "rgba(255,214,90,0.25)"], [34, "#3a2418"], [24, "#f5c242"], [8, "#ffe9a3"]] as [number, string][]) {
      ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    }
  };
  const halo = ctx.createRadialGradient(cx, top + 120, 10, cx, top + 120, 230);
  halo.addColorStop(0, "rgba(255,250,232,0.95)"); halo.addColorStop(0.7, "rgba(255,246,220,0.75)"); halo.addColorStop(1, "rgba(255,246,220,0)");
  ctx.globalAlpha = alpha * Math.max(v, h) ; ctx.fillStyle = halo; ctx.fillRect(cx - 240, top - 120, 480, 480); ctx.globalAlpha = alpha;
  if (v > 0) bar(cx, top, cx, top + len * v);
  if (h > 0) bar(cx + arm, armY, cx + arm - 2 * arm * h, armY);
  ctx.globalAlpha = 1;
};
// letras desenhadas, com o acento agudo feito à mão (o traçado das letras não tem acentos)
const ACC: Record<string, string> = { "É": "E", "Í": "I", "Á": "A", "Ó": "O", "Ú": "U" };
const letters = (ctx: Ctx, env: Env, text: string, cx: number, y: number, size: number, p: number, color: string, seed: number) => {
  const plain = [...text].map((c) => ACC[c] ?? c).join(""), w = measure(plain, size), x = cx - w / 2;
  // contorno escuro grosso por baixo, a cor por cima: lê em cima de qualquer cenário
  writeOn(ctx, env, plain, x, y, size, p, "marker", { seed, color: "#3a2418", weight: 2.5 });
  writeOn(ctx, env, plain, x, y, size, p, "marker", { seed, color, weight: 1.5 });
  if (p <= 0.5) return;
  ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0);
  const q = span(p, 0.5, 1);
  [...text].forEach((c, i) => {
    if (!ACC[c]) return;
    const lx = x + measure(plain.slice(0, i), size) + (i ? size * 0.12 : 0), lw = measure(ACC[c], size) - size * 0.12, ax = lx + lw * 0.55, top = y - size * 1.08;
    const a: P = [ax - size * 0.08, top], b: P = [ax + size * 0.12, top - size * 0.3];
    ctx.lineCap = "round";
    for (const [w, col] of [[size * 0.2, "#3a2418"], [size * 0.12, color]] as [number, string][]) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(lerp(a[0], b[0], q), lerp(a[1], b[1], q)); ctx.stroke(); }
  });
};
const plate = (ctx: Ctx, env: Env, x0: number, y0: number, x1: number, y1: number, a: number) => {
  if (a <= 0) return;
  ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0); ctx.globalAlpha = a;
  ctx.fillStyle = "rgba(255,248,232,0.9)"; ctx.strokeStyle = "#c9953a"; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.roundRect(x0, y0, x1 - x0, y1 - y0, 36); ctx.fill(); ctx.stroke(); ctx.globalAlpha = 1;
};
const subs = (ctx: Ctx, env: Env, f: number, home: [number, number] = [0.5, 0.71]) => drawSubtitles(ctx, env, f, EVENTS, { highlight: true, accent: "#FFD84D", home });

// ---------------------------------------------------------------- as cenas
const GIRL_H = 1350, GIRL_FOOT = 1890;

// 1 · abertura: a Menina e o livro; o título se escreve; em "Vem comigo" ela convida
const sc1 = (ctx: Ctx, local: number, env: Env) => {
  const f = local; bg(ctx, env, "cenario_vitral");
  motes(ctx, env, f, 11, [0, 300, 1080, 1500]);
  const enter = span(f, 0, 14), vem = C("abertura:vem");
  const g = poseAt([[0, "menina_em_pe"], [vem - 2, "menina_convidando"]], f);
  fig(ctx, env, g.n, 400 - (1 - enter) * 500, GIRL_FOOT, 1230, { f, pop: g.pop });
  const hop = Math.abs(Math.sin(f / 7)) * 18 * span(f, C("abertura:missa") - 4, C("abertura:missa") + 4);
  fig(ctx, env, "livro_fechado", 850 + (1 - enter) * 400, GIRL_FOOT - hop, 520, { f, phase: 30 });
  plate(ctx, env, 110, 280, 970, 615, span(f, 0, 10));
  letters(ctx, env, "O SINAL", W / 2, 420, 116, span(f, 2, 30), "#c62b22", 21);
  letters(ctx, env, "DA CRUZ", W / 2, 565, 116, span(f, 22, 50), "#2f6fc0", 23);
  subs(ctx, env, f);
};

// 2 · a procissão: Leo à frente, o padre atrás, subindo o corredor até o altar
const sc2 = (ctx: Ctx, local: number, env: Env) => {
  const f = local + CUT.procissao; bg(ctx, env, "cenario_igreja");
  motes(ctx, env, f, 18, [0, 200, 1080, 1100], 30);
  notes(ctx, env, f, lineStart("entrada"), lineEnd("entrada"));
  const a0 = CUT.procissao, a1 = CUT.padre - 6;
  const walk = (n: Name, start: number, end: number, x0: number, x1: number, yEnd: number, ph: number) => {
    const t = span(f, start, end), y = lerp(2050, yEnd, t), hgt = lerp(1250, 330, Math.pow(t, 0.75)), mv = t > 0 && t < 1 ? 1 : 0;
    const bob = Math.abs(Math.sin((f + ph) / 5)) * 12 * (hgt / 1250) * mv;
    fig(ctx, env, n, lerp(x0, x1, t), y - bob, hgt, { f, phase: ph, sway: 2.5 * mv + 0.5 });
  };
  walk("padre_costas", a0 + 30, a1, 640, 560, 1085, 3);
  walk("leo_costas", a0 - 8, a1 - 30, 430, 450, 1075, 0);
  subs(ctx, env, f);
};

// o padre atrás do altar (cenas 3a e 8)
const padre = (ctx: Ctx, env: Env, f: number, n: Name, pop: number) => {
  bg(ctx, env, "cenario_parede_altar");
  motes(ctx, env, f, 31, [0, 300, 700, 1300], 30);
  fig(ctx, env, n, 545, 1830, 1380, { f, pop, phase: 9 });
  fig(ctx, env, "altar_frente", 540, 1900, 700, { f, breathe: 0, sway: 0 });
};
const sc3a = (ctx: Ctx, local: number, env: Env) => {
  const f = local + CUT.padre;
  const p = poseAt([[0, "padre_em_pe"], [C("padre_sinal:pai,") - 2, "padre_testa"], [C("padre_sinal:filho,") - 2, "padre_peito"], [C("padre_sinal:espírito") - 2, "padre_ombro_esquerdo"], [C("padre_sinal:santo.") - 2, "padre_ombro_direito"], [CE("padre_sinal:santo.") + 6, "padre_em_pe"]], f);
  padre(ctx, env, f, p.n, p.pop);
  subs(ctx, env, f);
};

// 3b · "Amém!": a Menina responde de mãos postas, com um pulinho
const sc3b = (ctx: Ctx, local: number, env: Env) => {
  const f = local + CUT.povo; bg(ctx, env, "cenario_vitral");
  motes(ctx, env, f, 12, [0, 300, 1080, 1500]);
  const am = C("amem:amém"), hop = Math.max(0, Math.sin(clamp((f - am) / 10) * Math.PI)) * 30;
  fig(ctx, env, "menina_rezando", 540, GIRL_FOOT - hop, GIRL_H, { f });
  subs(ctx, env, f);
};

// 4 · a Menina e Leo, lado a lado, começam o gesto
const sc4 = (ctx: Ctx, local: number, env: Env) => {
  const f = local + CUT.todos; bg(ctx, env, "cenario_vitral");
  motes(ctx, env, f, 13, [0, 200, 1080, 1300]);
  const at = C("todos:sinal");
  const l = poseAt([[0, "leo_em_pe"], [at, "leo_testa"]], f), g = poseAt([[0, "menina_em_pe"], [at + 3, "menina_testa"]], f);
  fig(ctx, env, l.n, 770, 1880, 1060, { f, pop: l.pop, phase: 31 });
  fig(ctx, env, g.n, 330, 1890, 1000, { f, pop: g.pop });
  subs(ctx, env, f);
};

// 5 · o gesto, parte por parte, e a cruz dourada se desenhando no alto
const gestoSeq = (k: { pai: number; filho: number; esq: number; dir: number; fim: number }, start: Name, end: Name): Seq => [
  [-1e9, start], [k.pai - 2, "menina_testa"], [k.filho - 2, "menina_peito"], [k.esq - 2, "menina_ombro_esquerdo"], [k.dir - 2, "menina_ombro_direito"], [k.fim, end],
];
const sc5 = (ctx: Ctx, local: number, env: Env) => {
  const f = local + CUT.gesto; bg(ctx, env, "cenario_vitral");
  motes(ctx, env, f, 14, [0, 150, 1080, 1300]);
  const k = { pai: C("testa:pai."), filho: C("peito:filho."), esq: C("ombros:esquerdo"), dir: C("ombros:direito,"), fim: CE("ombros:santo.") + 4 };
  const g = poseAt(gestoSeq(k, "menina_em_pe", "menina_rezando"), f);
  fig(ctx, env, g.n, 540, GIRL_FOOT, GIRL_H, { f, pop: g.pop });
  goldCross(ctx, env, span(f, k.pai, k.filho + 6), span(f, k.esq, k.dir + 6));
  subs(ctx, env, f);
};

// 6 · um só Deus em três Pessoas: os três nomes se escrevem e um contorno os une
const sc6 = (ctx: Ctx, local: number, env: Env) => {
  const f = local + CUT.deus; bg(ctx, env, "cenario_vitral");
  motes(ctx, env, f, 15, [0, 150, 1080, 1300]);
  fig(ctx, env, "menina_rezando", 540, GIRL_FOOT, GIRL_H, { f });
  const pai = C("tres:pai,"), filho = C("tres:filho"), es = C("tres:espírito"), santo = C("tres:santo.");
  plate(ctx, env, 80, 270, 1000, 520, span(f, pai - 8, pai));
  letters(ctx, env, "PAI", 360, 385, 84, span(f, pai - 2, pai + 12), "#c62b22", 31);
  letters(ctx, env, "FILHO", 720, 385, 84, span(f, filho - 2, filho + 14), "#2f6fc0", 33);
  letters(ctx, env, "ESPÍRITO SANTO", W / 2, 478, 64, span(f, es - 2, santo + 10), "#2c8a3f", 35);
  // em "Santo", a borda da placa acende em dourado: um só Deus nos três nomes
  const c = span(f, santo, santo + 12) * (1 - 0.35 * span(f, santo + 30, santo + 60));
  if (c > 0) {
    ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0); ctx.globalAlpha = c;
    for (const [w, col] of [[26, "rgba(255,214,90,0.35)"], [12, "#f5c242"]] as [number, string][]) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.roundRect(80, 270, 920, 250, 36); ctx.stroke(); }
    ctx.globalAlpha = 1;
  }
  subs(ctx, env, f);
};

// 7 · o livro abre: AMÉM = ASSIM SEJA
const sc7 = (ctx: Ctx, local: number, env: Env) => {
  const f = local + CUT.livro; bg(ctx, env, "cenario_vitral");
  motes(ctx, env, f, 16, [0, 150, 1080, 1300]);
  const b = poseAt([[0, "livro_fechado"], [CUT.livro + 10, "livro_aberto"]], f);
  fig(ctx, env, b.n, 540, 1620, b.n === "livro_aberto" ? 920 : 960, { f, pop: b.pop });
  const as = C("sentido_amem:quer#2") + 4; // "Quer dizer: assim seja": o letreiro entra em "Quer dizer", para dar tempo de ler antes do corte
  plate(ctx, env, 80, 285, 1000, 645, span(f, CUT.livro, CUT.livro + 8));
  letters(ctx, env, "AMÉM", W / 2, 435, 130, span(f, CUT.livro + 4, CUT.livro + 20), "#c62b22", 41);
  letters(ctx, env, "= ASSIM SEJA", W / 2, 590, 76, span(f, as - 6, as + 22), "#2f6fc0", 45);
  subs(ctx, env, f, [0.5, 0.88]);
};

// 8 · o padre abre os braços e saúda
const sc8 = (ctx: Ctx, local: number, env: Env) => {
  const f = local + CUT.saudacao;
  const p = poseAt([[0, "padre_em_pe"], [C("saudacao:abre"), "padre_bracos_abertos"]], f);
  padre(ctx, env, f, p.n, p.pop);
  subs(ctx, env, f);
};

// 9 · a igreja inteira; uma luz dourada se espalha devagar a partir do altar
const sc9 = (ctx: Ctx, local: number, env: Env) => {
  const f = local + CUT.nos; bg(ctx, env, "cenario_igreja", 1 + 0.06 * ((f - CUT.nos) / Math.max(1, CUT.convite - CUT.nos)), 540, 820);
  motes(ctx, env, f, 19, [0, 300, 1080, 1900], 50);
  const r = span(f, lineStart("desejo"), lineEnd("desejo") + 10);
  if (r > 0) {
    ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0);
    const g = ctx.createRadialGradient(540, 820, 10, 540, 820, 80 + r * 1300);
    g.addColorStop(0, "rgba(255,226,122,0.55)"); g.addColorStop(0.6, "rgba(255,226,122,0.28)"); g.addColorStop(1, "rgba(255,226,122,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  subs(ctx, env, f);
};

// 10 · a vez de quem assiste: o convite, e o sinal da cruz devagar, com a cruz dourada de novo
const sc10 = (ctx: Ctx, local: number, env: Env) => {
  const f = local + CUT.convite; bg(ctx, env, "cenario_vitral");
  motes(ctx, env, f, 17, [0, 150, 1080, 1300]);
  const k = { pai: C("final:pai,"), filho: C("final:filho,"), esq: C("final:espírito"), dir: C("final:santo."), fim: C("final:amém.") };
  const seq: Seq = [[-1e9, "menina_em_pe"], [C("convite:agora") - 2, "menina_convidando"], ...gestoSeq(k, "menina_convidando", "menina_rezando").slice(1)];
  const g = poseAt(seq, f);
  fig(ctx, env, g.n, 540, GIRL_FOOT, GIRL_H, { f, pop: g.pop });
  goldCross(ctx, env, span(f, k.pai, k.filho + 6), span(f, k.esq, k.dir + 6));
  subs(ctx, env, f);
};

export const sinalDaCruz: Film = {
  meta: {
    title: "O Sinal da Cruz", W, H, fps: FPS, bpm: BPM, durationFrames: N, raster: "cpu", kind: "story",
    poster: C("ombros:direito,") + 12, captions: toCaptions(EVENTS, FPS), sync: syncMarks(T),
    score: { tempo: 112, form: "caixinha de música, 34 compassos: melodia, +baixo, +arpejo, +brilho, sino" },
  },
  assets: { images: IMAGES },
  shots: [
    { id: "abertura", start: 0, end: CUT.procissao, draw: sc1 },
    { id: "procissao", start: CUT.procissao, end: CUT.padre, draw: sc2 },
    { id: "padre", start: CUT.padre, end: CUT.povo, draw: sc3a },
    { id: "povo", start: CUT.povo, end: CUT.todos, draw: sc3b },
    { id: "todos", start: CUT.todos, end: CUT.gesto, draw: sc4 },
    { id: "gesto", start: CUT.gesto, end: CUT.deus, draw: sc5 },
    { id: "deus", start: CUT.deus, end: CUT.livro, draw: sc6 },
    { id: "livro", start: CUT.livro, end: CUT.saudacao, draw: sc7 },
    { id: "saudacao", start: CUT.saudacao, end: CUT.nos, draw: sc8 },
    { id: "todos_nos", start: CUT.nos, end: CUT.convite, draw: sc9 },
    { id: "convite", start: CUT.convite, end: N, draw: sc10 },
  ],
  audio: narrationAudio({ voice: VOICE, music: filmAudio(sinalDaCruzScore(), N / FPS), frames: N, musicDb: -14, depthDb: -6, ceilingDb: -2 }),
};

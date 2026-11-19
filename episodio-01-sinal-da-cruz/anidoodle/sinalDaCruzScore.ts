// O SINAL DA CRUZ · trilha. Caixinha de música em Fá maior, 12/8 a 112 (semínima pontuada), 34 compassos.
// Arco sem pads (melodia, +baixo, +arpejo, +brilho, sino). Frases de 4 compassos em pares: a pergunta para fora da tônica
// (dominante, compasso 4), a resposta pousa no Fá (compasso 8). Fica baixa por baixo da narração.
import { line, type Note, type Piece } from "./music/plan";

const B = 4; // 12/8: quatro tempos (semínimas pontuadas) por compasso, colcheia de tercina = 1/3
const L = (start: number, src: string, role: Note["role"], v: number) => line(start, src, { role, v, bpb: B });

// harmonia, um acorde por compasso (dois nos compassos de cadência)
const AH = (b: number): [number, string][] => [[b, "F"], [b + 4, "Dm"], [b + 8, "Bb"], [b + 12, "C"], [b + 16, "F"], [b + 20, "Dm"], [b + 24, "Bb"], [b + 26, "C"], [b + 28, "F"]];
const BH = (b: number): [number, string][] => [[b, "Bb"], [b + 4, "F"], [b + 8, "Gm"], [b + 12, "C"], [b + 16, "Bb"], [b + 20, "F"], [b + 24, "Gm"], [b + 26, "C"], [b + 28, "F"]];
const CHORDS: [number, string][] = [...AH(0), ...BH(32), ...AH(64), ...BH(96), [128, "F"], [132, "F"]];
const TONES: Record<string, [string, string, string]> = { F: ["F5", "A5", "C6"], Dm: ["D5", "F5", "A5"], Bb: ["D5", "F5", "Bb5"], C: ["E5", "G5", "C6"], Gm: ["D5", "G5", "Bb5"] };

const A1 = "C6:2/3 A5:1/3 F5:2/3 G5:1/3 A5:2 | F5:1/3 E5:1/3 D5:1/3 F5:1 A5:1/3 G5:1/3 F5:1/3 D5:1 | D5:2/3 F5:1/3 Bb5:2/3 A5:1/3 Bb5:1 D6:1 | C6:1 Bb5:1/3 A5:1/3 G5:1/3 E5:2";
const A2 = "C6:2/3 A5:1/3 F5:2/3 G5:1/3 A5:2 | F5:1/3 E5:1/3 D5:1/3 F5:1 A5:1/3 Bb5:1/3 A5:1/3 F5:1 | D6:2/3 C6:1/3 Bb5:1 G5:2/3 E5:1/3 G5:1 | F5:3 r:1";
const B1 = "Bb5:1 D6:1/3 C6:1/3 Bb5:1/3 F5:2 | A5:2/3 C6:1/3 F5:1 A5:2 | G5:1/3 A5:1/3 Bb5:1/3 D6:1 Bb5:1/3 A5:1/3 G5:1/3 D5:1 | E5:2/3 G5:1/3 C6:1 Bb5:2";
const B2 = "Bb5:1 D6:1/3 C6:1/3 Bb5:1/3 F5:2 | A5:2/3 C6:1/3 F5:1 C6:2 | Bb5:2/3 G5:1/3 D6:1 C6:2/3 E5:1/3 G5:1 | F5:3 r:1";
// a segunda vez do B sobe: o ponto mais alto (Lá6) chega nos compassos 29 e 30, perto de 85 % da peça
const B3 = "D6:1 F6:1/3 E6:1/3 D6:1/3 Bb5:2 | C6:2/3 F6:1/3 A5:1 C6:2 | Bb5:1/3 C6:1/3 D6:1/3 G6:1 F6:1/3 E6:1/3 D6:1/3 Bb5:1 | C6:2/3 E6:1/3 G6:1 E6:2";
const B4 = "F6:1 A6:1/3 G6:1/3 F6:1/3 D6:2 | C6:2/3 F6:1/3 A6:1 F6:2 | G6:2/3 D6:1/3 Bb5:1 E6:2/3 C6:1/3 G5:1 | A5:1 F5:2 r:1";
const A3 = "C6:2/3 A5:1/3 G5:2/3 E5:1/3 F5:2 | r:4";

// arpejo embalado (longa-curta em cada tempo), um compasso por acorde
const arpBar = (ch: string) => { const [r, t, f] = TONES[ch]; return `${r}:2/3 ${t}:1/3 ${f}:2/3 ${t}:1/3 ${r}:2/3 ${f}:1/3 ${t}:2/3 ${f}:1/3`; };
const arpHalf = (a: string, b: string) => { const x = arpBar(a).split(" ").slice(0, 4), y = arpBar(b).split(" ").slice(0, 4); return [...x, ...y].join(" "); };

const ARP_A = () => [arpBar("F"), arpBar("Dm"), arpBar("Bb"), arpBar("C"), arpBar("F"), arpBar("Dm"), arpHalf("Bb", "C"), "F5:2/3 A5:1/3 C6:1 r:2"];
const ARP_B = () => [arpBar("Bb"), arpBar("F"), arpBar("Gm"), arpBar("C"), arpBar("Bb"), arpBar("F"), arpHalf("Gm", "C"), "F5:2/3 A5:1/3 C6:1 r:2"];
const BASS_A2 = "F4:2 C4:2 | D4:2 F4:2 | Bb3:2 C4:2 | F4:2 r:2", BASS_A1 = "F4:2 C4:2 | D4:2 F4:2 | Bb3:2 F4:2 | C4:2 G3:2";
const BASS_B = "Bb3:2 F4:2 | F4:2 C4:2 | G3:2 D4:2 | C4:2 G3:2 | Bb3:2 F4:2 | F4:2 C4:2 | G3:2 C4:2 | F4:2 r:2";

// 34 compassos a 112: A A' B B' A A' B B' e o fecho. Compassos 1-4 só a melodia; 5 entra o baixo;
// 9 o arpejo; 25 o brilho; 34 o sino na tônica, com o resto do compasso e a cauda soando depois dele.
export const sinalDaCruzScore = (): Piece => {
  const melody = L(0, [A1, A2, B1, B2, A1, A2, B3, B4, A3].join(" | "), "melody", 0.7);
  const bass = L(16, [BASS_A2, BASS_B, BASS_A1, BASS_A2, BASS_B, "F4:2 C4:2 | F4:1 r:3"].join(" | "), "bass", 0.55);
  const arp = L(32, [...ARP_B(), ...ARP_A(), ...ARP_B(), "F5:2/3 A5:1/3 C6:2/3 A5:1/3 F5:2", "r:4"].join(" | "), "accomp", 0.42);
  const sparkle = L(96, "F6:1 r:3 | C6:1 r:3 | D6:1 r:3 | E6:1 r:3 | F6:1 r:3 | A6:1 r:3 | G6:1 r:3 | F6:1 r:3", "color", 0.3);
  const bell = L(132, "F6:1 r:3", "color", 0.7);
  return {
    title: "O Sinal da Cruz, caixinha de música (Fá maior, 12/8 a 112)", seed: 117, tail: 2.4,
    harmony: CHORDS.map(([t, name]) => ({ t, name })),
    plan: { style: "musicBox", tempo: 112, meter: "12/8", ritard: 0.9, sections: [{ id: "a", bars: 34, mood: "joy", key: "F", mode: "major", melody: ["hook", "arpeggio"], dyn: [0.5, 0.62], ending: "button" }] },
    parts: [
      { id: "melody", inst: "musicBox", role: "melody", notes: melody, opts: { grid: true } },
      { id: "arp", inst: "musicBox", role: "accomp", notes: arp, gainDb: -12, opts: { grid: true } },
      { id: "bass", inst: "musicBox", role: "bass", notes: bass, gainDb: -8, opts: { grid: true } },
      { id: "sparkle", inst: "musicBox", role: "color", notes: sparkle, gainDb: -7, opts: { grid: true } },
      { id: "bell", inst: "bell", role: "color", notes: bell, gainDb: -3 },
    ],
  };
};

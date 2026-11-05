// Repertorio de arranque: riffs propios y melodías de dominio público. Las canciones con derechos
// entran por "Pega tu tab" (fuente del usuario), no vienen precargadas.

import type { SongInput } from './schema';

/** Arma un sistema de 6 líneas; las cuerdas sin notas se rellenan con compases vacíos de 16 subdivisiones. */
const sys = (bars: number, rows: Partial<Record<'e' | 'B' | 'G' | 'D' | 'A' | 'E', string>>) =>
  (['e', 'B', 'G', 'D', 'A', 'E'] as const)
    .map((k) => `${k}|${rows[k] ?? '----------------|'.repeat(bars)}`)
    .join('\n');

export const SEEDS: SongInput[] = [
  {
    type: 'song',
    id: 'riff-001',
    title: 'Riff 001 · Mi menor',
    artist: 'DailyRiffs',
    source: 'original',
    confidence: 'alta',
    level: 1,
    meta: { key: 'Em', bpm: 90, time: '4/4' },
    cover: { pattern: 'sun', disc: 'vinyl' },
    blocks: [
      {
        type: 'tab',
        id: 'riff',
        title: 'Riff con palm mute',
        label: 'original',
        stepsPerBeat: 4,
        raw: `PM - - - - - - -
${sys(2, {
  A: '2-2-2-2-5---7---|2-2-2-2-7---5---|',
  E: '0-0-0-0-3---5---|0-0-0-0-5---3---|',
})}`,
      },
      { type: 'gear', pickup: 1, amp: { mode: 'od', gain: 7, volume: 3.5, treble: 6, bass: 4 }, note: 'Palma del lado del puente: que suene seco, no apagado.' },
    ],
    checkpoint: { action: 'Toca el riff 4 veces seguidas sin parar.', success_criteria: '4 vueltas limpias a 90 BPM', bpm: 90 },
  },
  {
    type: 'song',
    id: 'oda-alegria',
    title: 'Oda a la alegría',
    artist: 'L. van Beethoven',
    version: 'Melodía, posición abierta',
    source: 'dominio-publico',
    confidence: 'alta',
    level: 1,
    meta: { key: 'C', bpm: 90, time: '4/4' },
    cover: { pattern: 'rings', disc: 'cd' },
    blocks: [
      {
        type: 'tab',
        id: 'melodia',
        title: 'Melodía en cuerdas 1 y 2',
        label: 'original',
        stepsPerBeat: 4,
        raw: `${sys(4, {
  e: '0---0---1---3---|3---1---0-------|------------0---|0---------------|',
  B: '----------------|------------3---|1---1---3-------|------3-3-------|',
})}

${sys(4, {
  e: '0---0---1---3---|3---1---0-------|------------0---|----------------|',
  B: '----------------|------------3---|1---1---3-------|3-----1-1-------|',
})}`,
      },
      { type: 'chart', id: 'acomp', title: 'Acompañamiento', strum: 'negras', raw: '[Frase A]\n| C | G | C | G C |\n[Frase B]\n| C | G | C | G C |' },
      { type: 'gear', pickup: 4, amp: { mode: 'clean', gain: 4, volume: 3.5, treble: 5, bass: 4 } },
    ],
    checkpoint: { action: 'Toca la melodía completa con el metrónomo.', success_criteria: 'Sin pausas entre frases a 90 BPM', bpm: 90 },
  },
  {
    type: 'song',
    id: 'cambios-g-c-d',
    title: 'Cambios G–C–D',
    artist: 'DailyRiffs',
    source: 'original',
    confidence: 'alta',
    level: 1,
    meta: { key: 'G', bpm: 70, time: '4/4' },
    cover: { pattern: 'grid', disc: 'color' },
    blocks: [
      { type: 'chart', id: 'progresion', title: 'Progresión I–IV–V', strum: 'negras', raw: '[Verso] x2\n| G | C | G | D |\n[Coro]\n| C | D | G | G |' },
      { type: 'gear', pickup: 3, amp: { mode: 'clean', gain: 4, volume: 3.5, treble: 5, bass: 4 } },
    ],
    checkpoint: { action: 'Cambia G→C→D sin dejar de rasguear.', success_criteria: '20 cambios por minuto', bpm: 70 },
  },
];

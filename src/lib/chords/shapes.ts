// Formas de acorde para cifrados. Validadas contra tonal en chords.test.ts.
// frets: grave (6ª) → aguda (1ª); 'x' = muda, 0 = al aire. fingers: 1 índice … 4 meñique.

import { Chord, Note } from 'tonal';
import { OPEN_HZ } from '../audio/tuner';

export type Fret = number | 'x';
export interface Shape { name: string; frets: Fret[]; fingers: (number | null)[]; baseFret?: number; barre?: { fret: number; from: number; to: number } }

const S = (name: string, f: string, fg: string, extra: Partial<Shape> = {}): Shape => ({
  name,
  frets: f.split('').map((c) => (c === 'x' ? 'x' : parseInt(c, 10))),
  fingers: fg.split('').map((c) => (c === '-' ? null : parseInt(c, 10))),
  ...extra,
});

import library from '../../data/chords.json';

/** Biblioteca del repo (src/data/chords.json, validada con npm run validate) + formas extra para cifrados. */
const fromLibrary: Shape[] = library.chords.map((c) => ({
  name: c.name,
  frets: c.frets.map((f) => (f < 0 ? 'x' : f)),
  fingers: c.fingers.map((f) => (f > 0 ? f : null)),
  baseFret: c.base_fret,
  barre: c.barre ?? undefined,
}));

const EXTRA: Shape[] = [
  S('Dm7', 'xx0211', '---211'),
  S('Fmaj7', 'xx3210', '--321-'),
  S('Asus2', 'x02200', '--12--'),
  S('Esus4', '022200', '-234--'),
  S('E5', '022xxx', '-11---'),
  S('A5', 'x022xx', '--11--'),
  S('D5', 'xx023x', '---13-'),
  S('G5', '355xxx', '134---'),
];

export const SHAPES: Shape[] = [...fromLibrary, ...EXTRA.filter((e) => !fromLibrary.some((l) => l.name === e.name))];

const BY_NAME = new Map(SHAPES.map((s) => [s.name, s]));

/** Normaliza alias comunes ("Amin" → "Am", "Bb" igual, "E-" → "Em"). */
export function normChord(tok: string): string {
  return tok.replace(/^([A-G][#b]?)(min|mi|-)(?![a-z])/, '$1m').replace(/^([A-G][#b]?)M7$/, '$1maj7');
}

export function isChord(tok: string): boolean {
  const t = normChord(tok);
  if (!/^[A-G]/.test(t)) return false;
  const base = t.split('/')[0];
  return !Chord.get(base).empty;
}

export function shapeFor(name: string): Shape | undefined {
  return BY_NAME.get(normChord(name));
}

/** Frecuencias para sonar un acorde: forma de la biblioteca o voicing cerrado desde tonal. */
export function voicingHz(name: string): number[] {
  const sh = shapeFor(name);
  if (sh) {
    return sh.frets.flatMap((f, i) => (f === 'x' ? [] : [OPEN_HZ[5 - i] * Math.pow(2, f / 12)]));
  }
  const n = normChord(name);
  const [base, bass] = n.split('/');
  const notes = Chord.get(base).notes;
  if (!notes.length) return [];
  const out: number[] = [];
  const b = bass ?? notes[0];
  const bassHz = Note.freq(b + '2');
  if (bassHz) out.push(bassHz);
  let oct = 3;
  let last = -1;
  for (const nn of notes) {
    let m = Note.midi(nn + oct) ?? 0;
    if (m <= last) { oct++; m = Note.midi(nn + oct) ?? 0; }
    last = m;
    const f = Note.freq(nn + oct);
    if (f) out.push(f);
  }
  return out;
}

/** Clases de altura que suena una forma (para validar contra la teoría). */
export function shapeChromas(sh: Shape): number[] {
  const open = [4, 9, 2, 7, 11, 4]; // E A D G B E (grave → aguda)
  return [...new Set(sh.frets.flatMap((f, i) => (f === 'x' ? [] : [(open[i] + f) % 12])))].sort((a, b) => a - b);
}

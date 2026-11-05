import type { Lesson, LibraryChord } from './contract';
import chordsData from '@/data/chords.json';
import l001 from '@/data/lessons/001.json';
import l002 from '@/data/lessons/002.json';
import l003 from '@/data/lessons/003.json';
import l004 from '@/data/lessons/004.json';
import l005 from '@/data/lessons/005.json';

export const CHORDS = chordsData.chords as LibraryChord[];
export const LESSONS = [l001, l002, l003, l004, l005] as Lesson[];
export const chordByName = (name: string) => CHORDS.find((c) => c.name === name);
export const lessonById = (id: string) => LESSONS.find((l) => l.id === id);
export const totalMinutes = LESSONS.reduce((s, l) => s + l.estimated_minutes, 0);

/** Contrato (-1 = muda) → ChordDiagram ('x' = muda). */
export const toDiagramFrets = (frets: number[]) => frets.map((f) => (f < 0 ? 'x' : f)) as Array<number | 'x'>;
export const toDiagramFingers = (fingers: number[]) => fingers.map((f) => (f > 0 ? f : null));

/** Texto alternativo: "Am: 5ª al aire; dedo 2 en 4ª traste 2; …" */
export function chordAlt(c: { name: string; frets: number[]; fingers: number[] }) {
  const parts = c.frets.map((f, i) => {
    const s = `${6 - i}ª`;
    if (f < 0) return `${s} muda`;
    if (f === 0) return `${s} al aire`;
    return `dedo ${c.fingers[i]} en ${s} traste ${f}`;
  });
  return `${c.name}: ${parts.join('; ')}`;
}

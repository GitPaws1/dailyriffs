/* Contrato IA ↔ web (ver doc del proyecto). Extensiones de la biblioteca estática: id, channel, summary y `note` por bloque. */
import type { Channel, FretNote } from '@/ds/types';

export interface ChordBlock { type: 'chord'; note?: string; name: string; frets: number[]; fingers: number[]; barre: { fret: number; from: number; to: number } | null; base_fret: number; tips?: string[] }
export interface FretboardBlock { type: 'fretboard'; note?: string; range: [number, number]; highlight: FretNote[]; caption?: string }
export interface TabEvent { beat: number; string: number; fret: number; dur: string }
export interface TabBlock { type: 'tab'; note?: string; tuning: string[]; bpm: number; time: string; bars: { events: TabEvent[] }[]; label: string }
export interface ExerciseBlock { type: 'exercise'; note?: string; goal: string; duration_sec: number; metric: string; target: number; chords?: [string, string]; bpm?: number }
export interface QuizBlock { type: 'quiz'; question: string; options: string[]; answer: number; why: string }
export interface GearBlock { type: 'gear'; note?: string; pickup: string; amp: { mode: 'Clean' | 'O.D.'; gain: number; volume: number; treble: number; bass: number } }
export type Block = ChordBlock | FretboardBlock | TabBlock | ExerciseBlock | QuizBlock | GearBlock;

export interface Lesson {
  id: string; type: 'lesson'; channel: Channel; title: string; summary: string;
  level: 1 | 2 | 3 | 4 | 5; estimated_minutes: number; confidence: 'alta' | 'media' | 'baja';
  text: string; blocks: Block[];
  checkpoint: { action: string; success_criteria: string; bpm: number | null };
}

export interface LibraryChord { name: string; quality: string; group: 'mayor' | 'menor' | 'septima' | 'otro'; frets: number[]; fingers: number[]; barre: ChordBlock['barre']; base_fret: number; tips: string[] }

export const CHANNEL_META: Record<Channel, { code: string; label: string }> = {
  teoria: { code: 'CH-01', label: 'Teoría' },
  tecnica: { code: 'CH-02', label: 'Técnica' },
  repertorio: { code: 'CH-03', label: 'Repertorio' },
  instrumento: { code: 'CH-04', label: 'Instrumento' },
};

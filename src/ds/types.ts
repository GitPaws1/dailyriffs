/* Tipos de los componentes del sistema DailyRiffs (subconjunto de project/components/index.d.ts). */
import type * as React from 'react';

export type Channel = 'teoria' | 'tecnica' | 'repertorio' | 'instrumento';
type C<P> = (props: P & { key?: React.Key }) => React.ReactElement;

export interface FretNote { string: 1 | 2 | 3 | 4 | 5 | 6; fret: number; role?: 'root' | 'tone' | 'blue'; label?: string }
export interface QuizQuestion { q: string; options: string[]; answer: number; explain: string }
export interface AmpControl { id: string; label: string; value: number }

export interface DailyRiffsDS {
  PosterHero: C<{ variant?: 'slab' | 'stack'; rain?: boolean | number; jp?: string; word?: string; kicker?: string; eyebrow?: string; title: React.ReactNode; summary?: string; cta?: string; onCta?: () => void; note?: string; counter?: string; as?: 'h1' | 'h2'; className?: string }>;
  Button: C<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'key'; size?: 'md' | 'sm'; icon?: React.ReactNode; led?: boolean }>;
  ChannelTag: C<{ channel: Channel; jp?: boolean; children?: React.ReactNode; className?: string }>;
  SectionTitle: C<{ title: React.ReactNode; eyebrow?: string; kicker?: string; align?: 'center' | 'left'; size?: 'md' | 'lg'; as?: 'h1' | 'h2' | 'h3'; className?: string }>;
  NavBar: C<{ items?: { channel: Channel; label: string; href?: string }[]; active?: Channel; brand?: string; homeHref?: string; cta?: string | null; onCta?: () => void; className?: string }>;
  LessonCard: C<{ channel: Channel; number: number; title: string; summary?: string; duration?: string; level?: 1 | 2 | 3 | 4 | 5; progress?: number; href?: string; onClick?: () => void; className?: string }>;
  CourseTape: C<{ title: string; tone?: 'void' | 'mustard' | 'orange' | 'sage' | 'paper'; length?: number; side?: 'A' | 'B'; code?: string; lessons?: number; minutes?: number; channels?: Channel[]; href?: string; className?: string }>;
  Meter: C<{ value: number; segments?: number; label?: string; channel?: Channel; compact?: boolean; className?: string }>;
  Readout: C<{ value: string; label?: string; unit?: string; size?: 'md' | 'sm'; live?: boolean; children?: React.ReactNode; className?: string }>;
  Metronome: C<{ grille?: boolean; bpm?: number; min?: number; max?: number; beats?: number; sound?: boolean; onChange?: (bpm: number) => void; className?: string }>;
  Fretboard: C<{ notes?: FretNote[]; frets?: number; title?: string; showNames?: boolean; interactive?: boolean; sound?: boolean; fretWidth?: number; onNote?: (n: { string: number; fret: number; note: string }) => void; className?: string }>;
  ChordDiagram: C<{ name: string; quality?: string; frets: Array<number | 'x'>; fingers?: Array<number | null>; baseFret?: number; barre?: { fret: number; from: number; to: number }; sound?: boolean; className?: string }>;
  TabStaff: C<{ lines: string[]; bpm?: number; loop?: boolean; title?: string; channel?: Channel; legend?: boolean; sound?: boolean; className?: string }>;
  VUTuner: C<{ string?: number; cents?: number; sound?: boolean; className?: string }>;
  QuizConsole: C<{ questions?: QuizQuestion[]; channel?: Channel; model?: string; subtitle?: string; className?: string }>;
  AmpPanel: C<{ controls?: AmpControl[]; model?: string; preset?: string; on?: boolean; onChange?: (values: Record<string, number>) => void; className?: string }>;
  StickyNote: C<{ tone?: 'mustard' | 'orange' | 'sage' | 'paper' | 'teal'; kicker?: string; sign?: string; rotate?: number; children: React.ReactNode; className?: string }>;
  AlbumSleeve: C<{ title: string; coverTitle?: string; artist?: string; keySig?: string; bpm?: number; level?: 1 | 2 | 3 | 4 | 5; pattern?: 'rings' | 'holo' | 'sun' | 'grid' | 'teal'; art?: string; disc?: 'vinyl' | 'cd' | 'color'; discColor?: Channel; code?: string; channel?: Channel; href?: string; className?: string }>;
  SpecSheet: C<{ name: string; kicker?: string; subtitle?: string; specs: Array<[string, string]>; children?: React.ReactNode; className?: string }>;
  pluck: (string: number, fret: number) => void;
  noteName: (string: number, fret: number) => string;
}

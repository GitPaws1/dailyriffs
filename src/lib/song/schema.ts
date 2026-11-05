// Contrato IA/usuario → web. Una canción guarda el texto tal cual (raw) y se parsea al cargar:
// la base de datos conserva la fuente exacta; el render es determinista.

import { z } from 'zod';
import { parseTab } from '../tabtext/parse';
import { parseChart } from '../chords/parse';

export const Level = z.number().int().min(1).max(5);
export const Confidence = z.enum(['alta', 'media', 'baja']);
export const Source = z.enum(['usuario', 'original', 'dominio-publico', 'ia']);
export const TimeSig = z.enum(['4/4', '3/4', '2/4', '6/8', '12/8']);

const Knob = z.number().min(0).max(10);
export const AmpSettings = z.object({ mode: z.enum(['clean', 'od']), gain: Knob, volume: Knob, treble: Knob, bass: Knob });

export const TabBlock = z.object({
  type: z.literal('tab'),
  id: z.string().min(1).max(40),
  title: z.string().max(80).optional(),
  raw: z.string().min(6).max(40000),
  stepsPerBeat: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).default(4),
  label: z.enum(['fuente del usuario', 'original', 'aproximación']).default('fuente del usuario'),
});

export const ChartBlock = z.object({
  type: z.literal('chart'),
  id: z.string().min(1).max(40),
  title: z.string().max(80).optional(),
  raw: z.string().min(1).max(40000),
  strum: z.enum(['negras', 'corcheas', 'ninguno']).default('negras'),
});

export const GearBlock = z.object({
  type: z.literal('gear'),
  pickup: z.number().int().min(1).max(5),
  amp: AmpSettings,
  note: z.string().max(160).optional(),
});

export const Block = z.discriminatedUnion('type', [TabBlock, ChartBlock, GearBlock]);

export const SongSchema = z.object({
  type: z.literal('song'),
  id: z.string().regex(/^[a-z0-9-]{2,64}$/),
  title: z.string().min(1).max(120),
  artist: z.string().max(120).optional(),
  version: z.string().max(60).optional(),
  source: Source,
  confidence: Confidence,
  level: Level,
  meta: z.object({
    key: z.string().max(12).optional(),
    bpm: z.number().int().min(30).max(260),
    time: TimeSig.default('4/4'),
    capo: z.number().int().min(0).max(12).default(0),
    tuning: z.string().max(40).default('E A D G B E'),
  }),
  blocks: z.array(Block).min(1).max(24),
  checkpoint: z.object({ action: z.string().max(200), success_criteria: z.string().max(200), bpm: z.number().int().optional() }).optional(),
  cover: z.object({ pattern: z.enum(['rings', 'holo', 'sun', 'grid', 'teal']), disc: z.enum(['vinyl', 'cd', 'color']) }).optional(),
  createdAt: z.string().optional(),
});

export type Song = z.infer<typeof SongSchema>;
export type SongInput = z.input<typeof SongSchema>;
export type TabBlockT = z.infer<typeof TabBlock>;
export type ChartBlockT = z.infer<typeof ChartBlock>;
export type GearBlockT = z.infer<typeof GearBlock>;

export const beatsPerBar = (time: string) => parseInt(time.split('/')[0], 10) || 4;

export interface Validation { ok: boolean; song?: Song; errors: string[]; warnings: string[] }

/** Esquema + teoría: tabs que se puedan leer, trastes en rango, acordes reconocibles. */
export function validateSong(input: unknown, opts: { maxFret?: number } = {}): Validation {
  const r = SongSchema.safeParse(input);
  if (!r.success) {
    return { ok: false, errors: r.error.issues.map((i) => `${i.path.join('.') || 'canción'}: ${i.message}`), warnings: [] };
  }
  const song = r.data;
  const errors: string[] = [];
  const warnings: string[] = [];
  const bpb = beatsPerBar(song.meta.time);
  for (const b of song.blocks) {
    if (b.type === 'tab') {
      const t = parseTab(b.raw, { maxFret: opts.maxFret ?? 24 });
      if (!t.systems.length) errors.push(`Tab "${b.title ?? b.id}": no se pudo leer.`);
      warnings.push(...t.warnings.map((w) => `Tab "${b.title ?? b.id}": ${w}`));
    } else if (b.type === 'chart') {
      const c = parseChart(b.raw, bpb);
      if (!c.bars) errors.push(`Cifrado "${b.title ?? b.id}": no encontré compases con acordes.`);
      if (c.unknown.length) warnings.push(`Cifrado "${b.title ?? b.id}": no reconozco ${c.unknown.slice(0, 6).join(', ')}.`);
    }
  }
  return { ok: errors.length === 0, song, errors, warnings };
}

export function slugify(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'cancion';
}

/** Llave de caché de canciones: título + artista + versión normalizados. */
export const cacheKey = (title: string, artist = '', version = '') => [title, artist, version].map(slugify).join('::');

// Catálogo de equipo. Lo de Alan va primero y es el estado inicial.

import type { z } from 'zod';
import type { AmpSettings } from '../song/schema';

export type Amp = z.infer<typeof AmpSettings>;

export interface GuitarModel {
  id: string;
  name: string;
  subtitle: string;
  pickups: 'SSS' | 'HSS' | 'HH';
  positions: number;
  specs: Array<[string, string]>;
}

export interface AmpModel {
  id: string;
  name: string;
  subtitle: string;
  hasChannelSwitch: boolean;
  specs: Array<[string, string]>;
}

export const GUITARS: GuitarModel[] = [
  {
    id: 'squier-strat-sss',
    name: 'Stratocaster',
    subtitle: 'Squier · negra, golpeador blanco',
    pickups: 'SSS',
    positions: 5,
    specs: [
      ['Pastillas', '3 single-coil (SSS)'],
      ['Selector', '5 posiciones'],
      ['Controles', '1 volumen + 2 tonos'],
      ['Puente', 'Trémolo con palanca'],
      ['Escala', '25.5″ (648 mm)'],
      ['Trastes', '21–22 según modelo'],
      ['Afinación', 'E A D G B E'],
    ],
  },
  {
    id: 'generic-hss',
    name: 'Strat HSS',
    subtitle: 'Humbucker en el puente',
    pickups: 'HSS',
    positions: 5,
    specs: [['Pastillas', 'H + 2 single-coil'], ['Selector', '5 posiciones'], ['Afinación', 'E A D G B E']],
  },
];

export const AMPS: AmpModel[] = [
  {
    id: 'fender-frontman-10g',
    name: 'Frontman 10G',
    subtitle: 'Fender · 10 W, bocina de 6″',
    hasChannelSwitch: true,
    specs: [
      ['Potencia', '10 W'],
      ['Bocina', '6″'],
      ['Canal', 'Clean / O.D.'],
      ['Controles', 'Gain · Volume · Treble · Bass'],
      ['Entradas', 'Input · Aux In'],
      ['Salida', 'Audífonos'],
    ],
  },
  {
    id: 'generic-1ch',
    name: 'Ampli de práctica',
    subtitle: 'Un canal, sin switch',
    hasChannelSwitch: false,
    specs: [['Canal', 'Único'], ['Controles', 'Gain · Volume · Treble · Bass']],
  },
];

/** Posiciones del selector de 5 de una Strato. */
export const PICKUP_POSITIONS: Array<{ pos: number; short: string; label: string }> = [
  { pos: 1, short: 'P', label: 'Puente' },
  { pos: 2, short: 'P+M', label: 'Puente + media' },
  { pos: 3, short: 'M', label: 'Media' },
  { pos: 4, short: 'M+C', label: 'Media + cuello' },
  { pos: 5, short: 'C', label: 'Cuello' },
];

export interface Preset { id: 'limpio' | 'crunch' | 'rock'; label: string; pickup: number; amp: Amp }

/** Puntos de partida del proyecto para el Frontman 10G. Se afinan de oído. */
export const PRESETS: Preset[] = [
  { id: 'limpio', label: 'Limpio', pickup: 4, amp: { mode: 'clean', gain: 4, volume: 3.5, treble: 5, bass: 4 } },
  { id: 'crunch', label: 'Crunch', pickup: 2, amp: { mode: 'od', gain: 5, volume: 3, treble: 5, bass: 4 } },
  { id: 'rock', label: 'Rock', pickup: 1, amp: { mode: 'od', gain: 7, volume: 3.5, treble: 6, bass: 4 } },
];

export interface Rig { guitarId: string; ampId: string; pickup: number; amp: Amp }

export const DEFAULT_RIG: Rig = {
  guitarId: 'squier-strat-sss',
  ampId: 'fender-frontman-10g',
  pickup: 4,
  amp: { ...PRESETS[0].amp },
};

export const guitarById = (id: string) => GUITARS.find((g) => g.id === id) ?? GUITARS[0];
export const ampById = (id: string) => AMPS.find((a) => a.id === id) ?? AMPS[0];

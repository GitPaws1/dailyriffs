// Agenda determinista en ticks (PPQ de Tone.Transport). Tab, acordes y clic salen del mismo reloj:
// la sincronía no depende de timers del navegador.

import type { TabScore } from '../tabtext/parse';
import { OPEN_HZ } from './tuner';
import { flattenChart, type ChordChart } from '../chords/parse';
import { voicingHz } from '../chords/shapes';

export interface NoteHit { hz: number; string: number; fret: number; legato: boolean; mute: boolean; bendHz?: number }
export interface ScheduledEvent { ticks: number; step: number; notes: NoteHit[] }
export interface ChordHit { ticks: number; bar: number; beat: number; chord: string; hz: number[] }
export interface Schedule { events: ScheduledEvent[]; chords: ChordHit[]; totalTicks: number; bars: number; countInTicks: number }

export interface ScheduleOpts {
  ppq: number;
  beatsPerBar: number;
  stepsPerBeat?: number;
  countIn?: boolean;
  capo?: number;
  strum?: 'negras' | 'corcheas' | 'ninguno';
}

const fhz = (string: number, fret: number, capo: number) => OPEN_HZ[string - 1] * Math.pow(2, (fret + capo) / 12);

export function buildSchedule(tab: TabScore | null, chart: ChordChart | null, o: ScheduleOpts): Schedule {
  const spb = o.stepsPerBeat ?? 4;
  const stepTicks = o.ppq / spb;
  const barTicks = o.ppq * o.beatsPerBar;
  const countInTicks = o.countIn ? barTicks : 0;
  const capo = o.capo ?? 0;

  const events: ScheduledEvent[] = (tab?.events ?? []).map((e) => ({
    ticks: countInTicks + Math.round(e.step * stepTicks),
    step: e.step,
    notes: e.notes.map((n) => ({
      hz: n.fret < 0 ? fhz(n.string, 0, capo) : fhz(n.string, n.fret, capo),
      string: n.string,
      fret: n.fret,
      legato: !!n.legato,
      mute: n.fret < 0,
      bendHz: n.bendTo != null ? fhz(n.string, n.bendTo, capo) : undefined,
    })),
  }));

  const chords: ChordHit[] = [];
  const flat = chart ? flattenChart(chart) : [];
  if (o.strum !== 'ninguno') {
    const per = o.strum === 'corcheas' ? 2 : 1;
    flat.forEach((bar, bi) => {
      bar.slots.forEach((name, beat) => {
        if (!name) return;
        const hz = voicingHz(name).map((f) => f * Math.pow(2, capo / 12));
        for (let k = 0; k < per; k++) {
          chords.push({ ticks: countInTicks + bi * barTicks + beat * o.ppq + (k * o.ppq) / per, bar: bi, beat, chord: name, hz });
        }
      });
    });
  }

  const tabTicks = tab ? tab.steps * stepTicks : 0;
  const chartTicks = flat.length * barTicks;
  const raw = Math.max(tabTicks, chartTicks, barTicks);
  // El loop cierra en compás completo para que el clic no se desfase.
  const totalTicks = Math.ceil(raw / barTicks) * barTicks;
  return { events, chords, totalTicks, bars: totalTicks / barTicks, countInTicks };
}

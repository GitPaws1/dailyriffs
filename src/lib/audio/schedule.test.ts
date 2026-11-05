import { describe, expect, it } from 'vitest';
import { buildSchedule } from './schedule';
import { parseTab } from '../tabtext/parse';
import { parseChart } from '../chords/parse';
import { SEEDS } from '../song/seeds';
import { validateSong } from '../song/schema';

const PPQ = 192;

describe('buildSchedule', () => {
  it('cada step de 16avo = PPQ/4 ticks, con cuenta previa de un compás', () => {
    const tab = parseTab(['e|0---0---|', 'B|--------|', 'G|--------|', 'D|--------|', 'A|--------|', 'E|--------|'].join('\n'));
    const s = buildSchedule(tab, null, { ppq: PPQ, beatsPerBar: 4, countIn: true });
    expect(s.countInTicks).toBe(PPQ * 4);
    expect(s.events.map((e) => e.ticks)).toEqual([PPQ * 4, PPQ * 4 + PPQ]);
    expect(s.events[0].notes[0].hz).toBeCloseTo(329.63, 1);
    expect(s.totalTicks).toBe(PPQ * 4);
  });
  it('acordes: un golpe por tiempo, capo transpone', () => {
    const c = parseChart('| G | C |');
    const s = buildSchedule(null, c, { ppq: PPQ, beatsPerBar: 4, capo: 2 });
    expect(s.chords).toHaveLength(8);
    expect(s.chords[4]).toMatchObject({ bar: 1, beat: 0, chord: 'C', ticks: PPQ * 4 });
    expect(s.bars).toBe(2);
    const g = s.chords[0].hz[0];
    expect(g).toBeCloseTo(98 * Math.pow(2, 2 / 12), 0);
  });
});

describe('seeds', () => {
  it.each(SEEDS.map((s) => [s.id, s] as const))('%s valida sin errores', (_id, seed) => {
    const v = validateSong(seed, { maxFret: 22 });
    expect(v.errors).toEqual([]);
    expect(v.warnings).toEqual([]);
  });
});

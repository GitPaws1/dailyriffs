import { describe, expect, it } from 'vitest';
import { locateStep, parseTab } from './parse';

const riff = `
Intro (PM)
e|----------------|----------------|
B|----------------|----------------|
G|----------------|----------------|
D|----------------|----------------|
A|2-2-2-2-5---7---|2-2-2-2-7---5---|
E|0-0-0-0-3---5---|0-0-0-0-5---3---|
`;

describe('parseTab', () => {
  it('lee 6 líneas, compases y power chords', () => {
    const t = parseTab(riff);
    expect(t.systems).toHaveLength(1);
    expect(t.steps).toBe(32);
    expect(t.barSteps).toEqual([0, 16]);
    expect(t.events[0]).toEqual({ step: 0, notes: [{ string: 5, fret: 2 }, { string: 6, fret: 0 }] });
    expect(t.events.find((e) => e.step === 8)!.notes.map((n) => n.fret)).toEqual([5, 3]);
    expect(t.warnings).toEqual([]);
  });

  it('voltea bloques escritos grave-arriba', () => {
    const t = parseTab(['E|-3-|', 'A|---|', 'D|---|', 'G|---|', 'B|---|', 'e|-0-|'].join('\n'));
    expect(t.events[0].notes).toEqual([{ string: 1, fret: 0 }, { string: 6, fret: 3 }]);
  });

  it('técnicas: hammer-on liga, bend no repulsa, x es muerta, dos cifras', () => {
    const t = parseTab([
      'e|--------------|',
      'B|-5h7--8b10-12~|',
      'G|-x------------|',
      'D|--------------|',
      'A|--------------|',
      'E|--------------|',
    ].join('\n'));
    const notes = t.events.flatMap((e) => e.notes);
    expect(notes).toContainEqual({ string: 3, fret: -1 });
    expect(notes).toContainEqual({ string: 2, fret: 7, legato: 'h' });
    expect(notes).toContainEqual({ string: 2, fret: 8, bendTo: 10 });
    expect(notes).toContainEqual({ string: 2, fret: 12, vibrato: true });
    expect(notes.filter((n) => n.fret === 10)).toHaveLength(0);
  });

  it('varios sistemas encadenan steps y el cursor los ubica', () => {
    const one = ['e|-0-|', 'B|---|', 'G|---|', 'D|---|', 'A|---|', 'E|---|'].join('\n');
    const t = parseTab(one + '\n\n' + one);
    expect(t.steps).toBe(6);
    expect(t.events.map((e) => e.step)).toEqual([1, 4]);
    expect(locateStep(t, 4)).toEqual({ sys: 1, col: 1 });
  });

  it('avisa si no hay tab o si se pasa de trastes', () => {
    expect(parseTab('hola').warnings[0]).toMatch(/No encontré/);
    const t = parseTab(['e|-23-|', 'B|----|', 'G|----|', 'D|----|', 'A|----|', 'E|----|'].join('\n'));
    expect(t.maxFret).toBe(23);
    expect(t.warnings.some((w) => w.includes('21–22'))).toBe(true);
  });
});

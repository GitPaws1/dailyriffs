import { describe, expect, it } from 'vitest';
import { Chord, Note } from 'tonal';
import { SHAPES, isChord, normChord, shapeChromas, voicingHz } from './shapes';
import { flattenChart, parseChart } from './parse';

describe('biblioteca de formas', () => {
  it.each(SHAPES.map((s) => [s.name, s] as const))('%s suena solo notas del acorde', (name, sh) => {
    const want = Chord.get(name).notes.map((n) => Note.chroma(n));
    expect(want.length).toBeGreaterThan(0);
    for (const c of shapeChromas(sh)) expect(want).toContain(c);
    expect(shapeChromas(sh)).toContain(Note.chroma(Chord.get(name).tonic!));
    expect(sh.frets).toHaveLength(6);
    expect(sh.fingers).toHaveLength(6);
  });
  it('alias y voicing sin forma', () => {
    expect(normChord('Amin')).toBe('Am');
    expect(isChord('F#m7')).toBe(true);
    expect(isChord('Hola')).toBe(false);
    expect(voicingHz('Bbmaj7').length).toBeGreaterThanOrEqual(4);
  });
});

describe('parseChart', () => {
  it('secciones, repeticiones, puntos de tiempo y texto del usuario', () => {
    const c = parseChart(`[Verso] x2
| G | C | G . D . |
línea de texto
[Coro]
C D G G`);
    expect(c.sections.map((s) => [s.name, s.repeat, s.bars.length])).toEqual([['Verso', 2, 3], ['Coro', 1, 4]]);
    expect(c.sections[0].bars[2].slots).toEqual(['G', 'G', 'D', 'D']);
    expect(c.sections[0].text).toEqual(['línea de texto']);
    expect(c.bars).toBe(10);
    expect(flattenChart(c)).toHaveLength(10);
    expect(c.chords.sort()).toEqual(['C', 'D', 'G']);
  });
  it('dos acordes en 3/4 se reparten', () => {
    expect(parseChart('| Am E |', 3).sections[0].bars[0].slots).toEqual(['Am', 'Am', 'E']);
  });
});

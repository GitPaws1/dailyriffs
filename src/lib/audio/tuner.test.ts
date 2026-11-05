import { describe, expect, it } from 'vitest';
import { cents, createSmoother, createTuneLock, hzToMidi, ledIndex, midiName, nearestString } from './tuner';

describe('tuner math', () => {
  it('A4 = 440 → midi 69, nombre A4', () => {
    expect(hzToMidi(440)).toBeCloseTo(69, 6);
    expect(midiName(69)).toBe('A4');
    expect(midiName(40)).toBe('E2');
  });
  it('cents: un semitono arriba = +100', () => {
    expect(cents(440 * Math.pow(2, 1 / 12), 440)).toBeCloseTo(100, 4);
  });
  it('AUTO elige la cuerda más cercana', () => {
    expect(nearestString(83).s).toBe(6);
    expect(nearestString(108).s).toBe(5);
    expect(nearestString(250).s).toBe(2);
    expect(nearestString(320).s).toBe(1);
  });
  it('LEDs saturan en ±4', () => {
    expect(ledIndex(0)).toBe(0);
    expect(ledIndex(-50)).toBe(-4);
    expect(ledIndex(13)).toBe(2);
  });
});

describe('tune lock (histéresis)', () => {
  it('necesita sostener para entrar y salir pasa del umbral de salida', () => {
    const l = createTuneLock({ enter: 3, exit: 7, holdMs: 100 });
    expect(l.update(2, 0)).toBe('near');
    expect(l.update(1, 50)).toBe('near');
    expect(l.update(1, 120)).toBe('locked');
    expect(l.update(6, 130)).toBe('locked');
    expect(l.update(9, 140)).toBe('near');
    expect(l.update(30, 150)).toBe('far');
    expect(l.update(null, 160)).toBe('idle');
  });
  it('un pico fuera de rango reinicia la espera', () => {
    const l = createTuneLock({ holdMs: 100 });
    l.update(1, 0);
    l.update(20, 60);
    expect(l.update(1, 110)).toBe('near');
  });
});

describe('smoother', () => {
  it('filtra un pico aislado con la mediana', () => {
    const s = createSmoother(1);
    s.push(0); s.push(0);
    expect(s.push(40)).toBe(0);
  });
  it('reinicia en saltos de más de 60 cents', () => {
    const s = createSmoother(0.35);
    s.push(0);
    expect(s.push(90)).toBe(90);
  });
});

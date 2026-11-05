// Matemática del afinador: pura, sin DOM. Probada en tuner.test.ts.

/** Cuerda 1 (e aguda) … 6 (E grave), afinación estándar A4 = 440 Hz. */
export const OPEN_HZ = [329.63, 246.94, 196.0, 146.83, 110.0, 82.41] as const;

export const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

export interface GuitarString { s: 1 | 2 | 3 | 4 | 5 | 6; n: string; o: number; hz: number }

/** Orden de las teclas del afinador: grave → aguda. */
export const STRINGS: GuitarString[] = [
  { s: 6, n: 'E', o: 2, hz: OPEN_HZ[5] },
  { s: 5, n: 'A', o: 2, hz: OPEN_HZ[4] },
  { s: 4, n: 'D', o: 3, hz: OPEN_HZ[3] },
  { s: 3, n: 'G', o: 3, hz: OPEN_HZ[2] },
  { s: 2, n: 'B', o: 3, hz: OPEN_HZ[1] },
  { s: 1, n: 'E', o: 4, hz: OPEN_HZ[0] },
];

export const hzToMidi = (hz: number) => 12 * Math.log2(hz / 440) + 69;
export const midiName = (m: number) => NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);
export const cents = (hz: number, target: number) => 1200 * Math.log2(hz / target);

/** Cuerda más cercana a la frecuencia oída (en cents), para el modo AUTO. */
export function nearestString(hz: number): GuitarString {
  let best = STRINGS[0];
  let bestD = Infinity;
  for (const st of STRINGS) {
    const d = Math.abs(cents(hz, st.hz));
    if (d < bestD) { bestD = d; best = st; }
  }
  return best;
}

export type LockState = 'idle' | 'far' | 'near' | 'locked';

export interface TuneLockOpts { enter?: number; exit?: number; near?: number; holdMs?: number }

/**
 * Histéresis: entra a LOCK con |c| ≤ enter sostenido holdMs, sale solo con |c| > exit.
 * Evita que el LED parpadee cuando la cuerda está justo en el borde.
 */
export function createTuneLock({ enter = 3, exit = 7, near = 12, holdMs = 180 }: TuneLockOpts = {}) {
  let state: LockState = 'idle';
  let since = -1;
  return {
    get state() { return state; },
    reset() { state = 'idle'; since = -1; },
    update(c: number | null, now: number): LockState {
      if (c == null || !Number.isFinite(c)) { state = 'idle'; since = -1; return state; }
      const a = Math.abs(c);
      if (state === 'locked') {
        if (a > exit) { state = a <= near ? 'near' : 'far'; since = -1; }
        return state;
      }
      if (a <= enter) {
        if (since < 0) since = now;
        state = now - since >= holdMs ? 'locked' : 'near';
      } else {
        since = -1;
        state = a <= near ? 'near' : 'far';
      }
      return state;
    },
  };
}

/** Suavizado: mediana de 3 + EMA. Reinicia si salta más de un semitono. */
export function createSmoother(alpha = 0.35) {
  const win: number[] = [];
  let ema: number | null = null;
  return {
    reset() { win.length = 0; ema = null; },
    push(c: number): number {
      if (ema != null && Math.abs(c - ema) > 60) { win.length = 0; ema = null; }
      win.push(c);
      if (win.length > 3) win.shift();
      const med = [...win].sort((x, y) => x - y)[Math.floor(win.length / 2)];
      ema = ema == null ? med : ema + alpha * (med - ema);
      return ema;
    },
  };
}

/** Índice de LED (−4 … +4) para la tira de afinación: 6 cents por LED. */
export const ledIndex = (c: number) => Math.max(-4, Math.min(4, Math.round(c / 6)));

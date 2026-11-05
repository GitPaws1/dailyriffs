// Motor de audio único: un solo AudioContext para pulsación (Karplus-Strong), clic y Tone.js.
// Nada suena sin acción del usuario: unlock() se llama desde un handler de click/tap.

import { OPEN_HZ } from './tuner';

type ToneModule = typeof import('tone');

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let toneMod: ToneModule | null = null;
const bufferCache = new Map<number, AudioBuffer>();

export function audioCtx(): AudioContext | null {
  if (ctx) return ctx;
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx = new AC({ latencyHint: 'interactive' });
  master = ctx.createGain();
  master.gain.value = 0.9;
  master.connect(ctx.destination);
  return ctx;
}

export async function unlock(): Promise<AudioContext | null> {
  const c = audioCtx();
  if (c && c.state === 'suspended') await c.resume();
  return c;
}

/** Tone.js atado al mismo contexto (para Transport/Draw). Import dinámico: no toca SSR. */
export async function tone(): Promise<ToneModule> {
  if (toneMod) return toneMod;
  const c = audioCtx();
  const T = await import('tone');
  if (c) T.setContext(c);
  toneMod = T;
  return T;
}

function ksBuffer(ac: AudioContext, f: number): AudioBuffer {
  const key = Math.round(f * 10);
  const hit = bufferCache.get(key);
  if (hit) return hit;
  const sr = ac.sampleRate;
  const len = Math.floor(sr * 1.6);
  const N = Math.max(2, Math.round(sr / f));
  const buf = ac.createBuffer(1, len, sr);
  const d = buf.getChannelData(0);
  const ring = new Float32Array(N);
  for (let i = 0; i < N; i++) ring[i] = Math.random() * 2 - 1;
  let idx = 0;
  const decay = 0.994 + Math.min(0.005, f / 200000);
  for (let i = 0; i < len; i++) {
    const nx = (idx + 1) % N;
    const v = ring[idx];
    ring[idx] = decay * 0.5 * (v + ring[nx]);
    d[i] = v * 0.35;
    idx = nx;
  }
  if (bufferCache.size > 96) bufferCache.clear();
  bufferCache.set(key, buf);
  return buf;
}

export interface PluckOpts { when?: number; gain?: number; bendTo?: number; mute?: boolean }

/** Cuerda pulsada a una frecuencia. `when` en segundos del AudioContext. */
export function pluckHz(f: number, opts: PluckOpts = {}): void {
  const ac = audioCtx();
  if (!ac || !master || !(f > 0)) return;
  const when = opts.when ?? ac.currentTime;
  const src = ac.createBufferSource();
  src.buffer = ksBuffer(ac, f);
  const g = ac.createGain();
  g.gain.value = opts.gain ?? 0.8;
  if (opts.mute) {
    g.gain.setValueAtTime(opts.gain ?? 0.8, when);
    g.gain.exponentialRampToValueAtTime(0.001, when + 0.09);
  }
  if (opts.bendTo && opts.bendTo > 0) {
    src.playbackRate.setValueAtTime(1, when + 0.06);
    src.playbackRate.linearRampToValueAtTime(opts.bendTo / f, when + 0.22);
  }
  src.connect(g);
  g.connect(master);
  src.start(when);
  src.stop(when + 1.7);
}

/** Cuerda 1 (e aguda) … 6 (E grave), traste n. */
export function pluck(string: number, fret: number, opts: PluckOpts = {}): void {
  pluckHz(OPEN_HZ[string - 1] * Math.pow(2, fret / 12), opts);
}

export function click(accent: boolean, when?: number): void {
  const ac = audioCtx();
  if (!ac || !master) return;
  const t = when ?? ac.currentTime;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = 'square';
  o.frequency.value = accent ? 1760 : 1175;
  g.gain.setValueAtTime(0.18, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  o.connect(g);
  g.connect(master);
  o.start(t);
  o.stop(t + 0.06);
}

export function reducedMotion(): boolean {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
}

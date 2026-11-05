'use client';
// Un solo reloj (Tone.Transport) para clic, tab y acordes. La UI se entera por Tone.Draw,
// alineada al cuadro de animación más cercano al tiempo de audio real.

import { click, pluckHz, tone, unlock } from './engine';
import { buildSchedule, type Schedule } from './schedule';
import type { TabScore } from '../tabtext/parse';
import type { ChordChart } from '../chords/parse';

export interface TransportState {
  playing: boolean;
  bpm: number;
  beat: number;        // −1 parado
  bar: number;
  step: number;        // step de tab activo, −1 ninguno
  chordBar: number;    // compás del cifrado activo, −1 ninguno
  loops: number;       // vueltas completas desde PLAY
  counting: boolean;   // en cuenta previa
}

export interface Mix { click: boolean; tab: boolean; chords: boolean }

export interface LoadOpts {
  tab?: TabScore | null;
  chart?: ChordChart | null;
  beatsPerBar?: number;
  stepsPerBeat?: number;
  capo?: number;
  strum?: 'negras' | 'corcheas' | 'ninguno';
  countIn?: boolean;
}

type Listener = (s: TransportState) => void;

export class PracticeTransport {
  state: TransportState;
  mix: Mix = { click: true, tab: true, chords: true };
  private listeners = new Set<Listener>();
  private opts: LoadOpts = {};
  private schedule: Schedule | null = null;
  private ids: number[] = [];
  private loopHandler: (() => void) | null = null;

  constructor(bpm = 80) {
    this.state = { playing: false, bpm, beat: -1, bar: -1, step: -1, chordBar: -1, loops: 0, counting: false };
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    fn(this.state);
    return () => { this.listeners.delete(fn); };
  }

  private emit(patch: Partial<TransportState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l(this.state));
  }

  load(opts: LoadOpts) {
    this.opts = opts;
    if (this.state.playing) void this.restart();
  }

  async setBpm(bpm: number) {
    const v = Math.max(30, Math.min(260, Math.round(bpm)));
    this.emit({ bpm: v });
    if (this.state.playing) {
      const T = await tone();
      T.getTransport().bpm.value = v;
    }
  }

  async toggle() { return this.state.playing ? this.stop() : this.start(); }

  async start() {
    await unlock();
    const T = await tone();
    await T.start();
    const tr = T.getTransport();
    const draw = T.getDraw();
    this.clear(tr);
    tr.stop();
    tr.position = 0;
    tr.bpm.value = this.state.bpm;
    const bpb = this.opts.beatsPerBar ?? 4;
    tr.timeSignature = bpb;
    const ppq = tr.PPQ;
    const s = buildSchedule(this.opts.tab ?? null, this.opts.chart ?? null, {
      ppq, beatsPerBar: bpb, stepsPerBeat: this.opts.stepsPerBeat, countIn: this.opts.countIn, capo: this.opts.capo, strum: this.opts.strum,
    });
    this.schedule = s;
    const loopStart = s.countInTicks;
    const loopEnd = s.countInTicks + s.totalTicks;

    // Clic: cada negra; en cuenta previa siempre suena aunque el mix lo apague.
    this.ids.push(tr.scheduleRepeat((time) => {
      const ticks = tr.getTicksAtTime(time);
      const beatIdx = Math.round(ticks / ppq);
      const counting = ticks < loopStart - 1;
      const inLoop = counting ? beatIdx : Math.round((ticks - loopStart) / ppq);
      const b = ((inLoop % bpb) + bpb) % bpb;
      if (this.mix.click || counting) click(b === 0, time);
      draw.schedule(() => this.emit({ beat: b, bar: Math.floor(inLoop / bpb), counting }), time);
    }, '4n', 0));

    for (const ev of s.events) {
      this.ids.push(tr.schedule((time) => {
        if (this.mix.tab) {
          for (const n of ev.notes) pluckHz(n.hz, { when: time, gain: n.legato ? 0.55 : 0.8, mute: n.mute, bendTo: n.bendHz });
        }
        draw.schedule(() => this.emit({ step: ev.step }), time);
      }, `${ev.ticks}i`));
    }

    let lastBar = -1;
    for (const c of s.chords) {
      this.ids.push(tr.schedule((time) => {
        if (this.mix.chords) c.hz.forEach((f, i) => pluckHz(f, { when: time + i * 0.012, gain: c.beat === 0 ? 0.42 : 0.3 }));
        if (c.bar !== lastBar) { lastBar = c.bar; draw.schedule(() => this.emit({ chordBar: c.bar }), time); }
      }, `${c.ticks}i`));
    }

    tr.loop = true;
    tr.loopStart = `${loopStart}i`;
    tr.loopEnd = `${loopEnd}i`;
    this.loopHandler = () => { lastBar = -1; draw.schedule(() => this.emit({ loops: this.state.loops + 1 }), T.now()); };
    tr.on('loop', this.loopHandler);

    this.emit({ playing: true, loops: 0, step: -1, chordBar: -1, beat: -1, counting: !!this.opts.countIn });
    tr.start('+0.05');
  }

  async stop() {
    const T = await tone();
    const tr = T.getTransport();
    tr.stop();
    this.clear(tr);
    this.emit({ playing: false, beat: -1, bar: -1, step: -1, chordBar: -1, counting: false });
  }

  private async restart() { await this.stop(); await this.start(); }

  private clear(tr: ReturnType<Awaited<ReturnType<typeof tone>>['getTransport']>) {
    this.ids.forEach((id) => tr.clear(id));
    this.ids = [];
    if (this.loopHandler) { tr.off('loop', this.loopHandler); this.loopHandler = null; }
    tr.loop = false;
  }

  get bars() { return this.schedule?.bars ?? 0; }

  dispose() { void this.stop(); this.listeners.clear(); }
}

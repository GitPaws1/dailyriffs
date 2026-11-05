'use client';
// Metronome con reloj de audio: misma carátula y clases que el Metronome del bundle; el tiempo lo lleva PracticeTransport.

import { useRef, type ReactNode } from 'react';
import { useDS } from '@/ds/DSProvider';
import { cx } from '../cx';
import { pad } from '@/lib/nav';
import type { TransportState } from '@/lib/audio/transport';

export interface MetronomeLabels { tempo: string; play: string; stop: string; tap: string }

export function PracticeMetronome({ state, onToggle, onBpm, beats = 4, min = 40, max = 240, grille = true, labels: L, children, className }: {
  state: TransportState; onToggle: () => void; onBpm: (v: number) => void; beats?: number; min?: number; max?: number; grille?: boolean; labels: MetronomeLabels; children?: ReactNode; className?: string;
}) {
  const ds = useDS();
  const { bpm, beat, playing } = state;
  const taps = useRef<number[]>([]);
  const drag = useRef<{ y: number; v: number } | null>(null);
  const set = (v: number) => onBpm(Math.max(min, Math.min(max, Math.round(v))));

  const onKey = (e: React.KeyboardEvent) => {
    const k = e.key;
    if (k === 'ArrowUp' || k === 'ArrowRight') { set(bpm + (e.shiftKey ? 10 : 1)); e.preventDefault(); }
    else if (k === 'ArrowDown' || k === 'ArrowLeft') { set(bpm - (e.shiftKey ? 10 : 1)); e.preventDefault(); }
    else if (k === 'Home') { set(min); e.preventDefault(); } else if (k === 'End') { set(max); e.preventDefault(); }
  };
  const tap = () => {
    const now = performance.now();
    const a = taps.current.filter((t) => now - t < 2500);
    a.push(now);
    taps.current = a;
    if (a.length > 1) set(60000 / ((a[a.length - 1] - a[0]) / (a.length - 1)));
  };
  const angle = -135 + (270 * (bpm - min)) / (max - min);

  return (
    <div className={cx('dr-metro', className)}>
      {grille ? <span className={cx('dr-metro__grille', beat === 0 && 'is-pulse')} aria-hidden /> : null}
      <ds.Readout label={L.tempo} value={pad(bpm)} unit="BPM">
        <span className="dr-metro__beats" aria-hidden>
          {Array.from({ length: beats }, (_, i) => <span key={i} className={cx('dr-metro__beat', i === beat && 'is-on', i === 0 && 'is-one')} />)}
        </span>
      </ds.Readout>
      <div className="dr-metro__controls">
        <div
          className="dr-knob" role="slider" tabIndex={0} aria-label={L.tempo}
          aria-valuemin={min} aria-valuemax={max} aria-valuenow={bpm} aria-valuetext={`${bpm} BPM`}
          onKeyDown={onKey}
          onPointerDown={(e) => { drag.current = { y: e.clientY, v: bpm }; e.currentTarget.setPointerCapture(e.pointerId); }}
          onPointerMove={(e) => { if (drag.current) set(drag.current.v + (drag.current.y - e.clientY) / 2); }}
          onPointerUp={() => { drag.current = null; }}
          onPointerCancel={() => { drag.current = null; }}
          onWheel={(e) => set(bpm + (e.deltaY < 0 ? 1 : -1))}
        >
          <span className="dr-knob__cap" style={{ transform: `rotate(${angle}deg)` }}><span className="dr-knob__mark" /></span>
        </div>
        <span className="dr-knob__label" aria-hidden>{L.tempo}</span>
        <div className="dr-metro__keys">
          <ds.Button variant="key" led={playing} onClick={onToggle}>{playing ? L.stop : L.play}</ds.Button>
          <ds.Button variant="key" onClick={tap}>{L.tap}</ds.Button>
        </div>
      </div>
      {children}
    </div>
  );
}

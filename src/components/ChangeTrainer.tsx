'use client';
import * as React from 'react';
import { useDS } from '@/ds/DSProvider';
import type { LibraryChord } from '@/lib/contract';
import { chordAlt, toDiagramFingers, toDiagramFrets } from '@/lib/content';
import { pad } from '@/lib/nav';
import { save } from '@/lib/storage';
import { useStore } from '@/lib/useStore';

/** Entrenador de cambios: dos acordes, cuenta regresiva y contador manual de cambios limpios. */
export function ChangeTrainer({ a, b, durationSec = 60, target = 20, bpm = 60, metronome = true }: { a: LibraryChord; b: LibraryChord; durationSec?: number; target?: number; bpm?: number; metronome?: boolean }) {
  const ds = useDS();
  const store = useStore();
  const key = `${a.name}-${b.name}`;
  const best = store.best[key] || 0;
  const [running, setRunning] = React.useState(false);
  const [left, setLeft] = React.useState(durationSec);
  const [count, setCount] = React.useState(0);
  const [finished, setFinished] = React.useState(false);
  const endAt = React.useRef(0);
  const countRef = React.useRef(0);

  React.useEffect(() => { setRunning(false); setLeft(durationSec); setCount(0); setFinished(false); }, [key, durationSec]);

  React.useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => {
      const ms = endAt.current - Date.now();
      if (ms <= 0) {
        window.clearInterval(t);
        setLeft(0); setRunning(false); setFinished(true);
        const n = countRef.current;
        if (n > (store.best[key] || 0)) save((s) => { s.best[key] = n; });
      } else setLeft(Math.ceil(ms / 1000));
    }, 200);
    return () => window.clearInterval(t);
  }, [running, key, store.best]);

  function toggle() {
    if (running) { setRunning(false); return; }
    countRef.current = 0; setCount(0); setFinished(false); setLeft(durationSec);
    endAt.current = Date.now() + durationSec * 1000; setRunning(true);
  }
  function hit() { if (!running) return; countRef.current += 1; setCount(countRef.current); }

  const mmss = `${Math.floor(left / 60)}:${pad(left % 60, 2)}`;
  const result = !finished ? null : count >= target
    ? `Meta cumplida: ${count} cambios. Repite mañana y busca ${count + 3}.`
    : `${count} de ${target}. Baja la exigencia: mueve los dedos en bloque y cuenta solo cambios limpios.`;

  return (
    <div className="panel stack">
      <p className="kicker">CH-02 · ENTRENADOR DE CAMBIOS · {a.name} ↔ {b.name}</p>
      <div className="row">
        {[a, b].map((c) => (
          <figure key={c.name} style={{ margin: 0 }}>
            <ds.ChordDiagram name={c.name} quality={c.quality} frets={toDiagramFrets(c.frets)} fingers={toDiagramFingers(c.fingers)} baseFret={c.base_fret} barre={c.barre ?? undefined} />
            <figcaption className="sr-only">{chordAlt(c)}</figcaption>
          </figure>
        ))}
      </div>
      <div className="trainer__lcds">
        <ds.Readout label="TIEMPO" value={mmss} size="sm" />
        <ds.Readout label="CAMBIOS" value={pad(count)} size="sm" live />
        <ds.Readout label="MEJOR" value={pad(best)} size="sm" />
      </div>
      <ds.Meter value={Math.min(1, count / target)} label={`Meta: ${target} cambios en ${durationSec} s`} channel="tecnica" />
      <div className="trainer__keys">
        <ds.Button variant="key" led={running} onClick={toggle}>{running ? 'STOP' : 'START'}</ds.Button>
        <ds.Button variant="key" className="trainer__tap" onClick={hit} disabled={!running} aria-label="Sumar un cambio limpio">+1 CAMBIO</ds.Button>
      </div>
      <p className="caption">Pulsa START, cambia de acorde y toca +1 cada vez que el nuevo suene limpio. Con el teclado: enfoca +1 y usa Espacio.</p>
      <p className="lead" aria-live="polite">{result}</p>
      {metronome ? (
        <div className="stack">
          <p className="caption">Opcional: usa el metrónomo a {bpm} BPM y cambia en cada tiempo 1.</p>
          <ds.Metronome bpm={bpm} min={40} max={200} />
        </div>
      ) : null}
    </div>
  );
}

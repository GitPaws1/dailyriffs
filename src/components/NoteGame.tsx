'use client';
import * as React from 'react';
import { useDS } from '@/ds/DSProvider';
import { pad } from '@/lib/nav';
import { save } from '@/lib/storage';
import { useStore } from '@/lib/useStore';

const NATURALS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const SPANISH: Record<string, string> = { C: 'Do', D: 'Re', E: 'Mi', F: 'Fa', G: 'Sol', A: 'La', B: 'Si' };
const GOAL = 10;
type Target = { string: number; note: string };

function pick(strings: number[], prev?: Target): Target {
  let t: Target;
  do { t = { string: strings[Math.floor(Math.random() * strings.length)], note: NATURALS[Math.floor(Math.random() * 7)] }; }
  while (prev && t.string === prev.string && t.note === prev.note);
  return t;
}

/** Juego: encuentra la nota pedida en la cuerda pedida (notas naturales, trastes 0-12). */
export function NoteGame() {
  const ds = useDS();
  const store = useStore();
  const [all, setAll] = React.useState(false);
  const strings = all ? [1, 2, 3, 4, 5, 6] : [6, 5];
  const [target, setTarget] = React.useState<Target>(() => ({ string: 6, note: 'G' }));
  const [streak, setStreak] = React.useState(0);
  const [msg, setMsg] = React.useState('Toca el traste correcto en el diapasón de abajo.');
  const best = store.best['note-game'] || 0;

  function onNote(n: { string: number; fret: number; note: string }) {
    if (n.string === target.string && n.note === target.note) {
      const s = streak + 1;
      setStreak(s);
      if (s > best) save((st) => { st.best['note-game'] = s; });
      setMsg(`Bien: ${n.note} en el traste ${n.fret}. Siguiente.`);
      setTarget(pick(strings, target));
    } else {
      setStreak(0);
      setMsg(`Eso fue ${n.note} en la cuerda ${n.string}. Busca ${target.note} en la ${target.string}ª.`);
    }
  }
  function toggleAll() { const v = !all; setAll(v); setStreak(0); setTarget(pick(v ? [1, 2, 3, 4, 5, 6] : [6, 5])); }

  return (
    <div className="stack">
      <div className="trainer__lcds">
        <ds.Readout label="BUSCA" value={target.note} unit={`CUERDA ${target.string}`} live />
        <ds.Readout label="RACHA" value={pad(streak, 2)} size="sm" />
        <ds.Readout label="MEJOR" value={pad(best, 2)} size="sm" />
      </div>
      <p className="lead" aria-live="polite">{SPANISH[target.note]} en la {target.string}ª cuerda. {msg}</p>
      <ds.Meter value={Math.min(1, streak / GOAL)} label={`Racha · meta ${GOAL}`} channel="teoria" />
      <div className="trainer__keys">
        <ds.Button variant="key" led={all} onClick={toggleAll}>6 CUERDAS</ds.Button>
        <ds.Button variant="key" onClick={() => { setStreak(0); setTarget(pick(strings, target)); }}>SALTAR</ds.Button>
      </div>
      <ds.Fretboard key={`${target.string}-${target.note}-${streak}`} frets={12} interactive={false} onNote={onNote} title="JUEGO · ENCUENTRA LA NOTA · TRASTES 0-12" />
    </div>
  );
}

'use client';
import * as React from 'react';
import { useDS } from '@/ds/DSProvider';
import { Shell } from '@/components/Shell';
import { PageHead } from '@/components/PageHead';
import { ChangeTrainer } from '@/components/ChangeTrainer';
import { CHORDS, chordAlt, chordByName, toDiagramFingers, toDiagramFrets } from '@/lib/content';
import type { LibraryChord } from '@/lib/contract';

const FILTERS: { id: 'todos' | LibraryChord['group']; label: string }[] = [
  { id: 'todos', label: 'TODOS' }, { id: 'mayor', label: 'MAYORES' }, { id: 'menor', label: 'MENORES' }, { id: 'septima', label: 'SÉPTIMAS' }, { id: 'otro', label: 'SUS' },
];

export function AcordesView() {
  const ds = useDS();
  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]['id']>('todos');
  const [a, setA] = React.useState('G');
  const [b, setB] = React.useState('C');
  const list = filter === 'todos' ? CHORDS : CHORDS.filter((c) => c.group === filter);
  const ca = chordByName(a)!, cb = chordByName(b)!;

  return (
    <Shell active="tecnica">
      <div className="page">
        <PageHead channel="tecnica" kicker={`${CHORDS.length} ACORDES ABIERTOS`} title="Acordes abiertos" lead="Toca un diagrama para oírlo. Números = dedos (1 índice, 4 meñique); × = no se toca; ○ = al aire." />
        <section className="section--tight stack">
          <div className="trainer__keys" role="group" aria-label="Filtrar acordes">
            {FILTERS.map((f) => <ds.Button key={f.id} variant="key" size="sm" led={filter === f.id} onClick={() => setFilter(f.id)}>{f.label}</ds.Button>)}
          </div>
          <div className="grid-chords">
            {list.map((c) => (
              <figure key={c.name} className="chord-cell" style={{ margin: 0 }}>
                <ds.ChordDiagram name={c.name} quality={c.quality} frets={toDiagramFrets(c.frets)} fingers={toDiagramFingers(c.fingers)} baseFret={c.base_fret} barre={c.barre ?? undefined} />
                <figcaption className="caption">{c.tips[0]}<span className="sr-only">. {chordAlt(c)}</span></figcaption>
              </figure>
            ))}
          </div>
        </section>
        <section className="section stack" aria-labelledby="cambios">
          <p className="kicker">CH-02 · 60 SEGUNDOS</p>
          <h2 id="cambios" className="h3">Entrena tus cambios</h2>
          <p className="muted read" style={{ margin: 0 }}>Elige dos acordes y cuenta cuántos cambios limpios haces en un minuto. Ese número es tu progreso real.</p>
          <div className="row">
            <label className="field"><span className="kicker">ACORDE A</span>
              <select className="select" value={a} onChange={(e) => setA(e.target.value)}>{CHORDS.map((c) => <option key={c.name} value={c.name} disabled={c.name === b}>{c.name}</option>)}</select></label>
            <label className="field"><span className="kicker">ACORDE B</span>
              <select className="select" value={b} onChange={(e) => setB(e.target.value)}>{CHORDS.map((c) => <option key={c.name} value={c.name} disabled={c.name === a}>{c.name}</option>)}</select></label>
          </div>
          <ChangeTrainer a={ca} b={cb} target={20} />
        </section>
      </div>
    </Shell>
  );
}

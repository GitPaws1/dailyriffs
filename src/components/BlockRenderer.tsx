'use client';
import * as React from 'react';
import { useDS } from '@/ds/DSProvider';
import type { Channel } from '@/ds/types';
import type { Block, QuizBlock } from '@/lib/contract';
import { chordAlt, chordByName, toDiagramFingers, toDiagramFrets } from '@/lib/content';
import { tabToLines } from '@/lib/tab';
import { ChangeTrainer } from './ChangeTrainer';

/** Pinta los bloques del contrato con sus componentes. Las preguntas consecutivas van en un solo QuizConsole. */
export function BlockRenderer({ blocks, channel }: { blocks: Block[]; channel: Channel }) {
  const ds = useDS();
  const out: React.ReactNode[] = [];
  let quiz: QuizBlock[] = [];
  const flushQuiz = (k: number) => {
    if (!quiz.length) return;
    const qs = quiz.map((q) => ({ q: q.question, options: q.options, answer: q.answer, explain: q.why }));
    out.push(
      <section key={`quiz-${k}`} className="stack">
        <p className="kicker">COMPRUEBA · {qs.length} PREGUNTAS</p>
        <ds.QuizConsole questions={qs} channel={channel} subtitle="cierre de lección" />
      </section>,
    );
    quiz = [];
  };

  blocks.forEach((b, i) => {
    if (b.type === 'quiz') { quiz.push(b); return; }
    flushQuiz(i);
    const note = 'note' in b && b.note ? <p className="muted" style={{ margin: 0 }}>{b.note}</p> : null;
    let body: React.ReactNode = null;
    if (b.type === 'chord') {
      body = (
        <div className="row">
          <figure style={{ margin: 0 }}>
            <ds.ChordDiagram name={b.name} frets={toDiagramFrets(b.frets)} fingers={toDiagramFingers(b.fingers)} baseFret={b.base_fret} barre={b.barre ?? undefined} />
            <figcaption className="caption" style={{ maxWidth: 220, marginTop: 8 }}>{chordAlt(b)}</figcaption>
          </figure>
          {b.tips?.length ? <ul className="prose" style={{ margin: 0, paddingLeft: 18 }}>{b.tips.map((t) => <li key={t}>{t}</li>)}</ul> : null}
        </div>
      );
    } else if (b.type === 'fretboard') {
      body = <ds.Fretboard notes={b.highlight} frets={b.range[1]} title={b.caption} />;
    } else if (b.type === 'tab') {
      body = <ds.TabStaff lines={tabToLines(b)} bpm={b.bpm} channel={channel} title={`TAB · ${b.label.toUpperCase()} · ${b.time}`} />;
    } else if (b.type === 'exercise') {
      const [na, nb] = b.chords || [];
      const ca = na ? chordByName(na) : undefined, cb = nb ? chordByName(nb) : undefined;
      body = ca && cb
        ? <ChangeTrainer a={ca} b={cb} durationSec={b.duration_sec} target={b.target} bpm={b.bpm} />
        : <ds.Metronome bpm={b.bpm || 60} />;
    } else if (b.type === 'gear') {
      body = (
        <div className="stack">
          <ds.AmpPanel model="Frontman 10G" preset={`${b.amp.mode} · PASTILLA ${b.pickup.toUpperCase()}`}
            controls={[{ id: 'gain', label: 'GAIN', value: b.amp.gain }, { id: 'volume', label: 'VOLUME', value: b.amp.volume }, { id: 'treble', label: 'TREBLE', value: b.amp.treble }, { id: 'bass', label: 'BASS', value: b.amp.bass }]} />
          <p className="caption">Interruptor en {b.amp.mode} · selector en {b.pickup}. Punto de partida: ajusta de oído.</p>
        </div>
      );
    }
    out.push(<section key={i} className="stack">{note}{body}</section>);
  });
  flushQuiz(blocks.length);
  return <div className="stack stack--lg">{out}</div>;
}

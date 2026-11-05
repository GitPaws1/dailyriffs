'use client';
// PROPUESTA (sin componente aprobado aún): cifrado por compases dentro del lenguaje del sistema.
// Carcasa de TabStaff, compases en mono, compás activo con LED signal. Pendiente de aprobación.

import { useMemo } from 'react';
import { useDS } from '@/ds/DSProvider';
import { cx } from '../cx';
import { pad } from '@/lib/nav';
import { shapeFor } from '@/lib/chords/shapes';
import type { ChordChart } from '@/lib/chords/parse';

const collapse = (slots: string[]) => slots.filter((s, i) => s && s !== slots[i - 1]).join(' · ') || '—';

export function ChordChartView({ chart, activeBar, title, chordsLabel }: { chart: ChordChart; activeBar: number; title?: string; chordsLabel: string }) {
  const ds = useDS();
  // Índice plano → (sección, compás) contando repeticiones.
  const map = useMemo(() => {
    const m: Array<{ sec: number; bar: number; pass: number }> = [];
    chart.sections.forEach((s, si) => { for (let p = 0; p < s.repeat; p++) s.bars.forEach((_, bi) => m.push({ sec: si, bar: bi, pass: p })); });
    return m;
  }, [chart]);
  const cur = activeBar >= 0 ? map[activeBar] : undefined;

  return (
    <figure className="dr-tab dr-chart">
      <div className="dr-tab__head">
        <div>
          <ds.ChannelTag channel="repertorio" />
          {title ? <figcaption className="dr-tab__title">{title}</figcaption> : null}
        </div>
        <span className="dr-tab__bpm">{pad(chart.bars, 2)} CMP</span>
      </div>
      {chart.sections.map((s, si) => (
        <section key={si} className="dr-chart__sec" aria-label={s.name}>
          <p className="dr-chart__name">
            <span className={cx('dr-led', cur?.sec === si && 'is-on')} aria-hidden />
            {s.name}{s.repeat > 1 ? ` ×${s.repeat}` : ''}
            {cur?.sec === si && s.repeat > 1 ? <span className="dr-chart__pass">{cur.pass + 1}/{s.repeat}</span> : null}
          </p>
          <ol className="dr-chart__bars">
            {s.bars.map((b, bi) => (
              <li key={bi} className={cx('dr-chart__bar', cur?.sec === si && cur.bar === bi && 'is-on')} aria-current={cur?.sec === si && cur.bar === bi ? 'step' : undefined}>
                {collapse(b.slots)}
              </li>
            ))}
          </ol>
          {s.text.length ? <pre className="dr-chart__text">{s.text.join('\n')}</pre> : null}
        </section>
      ))}
      {chart.chords.some((c) => shapeFor(c)) ? (
        <div className="dr-chart__shapes" aria-label={chordsLabel}>
          {chart.chords.map((c) => { const sh = shapeFor(c); return sh ? <ds.ChordDiagram key={c} name={c} frets={sh.frets} fingers={sh.fingers} baseFret={sh.baseFret} barre={sh.barre} /> : null; })}
        </div>
      ) : null}
    </figure>
  );
}

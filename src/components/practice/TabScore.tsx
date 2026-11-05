'use client';
// TabScore (TabStaff con reloj externo): pinta la tab EXACTA del usuario (sistemas, barras, técnicas) y sigue el step del transport.

import { useEffect, useMemo, useRef } from 'react';
import { useDS } from '@/ds/DSProvider';
import type { Channel } from '@/ds/types';
import { cx } from '../cx';
import { pad } from '@/lib/nav';
import { locateStep, type TabScore } from '@/lib/tabtext/parse';

export function TabScoreStaff({ score, step, playing, onToggle, bpm, title, kicker, channel, legend, playLabel = 'PLAY', stopLabel = 'STOP', className }: {
  score: TabScore; step: number; playing: boolean; onToggle?: () => void; bpm: number; title?: string; kicker?: string; channel?: Channel; legend?: string; playLabel?: string; stopLabel?: string; className?: string;
}) {
  const ds = useDS();
  const loc = useMemo(() => (step >= 0 ? locateStep(score, step) : null), [score, step]);
  const staffRefs = useRef<Array<HTMLDivElement | null>>([]);
  const charW = useRef(0);

  // Mantiene el cursor a la vista dentro del sistema (scroll horizontal, nunca mueve la página).
  useEffect(() => {
    if (!loc) return;
    const el = staffRefs.current[loc.sys];
    if (!el) return;
    if (!charW.current) {
      const probe = document.createElement('span');
      probe.textContent = '----------';
      probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre';
      el.appendChild(probe);
      charW.current = probe.getBoundingClientRect().width / 10 || 9;
      probe.remove();
    }
    const labelW = (score.systems[loc.sys].labels[0]?.length ?? 1) + 1;
    const x = (loc.col + labelW) * charW.current;
    if (x < el.scrollLeft + 24 || x > el.scrollLeft + el.clientWidth - 48) el.scrollLeft = Math.max(0, x - el.clientWidth / 3);
  }, [loc, score]);

  const bars = score.barSteps.length;

  return (
    <figure className={cx('dr-tab', className)}>
      <div className="dr-tab__head">
        <div>
          {channel ? <ds.ChannelTag channel={channel} /> : null}
          {title ? <figcaption className="dr-tab__title">{title}</figcaption> : null}
          {kicker ? <span className="dr-tab__bpm">{kicker}</span> : null}
        </div>
        <div className="dr-tab__ctl">
          <span className="dr-tab__bpm">{pad(bpm)} BPM · {pad(bars, 2)} CMP</span>
          {onToggle ? <ds.Button variant="key" size="sm" led={playing} onClick={onToggle}>{playing ? stopLabel : playLabel}</ds.Button> : null}
        </div>
      </div>
      {score.systems.map((sys, si) => (
        <div
          key={si}
          ref={(el) => { staffRefs.current[si] = el; }}
          className={cx('dr-tab__staff', loc?.sys === si && 'is-active')}
          role="img"
          aria-label={`Tablatura, sistema ${si + 1} de ${score.systems.length}`}
        >
          {sys.lines.map((b, li) => {
            const on = loc?.sys === si;
            const col = on ? loc!.col : -1;
            const a = col >= 0 ? b.slice(0, col) : b;
            const m = col >= 0 ? b.charAt(col) || ' ' : '';
            const z = col >= 0 ? b.slice(col + 1) : '';
            return (
              <div key={li} className="dr-tab__line" aria-hidden>
                <span className="dr-tab__str">{sys.labels[li]}|</span>
                <span>{a}</span>
                {col >= 0 ? <span className={cx('dr-tab__head-col', /[0-9x]/.test(m) && 'is-hit')}>{m}</span> : null}
                {z}
              </div>
            );
          })}
        </div>
      ))}
      {legend ? <p className="dr-tab__legend">{legend}</p> : null}
    </figure>
  );
}

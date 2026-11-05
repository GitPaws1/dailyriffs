'use client';
// AmpPanelPro (AmpPanel del bundle, mismas clases): controlado (presets lo mueven) y con switch de canal opcional (Frontman: Clean / O.D.).

import { useRef, useState } from 'react';
import { cx } from './cx';

export interface AmpControl { id: string; label: string }

function AmpKnob({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const drag = useRef<{ y: number; v: number } | null>(null);
  const set = (n: number) => onChange(Math.max(0, Math.min(10, Math.round(n * 2) / 2)));
  return (
    <div className="dr-ampk">
      <span className="dr-ampk__lbl">{label}</span>
      <div
        className="dr-ampk__knob" role="slider" tabIndex={0} aria-label={label} aria-valuemin={0} aria-valuemax={10} aria-valuenow={value}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { set(value + 0.5); e.preventDefault(); }
          if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { set(value - 0.5); e.preventDefault(); }
        }}
        onPointerDown={(e) => { drag.current = { y: e.clientY, v: value }; e.currentTarget.setPointerCapture(e.pointerId); }}
        onPointerMove={(e) => { if (drag.current) set(drag.current.v + (drag.current.y - e.clientY) / 12); }}
        onPointerUp={() => { drag.current = null; }}
        onPointerCancel={() => { drag.current = null; }}
        onWheel={(e) => set(value + (e.deltaY < 0 ? 0.5 : -0.5))}
      >
        <span className="dr-ampk__cap" style={{ transform: `rotate(${-135 + 27 * value}deg)` }}><span className="dr-ampk__ptr" /></span>
      </div>
      <span className="dr-ampk__val">{value % 1 ? value.toFixed(1) : value}</span>
    </div>
  );
}

export function AmpPanelPro({ model = 'DailyRiffs', preset, controls, values, onChange, channel, className }: {
  model?: string;
  preset?: string;
  controls: AmpControl[];
  values: Record<string, number>;
  onChange: (id: string, v: number) => void;
  channel?: { label: string; options: [string, string]; value: 0 | 1; onChange: (v: 0 | 1) => void };
  className?: string;
}) {
  const [on, setOn] = useState(true);
  return (
    <div className={cx('dr-amp', className)} data-theme="stage">
      <div className="dr-amp__tolex"><span className="dr-amp__badge">{model}</span><span className="dr-amp__badgejp" aria-hidden>アンプ</span></div>
      <div className="dr-amp__panel">
        <div className="dr-amp__inputs">
          <span className="dr-amp__lbl">INPUT</span>
          <div className="dr-amp__jacks"><span className="dr-amp__jack" /><span className="dr-amp__jack" /></div>
          <span className="dr-amp__lbl">IN · AUX</span>
        </div>
        <div className="dr-amp__knobs">
          {channel ? (
            <div className="dr-ampk dr-amp__chan">
              <span className="dr-ampk__lbl">{channel.label}</span>
              <button
                type="button"
                className={cx('dr-amp__toggle', channel.value === 1 && 'is-on')}
                aria-pressed={channel.value === 1}
                aria-label={`${channel.label}: ${channel.options[channel.value]}`}
                onClick={() => channel.onChange(channel.value === 1 ? 0 : 1)}
              ><span /></button>
              <span className="dr-ampk__val">{channel.options[channel.value]}</span>
            </div>
          ) : null}
          {controls.map((c) => <AmpKnob key={c.id} label={c.label} value={values[c.id] ?? 0} onChange={(v) => onChange(c.id, v)} />)}
        </div>
        <div className="dr-amp__power">
          <span className={cx('dr-amp__jewel', on && 'is-on')} aria-hidden />
          <button type="button" className={cx('dr-amp__toggle', on && 'is-on')} aria-pressed={on} aria-label="Encendido" onClick={() => setOn(!on)}><span /></button>
          <span className="dr-amp__lbl">POWER</span>
        </div>
      </div>
      {preset ? <div className="dr-amp__preset"><span>PRESET</span><span className="dr-amp__pname">{preset}</span></div> : null}
    </div>
  );
}

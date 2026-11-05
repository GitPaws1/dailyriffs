'use client';

import { useDS } from '@/ds/DSProvider';
import { AmpPanelPro } from '../AmpPanelPro';
import { useRig } from '@/lib/gear/RigProvider';
import { AMPS, GUITARS, PICKUP_POSITIONS, PRESETS, ampById, guitarById, type Amp } from '@/lib/gear/catalog';
import type { Dict } from '@/i18n/I18nProvider';

const KNOBS = [
  { id: 'gain', label: 'GAIN' },
  { id: 'volume', label: 'VOLUME' },
  { id: 'treble', label: 'TREBLE' },
  { id: 'bass', label: 'BASS' },
];

/** PROPUESTA: selector de 5 posiciones como teclas con LED (una prendida). */
export function PickupSelector({ value, onChange, label }: { value: number; onChange?: (p: number) => void; label: string }) {
  const ds = useDS();
  return (
    <div className="dr-pick" role="group" aria-label={label}>
      <span className="dr-pick__lbl">{label}</span>
      <div className="dr-pick__keys">
        {PICKUP_POSITIONS.map((p) => (
          <ds.Button key={p.pos} variant="key" size="sm" led={value === p.pos} onClick={onChange ? () => onChange(p.pos) : undefined} disabled={!onChange && value !== p.pos} aria-label={`${p.pos}: ${p.label}`}>
            {p.pos}<span className="dr-pick__sub" aria-hidden>{p.short}</span>
          </ds.Button>
        ))}
      </div>
      <span className="dr-pick__name">{PICKUP_POSITIONS[value - 1]?.label}</span>
    </div>
  );
}

export function RigAmp({ amp, onAmp, ampId, g, preset }: { amp: Amp; onAmp: (a: Amp) => void; ampId: string; g: Dict['gear']; preset?: string }) {
  const model = ampById(ampId);
  return (
    <AmpPanelPro
      model={model.name}
      preset={preset}
      controls={KNOBS}
      values={{ gain: amp.gain, volume: amp.volume, treble: amp.treble, bass: amp.bass }}
      onChange={(id, v) => onAmp({ ...amp, [id]: v })}
      channel={model.hasChannelSwitch ? { label: g.channel, options: [g.clean, g.od], value: amp.mode === 'od' ? 1 : 0, onChange: (v) => onAmp({ ...amp, mode: v ? 'od' : 'clean' }) } : undefined}
    />
  );
}

export function RigPanel({ g }: { g: Dict['gear'] }) {
  const ds = useDS();
  const { rig, setRig, reset } = useRig();
  const guitar = guitarById(rig.guitarId);
  const amp = ampById(rig.ampId);
  const active = PRESETS.find((p) => p.pickup === rig.pickup && JSON.stringify(p.amp) === JSON.stringify(rig.amp));

  return (
    <div className="dr-rig">
      <section className="stack" aria-label={g.guitar}>
        <div className="dr-rig__models" role="group" aria-label={`${g.model} · ${g.guitar}`}>
          {GUITARS.map((m) => <ds.Button key={m.id} variant="key" size="sm" led={rig.guitarId === m.id} onClick={() => setRig({ guitarId: m.id })}>{m.name}</ds.Button>)}
        </div>
        <ds.SpecSheet name={guitar.name} subtitle={guitar.subtitle} kicker={g.specsKicker} specs={guitar.specs}>
          <PickupSelector value={rig.pickup} onChange={(p) => setRig({ pickup: p })} label={g.pickup} />
        </ds.SpecSheet>
      </section>
      <section className="stack" aria-label={g.amp}>
        <div className="dr-rig__models" role="group" aria-label={`${g.model} · ${g.amp}`}>
          {AMPS.map((m) => <ds.Button key={m.id} variant="key" size="sm" led={rig.ampId === m.id} onClick={() => setRig({ ampId: m.id })}>{m.name}</ds.Button>)}
        </div>
        <RigAmp amp={rig.amp} onAmp={(a) => setRig({ amp: a })} ampId={rig.ampId} g={g} preset={active?.label} />
        <div className="dr-rig__models" role="group" aria-label={g.preset}>
          <span className="dr-pick__lbl">{g.preset}</span>
          {PRESETS.map((p) => <ds.Button key={p.id} variant="key" size="sm" led={active?.id === p.id} onClick={() => setRig({ pickup: p.pickup, amp: { ...p.amp } })}>{p.label.toUpperCase()}</ds.Button>)}
          <ds.Button variant="key" size="sm" onClick={reset}>{g.reset}</ds.Button>
        </div>
        <ds.SpecSheet name={amp.name} subtitle={amp.subtitle} kicker={g.specsKicker} specs={amp.specs} />
        <ds.StickyNote tone="mustard" kicker={g.tipKicker} rotate={-1.5}>{g.tip}</ds.StickyNote>
      </section>
    </div>
  );
}

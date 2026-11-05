'use client';
import * as React from 'react';
import { useDS } from '@/ds/DSProvider';
import { Shell } from '@/components/Shell';
import { PageHead } from '@/components/PageHead';
import { pad } from '@/lib/nav';
import { save, today } from '@/lib/storage';
import { useStore } from '@/lib/useStore';
import { PracticeMetronome } from '@/components/practice/PracticeMetronome';
import { useTransport } from '@/lib/audio/useTransport';
import { useT } from '@/i18n/I18nProvider';

export function MetronomoView() {
  const ds = useDS();
  const store = useStore();
  const t = useT();
  const { t: tr, state } = useTransport(60);
  const bpm = state.bpm;
  const best = store.bpm.reduce((m, e) => Math.max(m, e.bpm), 0);
  const recent = store.bpm.slice(-5).reverse();

  function logClean() {
    save((s) => { s.bpm.push({ date: today(), bpm }); s.bpm = s.bpm.slice(-60); });
  }

  return (
    <Shell active="tecnica">
      <div className="page">
        <PageHead channel="tecnica" kicker="CLIC ACENTUADO EN EL 1 · TAP TEMPO" title="Metrónomo" lead="Empieza a 50-60 BPM. Tras 4 vueltas limpias seguidas, sube 5. Si fallas dos veces, baja 5." />
        <section className="section--tight row" style={{ gap: 'var(--space-xl)' }}>
          <PracticeMetronome state={state} min={40} max={200} onToggle={() => void tr.toggle()} onBpm={(v) => void tr.setBpm(v)} labels={t.deck} />
          <div className="stack" style={{ flex: '1 1 260px' }}>
            <p className="muted" style={{ margin: 0 }}>Gira la perilla (arrastra, rueda o flechas) o pulsa TAP al ritmo que quieres. Cuando toques algo limpio a este tempo, regístralo.</p>
            <div className="trainer__lcds">
              <ds.Readout label="MEJOR LIMPIO" value={pad(best)} unit="BPM" size="sm" />
            </div>
            <div className="trainer__keys">
              <ds.Button variant="key" onClick={logClean} aria-label={`Registrar ${bpm} BPM como tempo limpio`}>REGISTRAR {pad(bpm)}</ds.Button>
            </div>
            {recent.length ? (
              <ul className="mono caption" style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
                {recent.map((e, i) => <li key={i}>{e.date} · {pad(e.bpm)} BPM</li>)}
              </ul>
            ) : <p className="caption">Aún no registras tempos.</p>}
          </div>
        </section>
        <p className="caption section--tight read">El clic corre en el reloj de audio, no en el de la pantalla: no se desfasa. Si iOS suspende el navegador al bloquear la pantalla, se detiene; deja la pantalla encendida mientras practicas.</p>
      </div>
    </Shell>
  );
}

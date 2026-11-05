'use client';
// Consola de práctica: Metronome + TabStaff + cifrado sobre un mismo reloj.
// Speed trainer: 4 vueltas limpias (las marca Alan; el mic no juzga técnica) → +5 BPM hasta la meta.

import { useEffect, useMemo, useState } from 'react';
import { useDS } from '@/ds/DSProvider';
import { pad } from '@/lib/nav';
import { PracticeMetronome } from './PracticeMetronome';
import { TabScoreStaff } from './TabScore';
import { ChordChartView } from './ChordChartView';
import { useTransport } from '@/lib/audio/useTransport';
import { parseTab } from '@/lib/tabtext/parse';
import { parseChart } from '@/lib/chords/parse';
import { beatsPerBar, type Song } from '@/lib/song/schema';
import type { Dict } from '@/i18n/I18nProvider';

const CLEAN_REPS = 4;
const STEP_UP = 5;

export function PracticeDeck({ song, d, chartTitle, chordsLabel }: { song: Song; d: Dict['deck']; chartTitle: string; chordsLabel: string }) {
  const ds = useDS();
  const bpb = beatsPerBar(song.meta.time);
  const tabs = song.blocks.filter((b) => b.type === 'tab');
  const charts = song.blocks.filter((b) => b.type === 'chart');
  const [ti, setTi] = useState(0);
  const tabBlock = tabs[ti];
  const chartBlock = charts[0];

  const score = useMemo(() => (tabBlock ? parseTab(tabBlock.raw, { maxFret: 24 }) : null), [tabBlock]);
  const chart = useMemo(() => (chartBlock ? parseChart(chartBlock.raw, bpb) : null), [chartBlock, bpb]);

  const target = song.meta.bpm;
  const startBpm = Math.min(target, 60);
  const [countIn, setCountIn] = useState(true);
  const load = useMemo(() => ({
    tab: score, chart, beatsPerBar: bpb, stepsPerBeat: tabBlock?.stepsPerBeat ?? 4, capo: song.meta.capo,
    strum: chartBlock?.strum ?? 'ninguno', countIn,
  }), [score, chart, bpb, tabBlock, chartBlock, song.meta.capo, countIn]);
  const { t, state } = useTransport(startBpm, load);

  const [mix, setMix] = useState({ ...t.mix, chords: !score });
  const flip = (k: keyof typeof mix) => setMix((m) => ({ ...m, [k]: !m[k] }));
  // Si hay tab, los acordes arrancan apagados para oír la tab; se prenden con ACORD.
  useEffect(() => { t.mix = mix; }, [t, mix]);

  const [clean, setClean] = useState(0);
  const markClean = () => {
    const n = clean + 1;
    if (n >= CLEAN_REPS) { setClean(0); void t.setBpm(Math.min(target, state.bpm + STEP_UP)); } else setClean(n);
  };

  return (
    <div className="dr-deck">
      <div className="dr-deck__rack">
        <PracticeMetronome state={state} beats={bpb} onToggle={() => void t.toggle()} onBpm={(v) => void t.setBpm(v)} labels={d} />
        <div className="dr-deck__side">
          <div className="dr-deck__keys" role="group" aria-label="Mezcla">
            <ds.Button variant="key" size="sm" led={mix.click} onClick={() => flip('click')}>{d.click}</ds.Button>
            {score ? <ds.Button variant="key" size="sm" led={mix.tab} onClick={() => flip('tab')}>{d.tab}</ds.Button> : null}
            {chart ? <ds.Button variant="key" size="sm" led={mix.chords} onClick={() => flip('chords')}>{d.chords}</ds.Button> : null}
            <ds.Button variant="key" size="sm" led={countIn} onClick={() => setCountIn(!countIn)}>{d.countIn}</ds.Button>
          </div>
          <div className="dr-deck__read">
            <ds.Readout size="sm" label={state.counting ? d.countingIn : d.loops} value={pad(state.loops, 2)} />
            <ds.Readout size="sm" label={d.target} value={pad(target)} unit="BPM" />
          </div>
          <div className="dr-deck__trainer">
            <ds.Button variant="key" onClick={markClean} disabled={state.bpm >= target}>{d.clean} +1</ds.Button>
            <ds.Meter value={clean / CLEAN_REPS} segments={CLEAN_REPS} label={`${d.cleanCount} ${clean}/${CLEAN_REPS}`} channel="tecnica" />
          </div>
          <p className="dr-deck__note">{d.trainer}</p>
        </div>
      </div>

      {tabs.length > 1 ? (
        <div className="dr-deck__keys" role="group" aria-label="Tablatura">
          {tabs.map((b, i) => <ds.Button key={b.id} variant="key" size="sm" led={ti === i} onClick={() => setTi(i)}>{b.title ?? `TAB ${i + 1}`}</ds.Button>)}
        </div>
      ) : null}

      {score ? (
        <TabScoreStaff
          score={score}
          step={state.step}
          playing={state.playing}
          onToggle={() => void t.toggle()}
          bpm={state.bpm}
          title={tabBlock?.title}
          kicker={tabBlock?.label.toUpperCase()}
          channel="tecnica"
          legend={d.legend}
          playLabel={d.play}
          stopLabel={d.stop}
        />
      ) : null}

      {chart ? <ChordChartView chart={chart} activeBar={state.chordBar} title={chartBlock?.title ?? chartTitle} chordsLabel={chordsLabel} /> : null}
    </div>
  );
}

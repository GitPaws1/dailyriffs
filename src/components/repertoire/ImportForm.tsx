'use client';
/* PROPUESTA: formulario de importación (inputs surface-200 + hairline-strong, mono para tab). Una sola acción rellena. */

import { useId, useMemo, useState } from 'react';
import { useDS } from '@/ds/DSProvider';
import { TabScoreStaff } from '../practice/TabScore';
import { parseTab } from '@/lib/tabtext/parse';
import { cacheKey, slugify, validateSong, type Song, type SongInput } from '@/lib/song/schema';
import { localSongRepo } from '@/lib/repo/songs';
import type { Dict } from '@/i18n/I18nProvider';

const TIMES = ['4/4', '3/4', '6/8', '2/4', '12/8'] as const;
type Form = { title: string; artist: string; bpm: number; key: string; time: string; level: number; capo: number; tab: string; chart: string; steps: 2 | 4 };

export function buildUserSong(f: Form): SongInput {
  const blocks: SongInput['blocks'] = [];
  if (f.tab.trim()) blocks.push({ type: 'tab', id: 'tab', title: 'Tab', raw: f.tab, stepsPerBeat: f.steps, label: 'fuente del usuario' });
  if (f.chart.trim()) blocks.push({ type: 'chart', id: 'chart', title: 'Cifrado', raw: f.chart, strum: 'negras' });
  const patterns = ['rings', 'holo', 'sun', 'grid', 'teal'] as const;
  const h = [...cacheKey(f.title, f.artist)].reduce((a, c) => a + c.charCodeAt(0), 0);
  return {
    type: 'song',
    id: `${slugify(f.title)}-${slugify(f.artist || 'yo')}`.slice(0, 64),
    title: f.title.trim(),
    artist: f.artist.trim() || undefined,
    source: 'usuario',
    confidence: 'alta',
    level: f.level,
    meta: { key: f.key.trim() || undefined, bpm: f.bpm, time: f.time as SongInput['meta']['time'], capo: f.capo },
    blocks,
    cover: { pattern: patterns[h % patterns.length], disc: h % 2 ? 'vinyl' : 'cd' },
  };
}

export function ImportForm({ d, deck, onSaved }: { d: Dict['import']; deck: Dict['deck']; onSaved: (s: Song) => void }) {
  const ds = useDS();
  const id = useId();
  const [f, setF] = useState<Form>({ title: '', artist: '', bpm: 80, key: '', time: '4/4', level: 1, capo: 0, tab: '', chart: '', steps: 4 });
  const [res, setRes] = useState<{ errors: string[]; warnings: string[]; saved?: boolean } | null>(null);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => { setF((x) => ({ ...x, [k]: v })); setRes(null); };
  const preview = useMemo(() => (f.tab.trim() ? parseTab(f.tab) : null), [f.tab]);

  const check = () => {
    if (!f.tab.trim() && !f.chart.trim()) { setRes({ errors: [d.needOne], warnings: [] }); return null; }
    const v = validateSong(buildUserSong(f), { maxFret: 24 });
    setRes({ errors: v.errors, warnings: v.warnings });
    return v.ok ? v.song! : null;
  };
  const save = async () => {
    const s = check();
    if (!s) return;
    await localSongRepo.save(s);
    setRes((r) => ({ errors: [], warnings: r?.warnings ?? [], saved: true }));
    onSaved(s);
  };

  const text = (k: 'title' | 'artist' | 'key', label: string) => (
    <label className="dr-field" htmlFor={`${id}-${k}`}>
      <span className="dr-field__lbl">{label}</span>
      <input id={`${id}-${k}`} className="dr-input" value={f[k]} onChange={(e) => set(k, e.target.value)} autoComplete="off" />
    </label>
  );
  const num = (k: 'bpm' | 'level' | 'capo', label: string, min: number, max: number) => (
    <label className="dr-field" htmlFor={`${id}-${k}`}>
      <span className="dr-field__lbl">{label}</span>
      <input id={`${id}-${k}`} className="dr-input" type="number" inputMode="numeric" min={min} max={max} value={f[k]} onChange={(e) => set(k, Math.max(min, Math.min(max, parseInt(e.target.value, 10) || min)))} />
    </label>
  );

  return (
    <form className="stack" onSubmit={(e) => { e.preventDefault(); void save(); }}>
      <ds.SectionTitle align="left" as="h2" kicker="CH-03 · REPERTORIO · IMPORT" title={d.title} />
      <p className="lead">{d.summary}</p>
      <div className="dr-import__grid">
        {text('title', d.song)}
        {text('artist', d.artist)}
        {num('bpm', d.bpm, 30, 260)}
        {text('key', d.key)}
        <label className="dr-field" htmlFor={`${id}-time`}>
          <span className="dr-field__lbl">{d.time}</span>
          <select id={`${id}-time`} className="dr-input" value={f.time} onChange={(e) => set('time', e.target.value)}>
            {TIMES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
        {num('level', d.level, 1, 5)}
        {num('capo', d.capo, 0, 12)}
      </div>
      <label className="dr-field" htmlFor={`${id}-tab`}>
        <span className="dr-field__lbl">{d.tab}</span>
        <textarea id={`${id}-tab`} className="dr-input dr-input--tab" rows={8} spellCheck={false} autoCapitalize="off" autoCorrect="off" placeholder={d.tabPlaceholder} value={f.tab} onChange={(e) => set('tab', e.target.value)} />
      </label>
      <div className="row row--center" role="group" aria-label={d.steps}>
        <span className="dr-field__lbl">{d.steps}</span>
        <ds.Button variant="key" size="sm" led={f.steps === 4} onClick={() => set('steps', 4)}>{d.steps4}</ds.Button>
        <ds.Button variant="key" size="sm" led={f.steps === 2} onClick={() => set('steps', 2)}>{d.steps2}</ds.Button>
      </div>
      {preview && preview.systems.length ? <TabScoreStaff score={preview} step={-1} playing={false} bpm={f.bpm} title={d.preview} legend={deck.legend} /> : null}
      <label className="dr-field" htmlFor={`${id}-chart`}>
        <span className="dr-field__lbl">{d.chart}</span>
        <textarea id={`${id}-chart`} className="dr-input dr-input--tab" rows={6} spellCheck={false} autoCapitalize="off" autoCorrect="off" placeholder={d.chartPlaceholder} value={f.chart} onChange={(e) => set('chart', e.target.value)} />
      </label>
      {res?.errors.length ? <div className="dr-msg dr-msg--err" role="alert"><b>{d.errors}</b><ul>{res.errors.map((e) => <li key={e}>{e}</li>)}</ul></div> : null}
      {res?.warnings.length ? <div className="dr-msg" role="status"><b>{d.warnings}</b><ul>{res.warnings.map((e) => <li key={e}>{e}</li>)}</ul></div> : null}
      {res?.saved ? <p className="dr-msg dr-msg--ok" role="status">{d.saved}</p> : null}
      <div className="row row--center">
        <ds.Button type="submit" variant="primary" icon="●" disabled={!f.title.trim()}>{d.save}</ds.Button>
        <ds.Button variant="key" onClick={check}>{d.check}</ds.Button>
      </div>
    </form>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDS } from '@/ds/DSProvider';
import { Shell } from '@/components/Shell';
import { PracticeDeck } from '@/components/practice/PracticeDeck';
import { PickupSelector, RigAmp } from '@/components/gear/RigPanel';
import { href, pad } from '@/lib/nav';
import { localSongRepo } from '@/lib/repo/songs';
import { useRig } from '@/lib/gear/RigProvider';
import type { Amp } from '@/lib/gear/catalog';
import type { Song } from '@/lib/song/schema';
import { useT, type Dict } from '@/i18n/I18nProvider';

/** Export estático: una sola página lee ?id= y busca la canción en el repertorio local. */
export function CancionView() {
  const ds = useDS();
  const t = useT();
  const id = useSearchParams().get('id') ?? '';
  const [song, setSong] = useState<Song | null | undefined>(undefined);
  useEffect(() => { void localSongRepo.get(id).then(setSong); }, [id]);
  const s = t.song;
  const gear = song?.blocks.find((b) => b.type === 'gear');

  return (
    <Shell active="repertorio">
      <div className="page">
        <a className="link" href={href('/canciones/')}>{s.back}</a>
        {song === undefined ? <p className="kicker" aria-busy="true">···</p> : null}
        {song === null ? <p className="muted">{s.notFound}</p> : null}
        {song ? (
          <>
            <header className="section--tight stack read">
              <ds.SectionTitle align="left" as="h1" kicker={`CH-03 · ${t.rep.sources[song.source]} · ${pad(song.level)}`} eyebrow={song.artist} title={song.title} />
            </header>
            <section className="section--tight row" style={{ gap: 'var(--space-xl)', alignItems: 'flex-start' }}>
              <ds.SpecSheet
                className="dr-song__spec"
                name={song.meta.key ?? '—'}
                kicker={s.specKicker}
                subtitle={song.version}
                specs={[
                  [s.bpm, pad(song.meta.bpm)],
                  [s.time, song.meta.time],
                  [s.capo, song.meta.capo ? `${s.fret} ${song.meta.capo}` : s.noCapo],
                  [s.tuning, song.meta.tuning],
                  [s.source, t.rep.sources[song.source]],
                  [s.confidence, song.confidence.toUpperCase()],
                ]}
              />
              {song.checkpoint ? (
                <ds.StickyNote tone="sage" kicker={s.now.toUpperCase()} sign={song.checkpoint.success_criteria.toUpperCase()} rotate={1.5}>{song.checkpoint.action}</ds.StickyNote>
              ) : null}
            </section>
            <section className="section stack">
              <ds.SectionTitle align="left" as="h2" title={s.practice} />
              <PracticeDeck song={song} d={t.deck} chartTitle={s.chart} chordsLabel={s.chords} />
              <p className="caption read">{s.compare}</p>
            </section>
            {gear ? <SongTone pickup={gear.pickup} amp={gear.amp} note={gear.note} t={t} /> : null}
          </>
        ) : null}
      </div>
    </Shell>
  );
}

function SongTone({ pickup, amp: initial, note, t }: { pickup: number; amp: Amp; note?: string; t: Dict }) {
  const ds = useDS();
  const { rig } = useRig();
  const [amp, setAmp] = useState(initial);
  return (
    <section className="section stack" style={{ maxWidth: 860 }}>
      <ds.SectionTitle align="left" as="h2" title={t.song.sound} />
      <p className="lead">{note ?? t.song.soundNote}</p>
      <PickupSelector value={pickup} label={t.gear.pickup} />
      <RigAmp amp={amp} onAmp={setAmp} ampId={rig.ampId} g={t.gear} />
    </section>
  );
}

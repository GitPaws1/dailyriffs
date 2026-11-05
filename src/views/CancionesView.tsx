'use client';
import { useCallback, useEffect, useState } from 'react';
import { useDS } from '@/ds/DSProvider';
import type { Channel } from '@/ds/types';
import { Shell } from '@/components/Shell';
import { PageHead } from '@/components/PageHead';
import { ImportForm } from '@/components/repertoire/ImportForm';
import { href, pad } from '@/lib/nav';
import { isSeed, localSongRepo } from '@/lib/repo/songs';
import type { Song } from '@/lib/song/schema';
import { useT } from '@/i18n/I18nProvider';

const DISC: Record<Song['source'], Channel> = { usuario: 'repertorio', original: 'tecnica', 'dominio-publico': 'teoria', ia: 'instrumento' };

export function CancionesView() {
  const ds = useDS();
  const t = useT();
  const [songs, setSongs] = useState<Song[] | null>(null);
  const [level, setLevel] = useState<number | null>(null);
  const reload = useCallback(() => { void localSongRepo.list().then(setSongs); }, []);
  useEffect(reload, [reload]);
  const shown = (songs ?? []).filter((s) => level == null || s.level === level);

  return (
    <Shell active="repertorio">
      <div className="page">
        <PageHead channel="repertorio" kicker={t.rep.eyebrow.toUpperCase()} title={t.rep.title} lead={t.rep.summary} />
        <section className="section--tight stack">
          <div className="row row--center" role="group" aria-label={t.rep.level}>
            <ds.Button variant="key" size="sm" led={level == null} onClick={() => setLevel(null)}>{t.rep.all}</ds.Button>
            {[1, 2, 3, 4, 5].map((l) => <ds.Button key={l} variant="key" size="sm" led={level === l} onClick={() => setLevel(l)}>{t.rep.level} {l}</ds.Button>)}
            <span className="dr-gal__count">{pad(shown.length, 2)} {t.rep.count}</span>
          </div>
          {songs && !shown.length ? <p className="muted">{t.rep.empty}</p> : null}
          <ul className="dr-gal" aria-busy={songs == null}>
            {shown.map((s) => (
              <li key={s.id} className="stack">
                <ds.AlbumSleeve
                  href={href(`/canciones/tocar/?id=${s.id}`)}
                  title={s.title}
                  artist={s.artist}
                  keySig={s.meta.key ?? '—'}
                  bpm={s.meta.bpm}
                  level={s.level as 1 | 2 | 3 | 4 | 5}
                  pattern={s.cover?.pattern ?? 'rings'}
                  disc={s.cover?.disc ?? 'vinyl'}
                  discColor={DISC[s.source]}
                  code={`${t.rep.sources[s.source]} · ${s.meta.time}`}
                />
                <div className="dr-gal__meta">
                  <span>{t.rep.confidence} {s.confidence.toUpperCase()}</span>
                  {!isSeed(s.id) ? <ds.Button variant="key" size="sm" onClick={() => { void localSongRepo.remove(s.id).then(reload); }} aria-label={`${t.rep.delete} ${s.title}`}>{t.rep.delete}</ds.Button> : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
        <section className="section read">
          <ImportForm d={t.import} deck={t.deck} onSaved={reload} />
        </section>
      </div>
    </Shell>
  );
}

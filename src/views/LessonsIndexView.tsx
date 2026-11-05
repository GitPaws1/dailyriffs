'use client';
import { useDS } from '@/ds/DSProvider';
import { Shell } from '@/components/Shell';
import { PageHead } from '@/components/PageHead';
import { LESSONS, totalMinutes } from '@/lib/content';
import { CHANNEL_META } from '@/lib/contract';
import { href, pad } from '@/lib/nav';
import { useStore } from '@/lib/useStore';

export function LessonsIndexView() {
  const ds = useDS();
  const store = useStore();
  const done = LESSONS.filter((l) => store.done[l.id]).length;
  return (
    <Shell>
      <div className="page">
        <PageHead channel="tecnica" kicker={`LADO A · ${pad(LESSONS.length, 2)} LECCIONES · ${totalMinutes} MIN`} title="Lecciones" lead="En orden: cada una termina con algo concreto que tocar y 3 preguntas." />
        <section className="section--tight stack">
          <ds.Meter value={done / LESSONS.length} segments={15} label="Progreso de la ruta" />
          <div className="grid-cards">
            {LESSONS.map((l) => (
              <ds.LessonCard key={l.id} channel={l.channel} number={Number(l.id)} title={l.title} summary={l.summary}
                duration={`${pad(l.estimated_minutes, 2)} MIN · ${CHANNEL_META[l.channel].label.toUpperCase()}`} level={l.level}
                progress={store.done[l.id] ? 1 : 0} href={href(`/lecciones/${l.id}/`)} />
            ))}
          </div>
        </section>
      </div>
    </Shell>
  );
}

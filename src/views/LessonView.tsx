'use client';
import { useRouter } from 'next/navigation';
import { useDS } from '@/ds/DSProvider';
import { Shell } from '@/components/Shell';
import { PageHead } from '@/components/PageHead';
import { BlockRenderer } from '@/components/BlockRenderer';
import { LESSONS, lessonById } from '@/lib/content';
import { pad } from '@/lib/nav';
import { save } from '@/lib/storage';
import { useStore } from '@/lib/useStore';

export function LessonView({ id }: { id: string }) {
  const ds = useDS();
  const router = useRouter();
  const store = useStore();
  const lesson = lessonById(id);
  if (!lesson) return <Shell><div className="page"><p className="lead">No existe esa lección.</p></div></Shell>;
  const idx = LESSONS.indexOf(lesson);
  const prev = LESSONS[idx - 1], next = LESSONS[idx + 1];
  const done = Boolean(store.done[id]);

  function markDone() {
    save((s) => { s.done[id] = new Date().toISOString(); });
    if (next) router.push(`/lecciones/${next.id}/`);
  }

  return (
    <Shell active={lesson.channel}>
      <div className="page">
        <PageHead channel={lesson.channel}
          kicker={`${lesson.id} · ${pad(lesson.estimated_minutes, 2)} MIN · CONFIANZA ${lesson.confidence.toUpperCase()}`}
          title={lesson.title} lead={lesson.summary} />
        <article className="section--tight stack stack--lg">
          <div className="prose read">{lesson.text.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}</div>
          <BlockRenderer blocks={lesson.blocks} channel={lesson.channel} />
          <section className="checkpoint stack read" aria-labelledby="checkpoint">
            <p className="kicker">CHECKPOINT{lesson.checkpoint.bpm ? ` · ${pad(lesson.checkpoint.bpm)} BPM` : ''}</p>
            <h2 id="checkpoint" className="h3">Ahora tócalo</h2>
            <p style={{ margin: 0 }}>{lesson.checkpoint.action}</p>
            <p className="muted" style={{ margin: 0 }}><strong>Lo lograste si:</strong> {lesson.checkpoint.success_criteria}</p>
            <div className="row row--center">
              {done
                ? <><span className="kicker" style={{ color: 'var(--brass)' }}>✦ COMPLETA</span>
                    <ds.Button variant="secondary" size="sm" onClick={() => save((s) => { delete s.done[id]; })}>Desmarcar</ds.Button></>
                : <ds.Button variant="primary" icon="✦" onClick={markDone}>Lo logré</ds.Button>}
            </div>
            <p className="caption">Si te duele la muñeca o un tendón, para. Ardor leve en las yemas es normal los primeros días.</p>
          </section>
          <nav className="pager" aria-label="Lecciones">
            {prev ? <ds.Button variant="secondary" size="sm" onClick={() => router.push(`/lecciones/${prev.id}/`)}>◀ {prev.id} · {prev.title}</ds.Button> : <span />}
            {next ? <ds.Button variant="secondary" size="sm" onClick={() => router.push(`/lecciones/${next.id}/`)}>{next.id} · {next.title} ▶</ds.Button> : null}
          </nav>
        </article>
      </div>
    </Shell>
  );
}

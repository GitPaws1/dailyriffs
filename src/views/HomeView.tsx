'use client';
import { useRouter } from 'next/navigation';
import { useDS } from '@/ds/DSProvider';
import { Shell } from '@/components/Shell';
import { LESSONS, totalMinutes } from '@/lib/content';
import { CHANNEL_META } from '@/lib/contract';
import { href, pad } from '@/lib/nav';
import { useStore } from '@/lib/useStore';

const TOOLS = [
  { path: '/afinar/', name: 'Afinador', meta: 'CH-04 · MIC + REFERENCIA' },
  { path: '/diapason/', name: 'Diapasón', meta: 'CH-01 · TOCA Y ENCUENTRA NOTAS' },
  { path: '/acordes/', name: '20 acordes abiertos', meta: 'CH-02 · BIBLIOTECA + CAMBIOS' },
  { path: '/metronomo/', name: 'Metrónomo', meta: 'CH-02 · TEMPO Y REGISTRO' },
];

export function HomeView() {
  const ds = useDS();
  const router = useRouter();
  const store = useStore();
  const doneCount = LESSONS.filter((l) => store.done[l.id]).length;
  const next = LESSONS.find((l) => !store.done[l.id]) || LESSONS[LESSONS.length - 1];
  const allDone = doneCount === LESSONS.length;

  return (
    <Shell>
      <ds.PosterHero word="RIFF" jp="デイリーリフ" rain={0.18}
        kicker={`SESIÓN DE HOY · ${pad(next.estimated_minutes, 2)} MIN`}
        eyebrow="Guitarra eléctrica desde cero"
        title="Toca hoy, no mañana"
        summary="Afina, aprende tus primeros acordes y tócalos a tiempo. Sesiones de 10 a 15 minutos con la guitarra en las manos."
        cta={allDone ? 'Repasar lección 005' : `Lección ${next.id}: ${next.title}`}
        onCta={() => router.push(`/lecciones/${next.id}/`)}
        note={`${doneCount} de ${LESSONS.length} lecciones completas`}
        counter={`${pad(doneCount)}/${pad(LESSONS.length)}`} />
      <div className="page">
        <section className="section stack" aria-labelledby="ruta">
          <p className="kicker">RUTA · FASE 1</p>
          <h2 id="ruta" className="h3">Lado A: primeros diez minutos</h2>
          <div className="grid-tapes">
            <ds.CourseTape title="Primeros pasos" side="A" tone="mustard" code="DR-01" lessons={LESSONS.length} minutes={totalMinutes} channels={['instrumento', 'teoria', 'tecnica']} href={href(`/lecciones/${next.id}/`)} />
            <div className="stack">
              <ds.Meter value={doneCount / LESSONS.length} segments={15} label="Progreso de la ruta" />
              <p className="caption">Afinar, ubicar notas, dos acordes y ritmo. Cuando lo tengas limpio en tu celular, se abre la Fase 2: canciones.</p>
            </div>
          </div>
        </section>
        <section className="section stack" aria-labelledby="lecciones">
          <p className="kicker">{pad(LESSONS.length, 2)} LECCIONES · {totalMinutes} MIN</p>
          <h2 id="lecciones" className="h3">Lecciones</h2>
          <div className="grid-cards">
            {LESSONS.map((l) => (
              <ds.LessonCard key={l.id} channel={l.channel} number={Number(l.id)} title={l.title} summary={l.summary}
                duration={`${pad(l.estimated_minutes, 2)} MIN · ${CHANNEL_META[l.channel].label.toUpperCase()}`} level={l.level}
                progress={store.done[l.id] ? 1 : 0} href={href(`/lecciones/${l.id}/`)} />
            ))}
          </div>
        </section>
        <section className="section stack" aria-labelledby="herramientas">
          <p className="kicker">HERRAMIENTAS</p>
          <h2 id="herramientas" className="h3">Tu estudio</h2>
          <ul className="toollist">
            {TOOLS.map((t) => (
              <li key={t.path}><a href={href(t.path)}><span className="toollist__name">{t.name}</span><span className="kicker">{t.meta} ▶</span></a></li>
            ))}
          </ul>
        </section>
      </div>
    </Shell>
  );
}

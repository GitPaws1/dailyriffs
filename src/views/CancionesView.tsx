'use client';
import { useDS } from '@/ds/DSProvider';
import { Shell } from '@/components/Shell';
import { PageHead } from '@/components/PageHead';
import { href } from '@/lib/nav';

export function CancionesView() {
  const ds = useDS();
  return (
    <Shell active="repertorio">
      <div className="page">
        <PageHead channel="repertorio" kicker="FASE 2 · EN ESPERA" title="Canciones con IA" lead="Pides una canción y te llega su ficha, tres versiones (Mínima, Original, Completa), acordes por compás y el ajuste del Frontman." />
        <section className="section--tight row" style={{ gap: 'var(--space-xl)', alignItems: 'center' }}>
          <div className="prose read" style={{ flex: '1 1 320px' }}>
            <p>Cada canción mostrará su nivel de confianza y un botón de &ldquo;Suena distinto&rdquo; para corregirla. No se muestran letras completas ni tabs literales con derechos.</p>
            <p>Se activa cuando la Fase 1 funcione bien en tu celular. Mientras, lo que más te acerca a tocar canciones es esto: <a className="link" href={href('/lecciones/004/')}>Em ↔ Am a 20 cambios por minuto</a> y <a className="link" href={href('/lecciones/005/')}>ritmo a 60 BPM</a>.</p>
          </div>
          <ds.StickyNote tone="sage" kicker="Fase 2" rotate={2}>Afinador, diapasón, acordes y metrónomo primero. La IA es lo vistoso; esto es lo que enseña.</ds.StickyNote>
        </section>
      </div>
    </Shell>
  );
}

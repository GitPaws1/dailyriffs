'use client';
import { useDS } from '@/ds/DSProvider';
import { Shell } from '@/components/Shell';
import { PageHead } from '@/components/PageHead';

const STRINGS = [
  ['6ª (grave)', 'Mi · E2', '82.41', 'Mi'], ['5ª', 'La · A2', '110.00', 'Amigo'], ['4ª', 'Re · D3', '146.83', 'Dice:'],
  ['3ª', 'Sol · G3', '196.00', 'Sol,'], ['2ª', 'Si · B3', '246.94', 'Si'], ['1ª (aguda)', 'Mi · E4', '329.63', 'Más'],
];

export function AfinarView() {
  const ds = useDS();
  return (
    <Shell active="instrumento">
      <div className="page">
        <PageHead channel="instrumento" kicker="AFINACIÓN ESTÁNDAR · E A D G B E" title="Afina tu Strato" lead="Toca una cuerda, mira la aguja y gira la clavija hasta que marque ● AFINADA." />
        <section className="section--tight row" style={{ gap: 'var(--space-xl)' }}>
          <ds.VUTuner string={6} />
          <div className="stack read" style={{ flex: '1 1 300px' }}>
            <ol className="prose" style={{ margin: 0, paddingLeft: 20 }}>
              <li>Pulsa <strong>MIC</strong> y permite el micrófono. Acerca el celular a la bocina del Frontman o a la guitarra.</li>
              <li>Toca la 6ª cuerda al aire, sola, y déjala sonar.</li>
              <li><strong>▲ TENSA</strong>: la nota está baja, aprieta la clavija. <strong>▼ AFLOJA</strong>: está alta, aflójala. Ve de la 6ª a la 1ª.</li>
              <li>Sin micrófono: toca las teclas E A D G B E para oír la referencia y compara de oído.</li>
            </ol>
            <p className="caption">El micrófono lee una nota a la vez. Con ruido, o si tocas varias cuerdas, la lectura falla; en ese caso usa tu afinador de clip.</p>
          </div>
        </section>
        <section className="section row" style={{ gap: 'var(--space-xl)', alignItems: 'center' }}>
          <ds.StickyNote tone="mustard" kicker="Truco" rotate={-2}>Afina subiendo hacia la nota. Si te pasas, baja y vuelve a subir: la cuerda se asienta y aguanta más.</ds.StickyNote>
          <div className="table-wrap read" style={{ flex: '1 1 320px' }}>
            <table className="table">
              <caption className="kicker">REFERENCIA · MI AMIGO DICE: SOL, SI MÁS</caption>
              <thead><tr><th>Cuerda</th><th>Nota</th><th>Hz</th><th>Truco</th></tr></thead>
              <tbody>{STRINGS.map((r) => <tr key={r[0]}>{r.map((c, i) => <td key={i}>{c}</td>)}</tr>)}</tbody>
            </table>
          </div>
        </section>
      </div>
    </Shell>
  );
}

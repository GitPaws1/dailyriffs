'use client';
import { useDS } from '@/ds/DSProvider';
import { Shell } from '@/components/Shell';
import { PageHead } from '@/components/PageHead';
import { NoteGame } from '@/components/NoteGame';

export function DiapasonView() {
  const ds = useDS();
  return (
    <Shell active="teoria">
      <div className="page">
        <PageHead channel="teoria" kicker="12 TRASTES · E A D G B E" title="Tu diapasón" lead="Toca cualquier traste: suena y se marca. Cada traste sube un semitono; en el 12 se repite la cuerda al aire, una octava arriba." />
        <section className="section--tight stack">
          <ds.Fretboard frets={12} title="LIBRE · TOCA PARA MARCAR, VUELVE A TOCAR PARA BORRAR" />
          <p className="caption">En el celular desliza el diapasón de lado para ver los trastes altos.</p>
        </section>
        <section className="section stack" aria-labelledby="juego">
          <p className="kicker">CH-01 · JUEGO · NOTAS NATURALES</p>
          <h2 id="juego" className="h3">Encuentra la nota</h2>
          <p className="muted read" style={{ margin: 0 }}>Empieza con las cuerdas 6 y 5: ahí están las raíces de los acordes. Cuando hagas 10 seguidas, activa las 6 cuerdas.</p>
          <NoteGame />
        </section>
      </div>
    </Shell>
  );
}

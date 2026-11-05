import type { TabBlock } from './contract';
/** Contrato `tab` (eventos por tiempo) → filas ASCII para TabStaff, 1ª cuerda primero. Una columna por corchea. */
export function tabToLines(b: TabBlock): string[] {
  const beats = Number(b.time.split('/')[0]) || 4;
  const names = ['e', 'B', 'G', 'D', 'A', 'E'];
  const rows: string[][] = names.map(() => []);
  for (const bar of b.bars) {
    for (let slot = 0; slot < beats * 2; slot++) {
      const beat = 1 + slot / 2;
      const hits = bar.events.filter((e) => e.beat === beat);
      const w = Math.max(1, ...hits.map((e) => String(e.fret).length));
      rows.forEach((r, i) => {
        const e = hits.find((h) => h.string === i + 1);
        const cell = e ? String(e.fret) : '';
        r.push('-' + cell.padEnd(w, '-'));
      });
    }
    rows.forEach((r) => r.push('-|'));
  }
  return rows.map((r, i) => `${names[i]}|${r.join('')}`);
}

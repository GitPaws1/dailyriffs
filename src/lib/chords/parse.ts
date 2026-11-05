// Parser de cifrado por compases. Formatos aceptados:
//   [Verso] x2
//   | Am . C . | G | D |       ← '.' o '/' repite el acorde anterior un tiempo
//   Am C G D                  ← línea solo de acordes: un acorde por compás
// Cualquier otra línea se conserva tal cual como texto de la sección (es material del usuario).

import { isChord, normChord } from './shapes';

export interface ChartBar { slots: string[] }   // acorde por tiempo dentro del compás ('' = silencio)
export interface ChartSection { name: string; repeat: number; bars: ChartBar[]; text: string[] }
export interface ChordChart { sections: ChartSection[]; chords: string[]; unknown: string[]; bars: number }

const SECTION = /^\s*\[([^\]]{1,40})\]\s*(?:x\s*(\d{1,2}))?\s*$/i;
const REPEAT_ONLY = /^x\s*(\d{1,2})$/i;

export function parseChart(raw: string, beatsPerBar = 4): ChordChart {
  const sections: ChartSection[] = [];
  const unknown = new Set<string>();
  const used = new Set<string>();
  let cur: ChartSection | null = null;
  const ensure = () => {
    if (!cur) { cur = { name: 'Progresión', repeat: 1, bars: [], text: [] }; sections.push(cur); }
    return cur;
  };

  const toBar = (seg: string): ChartBar | null => {
    const toks = seg.trim().split(/\s+/).filter(Boolean);
    if (!toks.length) return null;
    const names: string[] = [];
    for (const t of toks) {
      if (t === '.' || t === '/' || t === '%') { names.push(names[names.length - 1] ?? ''); continue; }
      if (t === '-' || t === 'N.C.' || t === 'NC') { names.push(''); continue; }
      if (isChord(t)) { const n = normChord(t); names.push(n); used.add(n); } else { unknown.add(t); return null; }
    }
    // Reparte los acordes escritos en los tiempos del compás.
    if (names.length === beatsPerBar) return { slots: names };
    const slots: string[] = [];
    for (let b = 0; b < beatsPerBar; b++) slots.push(names[Math.floor((b * names.length) / beatsPerBar)]);
    return { slots };
  };

  for (const line of raw.replace(/\r\n?/g, '\n').split('\n')) {
    const t = line.trim();
    if (!t) continue;
    const sec = SECTION.exec(t);
    if (sec) {
      cur = { name: sec[1].trim(), repeat: sec[2] ? parseInt(sec[2], 10) : 1, bars: [], text: [] };
      sections.push(cur);
      continue;
    }
    const rep = REPEAT_ONLY.exec(t);
    if (rep) { ensure().repeat = parseInt(rep[1], 10); continue; }

    if (t.includes('|')) {
      const segs = t.split('|').map((s) => s.trim()).filter(Boolean);
      const bars = segs.map(toBar);
      if (bars.length && bars.every(Boolean)) { ensure().bars.push(...(bars as ChartBar[])); continue; }
    } else {
      const toks = t.split(/\s+/);
      if (toks.every((x) => isChord(x) || x === '-')) {
        for (const x of toks) {
          const n = x === '-' ? '' : normChord(x);
          if (n) used.add(n);
          ensure().bars.push({ slots: Array(beatsPerBar).fill(n) });
        }
        continue;
      }
    }
    // Línea que no es cifrado: se guarda tal cual.
    ensure().text.push(line.replace(/\s+$/, ''));
  }

  const bars = sections.reduce((a, s) => a + s.bars.length * s.repeat, 0);
  // Tokens que fallaron dentro de una línea de texto no cuentan como error.
  return { sections, chords: [...used], unknown: [...unknown], bars };
}

/** Aplana a la secuencia que suena, respetando repeticiones. */
export function flattenChart(chart: ChordChart): ChartBar[] {
  return chart.sections.flatMap((s) => Array.from({ length: s.repeat }, () => s.bars).flat());
}

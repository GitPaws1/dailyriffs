// Parser de tablatura ASCII tal como se pega (Ultimate-Guitar, Songsterr exportado, cuaderno).
// Cada carácter de una línea es una subdivisión de tiempo (stepsPerBeat); '|' es barra y no consume tiempo.

export type Tech = 'h' | 'p' | 'b' | 'r' | '/' | '\\' | '~' | 'x';

export interface TabNote {
  string: number;        // 1 = e aguda … 6 = E grave
  fret: number;          // −1 = nota muerta (x)
  legato?: 'h' | 'p' | '/' | '\\';
  bendTo?: number;       // traste destino del bend
  vibrato?: boolean;
}

export interface TabEvent { step: number; notes: TabNote[] }

export interface TabSystem {
  labels: string[];      // 6 etiquetas, aguda primero
  lines: string[];       // 6 cuerpos normalizados (mismo ancho), aguda primero
  firstStep: number;
  stepCols: number[];    // columna en `lines` de cada step del sistema
}

export interface TabScore {
  systems: TabSystem[];
  events: TabEvent[];
  steps: number;
  barSteps: number[];    // step en que arranca cada compás
  maxFret: number;
  warnings: string[];
}

const TAB_LINE = /^\s*([A-Ga-g][#b]?)?\s*[|:]?[-0-9|hpbrx/\\~()<>*.^=sStT\s]*-[-0-9|hpbrx/\\~()<>*.^=sStT\s]*$/;
const LABEL = /^\s*([A-Ga-g][#b]?)\s*[|:]/;

function isTabLine(l: string): boolean {
  const t = l.replace(/\s+$/, '');
  if (t.length < 4) return false;
  if ((t.match(/-/g) ?? []).length < 2) return false;
  return TAB_LINE.test(t);
}

function splitLabel(l: string): [string, string] {
  const m = LABEL.exec(l);
  if (m) return [m[1], l.slice(m[0].length)];
  const i = l.indexOf('|');
  if (i >= 0 && i <= 3) return [l.slice(0, i).trim(), l.slice(i + 1)];
  return ['', l.trim()];
}

const STD_HIGH_FIRST = ['e', 'B', 'G', 'D', 'A', 'E'];

/** Detecta si el bloque viene grave-arriba (E A D G B e) y lo voltea a aguda-arriba. */
function orient(labels: string[], bodies: string[]): [string[], string[]] {
  const l = labels.map((x) => x.trim());
  const lowFirst = l[1]?.toUpperCase() === 'A' && l[4]?.toUpperCase() === 'B';
  if (lowFirst) return [[...l].reverse(), [...bodies].reverse()];
  return [l.map((x, i) => x || STD_HIGH_FIRST[i]), bodies];
}

export interface ParseTabOpts { maxFret?: number }

export function parseTab(raw: string, opts: ParseTabOpts = {}): TabScore {
  const maxAllowed = opts.maxFret ?? 24;
  const warnings: string[] = [];
  const rawLines = raw.replace(/\r\n?/g, '\n').replace(/\t/g, '    ').split('\n');

  // 1) Agrupar corridas de 6 líneas de tab.
  const blocks: string[][] = [];
  let run: string[] = [];
  const flush = () => {
    if (run.length >= 6) {
      for (let i = 0; i + 6 <= run.length; i += 6) blocks.push(run.slice(i, i + 6));
      if (run.length % 6) warnings.push(`Bloque con ${run.length} líneas: se ignoraron ${run.length % 6}.`);
    } else if (run.length) warnings.push(`Bloque de ${run.length} líneas ignorado: una tab de guitarra lleva 6.`);
    run = [];
  };
  for (const l of rawLines) {
    if (isTabLine(l)) run.push(l); else flush();
  }
  flush();

  const systems: TabSystem[] = [];
  const events: TabEvent[] = [];
  const barSteps: number[] = [];
  let step = 0;
  let maxFret = 0;

  for (const block of blocks) {
    const split = block.map(splitLabel);
    let [labels, bodies] = orient(split.map((s) => s[0]), split.map((s) => s[1].replace(/\s+$/, '')));
    const width = Math.max(...bodies.map((b) => b.length));
    bodies = bodies.map((b) => b.padEnd(width, '-'));

    const firstStep = step;
    const stepCols: number[] = [];
    // Las líneas a veces no alinean sus '|': una columna es barra si la mayoría la marca.
    const isBar = (c: number) => bodies.filter((b) => b[c] === '|').length >= 4;

    let barOpen = true;
    if (systems.length === 0 || !isBar(0)) barSteps.push(step);
    for (let c = 0; c < width; c++) {
      if (isBar(c)) {
        if (!barOpen && c < width - 1) barSteps.push(step);
        barOpen = false;
        continue;
      }
      barOpen = false;
      const notes: TabNote[] = [];
      for (let si = 0; si < 6; si++) {
        const b = bodies[si];
        const ch = b[c];
        const prev = c > 0 ? b[c - 1] : '';
        if (ch === 'x' || ch === 'X') {
          if (!/[0-9]/.test(prev)) notes.push({ string: si + 1, fret: -1 });
          continue;
        }
        if (!/[0-9]/.test(ch) || /[0-9]/.test(prev)) continue;
        const m = /^[0-9]+/.exec(b.slice(c))!;
        let digits = m[0];
        // "1012" pegado: dos números de 2 cifras; nos quedamos con el primero válido.
        if (digits.length > 2) digits = digits.slice(0, 2);
        let fret = parseInt(digits, 10);
        if (fret > maxAllowed) {
          warnings.push(`Traste ${fret} en cuerda ${si + 1} fuera de rango; se leyó ${digits[0]}.`);
          fret = parseInt(digits[0], 10);
        }
        // ¿Es destino de una técnica? (7b9: el 9 no se pulsa; 5h7: el 7 se liga)
        const before = c > 0 ? b[c - 1] : '';
        if (before === 'b' || before === 'r') continue;
        const note: TabNote = { string: si + 1, fret };
        if (before === 'h' || before === 'p' || before === '/' || before === '\\') note.legato = before;
        const after = b[c + digits.length];
        if (after === 'b') {
          const t = /^[0-9]+/.exec(b.slice(c + digits.length + 1));
          note.bendTo = t ? parseInt(t[0].slice(0, 2), 10) : fret + 2;
        }
        if (after === '~') note.vibrato = true;
        maxFret = Math.max(maxFret, fret);
        notes.push(note);
      }
      stepCols.push(c);
      if (notes.length) events.push({ step, notes });
      step++;
    }
    systems.push({ labels, lines: bodies, firstStep, stepCols });
  }

  if (!blocks.length) warnings.push('No encontré tablatura: necesito 6 líneas seguidas tipo e|---0---|.');
  if (maxFret > 22) warnings.push(`Llega al traste ${maxFret}: tu Strato tiene 21–22.`);
  const uniq = [...new Set(barSteps)].filter((s) => s < step);
  return { systems, events, steps: step, barSteps: uniq.length ? uniq : [0], maxFret, warnings };
}

/** Ubica un step global dentro de sus sistemas (para el cursor del TabStaff). */
export function locateStep(score: TabScore, step: number): { sys: number; col: number } | null {
  for (let i = score.systems.length - 1; i >= 0; i--) {
    const s = score.systems[i];
    if (step >= s.firstStep) {
      const col = s.stepCols[step - s.firstStep];
      return col == null ? null : { sys: i, col };
    }
  }
  return null;
}

// Valida el contenido determinista (acordes y lecciones) con tonal.js antes de construir.
import { readFileSync, readdirSync } from 'node:fs';
import { Chord, Note } from 'tonal';

const root = new URL('../src/data/', import.meta.url);
const OPEN_MIDI = { 1: 64, 2: 59, 3: 55, 4: 50, 5: 45, 6: 40 };
const SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const errors = [];
const fail = (where, msg) => errors.push(`${where}: ${msg}`);
const noteAt = (s, f) => SHARPS[(OPEN_MIDI[s] + f) % 12];

function checkChord(c, where) {
  if (!Array.isArray(c.frets) || c.frets.length !== 6) return fail(where, 'frets debe tener 6 valores');
  if (!Array.isArray(c.fingers) || c.fingers.length !== 6) return fail(where, 'fingers debe tener 6 valores');
  c.frets.forEach((f, i) => {
    if (!Number.isInteger(f) || f < -1 || f > 22) fail(where, `traste inválido ${f}`);
    const fg = c.fingers[i];
    if (!Number.isInteger(fg) || fg < 0 || fg > 4) fail(where, `dedo inválido ${fg}`);
    if (f > 0 && fg === 0) fail(where, `cuerda ${6 - i} pisada sin dedo`);
    if (f <= 0 && fg !== 0) fail(where, `cuerda ${6 - i} al aire/muda con dedo`);
  });
  const ch = Chord.get(c.name);
  if (ch.empty) return fail(where, `tonal no reconoce ${c.name}`);
  const want = new Set(ch.notes.map(Note.chroma));
  const sounding = c.frets.map((f, i) => (f < 0 ? null : (OPEN_MIDI[6 - i] + f))).filter((m) => m !== null);
  const got = new Set(sounding.map((m) => m % 12));
  for (const g of got) if (!want.has(g)) fail(where, `${c.name} contiene una nota ajena (${SHARPS[g]})`);
  const fifth = Note.chroma(Note.transpose(ch.tonic, '5P'));
  for (const w of want) if (!got.has(w) && w !== fifth) fail(where, `${c.name} omite ${SHARPS[w]} (solo se permite omitir la quinta)`);
  const bass = Math.min(...sounding) % 12;
  if (bass !== Note.chroma(ch.tonic)) fail(where, `${c.name} no tiene la raíz en el bajo`);
  if (c.barre) {
    const { fret, from, to } = c.barre;
    for (let i = from; i <= to; i++) if (c.frets[i] < fret) fail(where, 'cejilla por encima de una cuerda más grave');
  }
}

const lib = JSON.parse(readFileSync(new URL('chords.json', root)));
const byName = new Map();
lib.chords.forEach((c) => { checkChord(c, `acorde ${c.name}`); byName.set(c.name, c); });
if (lib.chords.length !== 20) fail('chords.json', `se esperaban 20 acordes, hay ${lib.chords.length}`);

const dir = new URL('lessons/', root);
const files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
const CH = ['teoria', 'tecnica', 'repertorio', 'instrumento'];
for (const file of files) {
  const L = JSON.parse(readFileSync(new URL(file, dir)));
  const w = `lección ${file}`;
  for (const k of ['id', 'type', 'title', 'level', 'estimated_minutes', 'confidence', 'text', 'blocks', 'checkpoint', 'channel', 'summary']) if (L[k] == null) fail(w, `falta ${k}`);
  if (L.type !== 'lesson') fail(w, 'type debe ser lesson');
  if (!CH.includes(L.channel)) fail(w, 'canal inválido');
  if (!['alta', 'media', 'baja'].includes(L.confidence)) fail(w, 'confidence inválida');
  if (L.title.split(/\s+/).length > 4) fail(w, 'título de más de 4 palabras');
  let quizzes = 0;
  L.blocks.forEach((b, i) => {
    const bw = `${w} bloque ${i} (${b.type})`;
    if (b.type === 'chord') {
      checkChord(b, bw);
      const ref = byName.get(b.name);
      if (!ref) fail(bw, 'acorde fuera de la biblioteca');
      else if (JSON.stringify(ref.frets) !== JSON.stringify(b.frets) || JSON.stringify(ref.fingers) !== JSON.stringify(b.fingers)) fail(bw, 'no coincide con la biblioteca');
    } else if (b.type === 'fretboard') {
      b.highlight.forEach((n) => {
        if (n.string < 1 || n.string > 6 || n.fret < b.range[0] || n.fret > b.range[1]) fail(bw, `nota fuera de rango ${n.string}:${n.fret}`);
        if (n.label && n.label !== noteAt(n.string, n.fret)) fail(bw, `etiqueta ${n.label} ≠ ${noteAt(n.string, n.fret)} en ${n.string}:${n.fret}`);
      });
    } else if (b.type === 'tab') {
      const beats = Number(b.time.split('/')[0]);
      b.bars.forEach((bar) => bar.events.forEach((e) => {
        if (e.string < 1 || e.string > 6 || e.fret < 0 || e.fret > 22) fail(bw, `evento imposible ${e.string}:${e.fret}`);
        if (e.beat < 1 || e.beat >= beats + 1 || (e.beat * 2) % 1 !== 0) fail(bw, `tiempo inválido ${e.beat}`);
      }));
      if (b.label !== 'ejercicio propio' && b.label !== 'aproximación') fail(bw, 'tab sin etiqueta de origen');
    } else if (b.type === 'exercise') {
      (b.chords || []).forEach((n) => { if (!byName.has(n)) fail(bw, `acorde ${n} fuera de la biblioteca`); });
      if (!(b.duration_sec > 0 && b.target > 0)) fail(bw, 'duración o meta inválida');
    } else if (b.type === 'quiz') {
      quizzes++;
      if (!(b.answer >= 0 && b.answer < b.options.length)) fail(bw, 'respuesta fuera de opciones');
      if (!b.why) fail(bw, 'falta why');
    } else if (b.type === 'gear') {
      const a = b.amp || {};
      if (!['Clean', 'O.D.'].includes(a.mode)) fail(bw, 'modo de ampli inválido');
      for (const k of ['gain', 'volume', 'treble', 'bass']) if (!(a[k] >= 0 && a[k] <= 10)) fail(bw, `${k} fuera de 0-10`);
    } else fail(bw, 'tipo de bloque sin componente');
  });
  if (quizzes !== 3) fail(w, `debe cerrar con 3 preguntas, tiene ${quizzes}`);
  if (!L.checkpoint.action || !L.checkpoint.success_criteria) fail(w, 'checkpoint incompleto');
}

if (errors.length) { console.error('✗ Contenido inválido:\n  ' + errors.join('\n  ')); process.exit(1); }
console.log(`✓ ${lib.chords.length} acordes y ${files.length} lecciones validados con tonal.js`);

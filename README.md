# DailyRiffs

Web para aprender guitarra eléctrica desde cero, tocando. Fase 1: afinador, diapasón, 20 acordes abiertos, metrónomo y 5 lecciones. Estética: estudio de grabación de los 80 sobre negro puro (sistema de diseño DailyRiffs).

## Correr

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # valida contenido con tonal.js y exporta estático a out/
```

Se despliega solo a GitHub Pages con cada push a `main` (activa *Settings → Pages → Source: GitHub Actions*). También sirve en Vercel o Cloudflare sin cambios.

## Qué hay

| Ruta | Canal | Qué hace |
|---|---|---|
| `/` | — | Riff del día, ruta (cassette), lecciones con progreso, herramientas |
| `/afinar/` | CH-04 | `VUTuner` con micrófono (una nota a la vez) y tonos de referencia |
| `/diapason/` | CH-01 | `Fretboard` libre + juego "Encuentra la nota" con racha |
| `/acordes/` | CH-02 | 20 acordes abiertos filtrables + entrenador de cambios (60 s) |
| `/metronomo/` | CH-02 | `Metronome` con tap tempo y registro de BPM limpio |
| `/lecciones/001-005/` | varios | Lecciones del contrato JSON: bloques, 3 preguntas, checkpoint |
| `/canciones/` | CH-03 | Aviso de Fase 2 (canciones con IA) |

El progreso se guarda en el navegador (`localStorage`), por dispositivo.

## Arquitectura

- **Next.js 15 + TypeScript**, export estático (`output: 'export'`). Sin servidor en Fase 1.
- **Sistema de diseño**: `public/ds/bundle.js` y `src/styles/ds-bundle.css` son copia exacta del bundle del proyecto de diseño (mismo SHA-256). `DSProvider` lo carga con la instancia de React de la app. `tokens.css` transcribe `tokens.json`; las fuentes son instancias woff2 generadas desde google/fonts (OFL, ver `licenses/`).
- `src/styles/responsive.css` adapta la geometría de los componentes a 360 px (el bundle está pensado a 1200 px). No toca colores ni tipos.
- **Contenido determinista** en JSON versionado: `src/data/chords.json` y `src/data/lessons/*.json`, con el contrato IA → web. `npm run validate` comprueba con tonal.js que cada acorde contenga solo sus notas (solo se permite omitir la quinta), raíz en el bajo, dedos coherentes, etiquetas del mástil correctas, tabs posibles y 3 preguntas por lección.
- Extensiones al contrato para la biblioteca estática: `id`, `channel`, `summary` en la lección; `note` (texto antes del bloque) en cada bloque; `chords` y `bpm` en `exercise`.

## Límites honestos

- El afinador lee **una nota a la vez**; con ruido o acordes falla.
- El metrónomo del sistema usa el reloj del navegador: con pantalla bloqueada puede pausarse o desfasarse.
- Sin componentes aún (no construidos, esperan aprobación de diseño): patrón de rasgueo, timeline de canción, chat del tutor, onboarding, pantalla de canción.

## Siguiente

Fase 2 (canciones con IA, caché, validador, "Suena distinto") cuando la Fase 1 funcione bien en el celular.

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
| `/afinar/` | CH-04 | `VUTunerPro`: detección McLeod por cuadro, LOCK con histéresis, 9 LEDs, LCD, AUTO, vibración al afinar |
| `/diapason/` | CH-01 | `Fretboard` libre + juego "Encuentra la nota" con racha |
| `/acordes/` | CH-02 | 20 acordes abiertos filtrables + entrenador de cambios (60 s) |
| `/metronomo/` | CH-02 | `Metronome` con tap tempo y registro de BPM limpio |
| `/lecciones/001-005/` | varios | Lecciones del contrato JSON: bloques, 3 preguntas, checkpoint |
| `/canciones/` | CH-03 | Repertorio (AlbumSleeve), filtros por nivel, **Pega tu tab** (tab/cifrado exacto, guardado local) |
| `/canciones/tocar/?id=` | CH-03 | Ficha, consola de práctica (metrónomo + tab + cifrado en un solo reloj de audio), speed trainer, tu sonido |
| `/equipo/` | CH-04 | Strato SSS + Frontman 10G por defecto: selector de 5, perillas, Clean/O.D., presets |

El progreso se guarda en el navegador (`localStorage`), por dispositivo.

## Arquitectura

- **Next.js 15 + TypeScript**, export estático (`output: 'export'`). Sin servidor en Fase 1.
- **Sistema de diseño**: `public/ds/bundle.js` y `src/styles/ds-bundle.css` son copia exacta del bundle del proyecto de diseño (mismo SHA-256). `DSProvider` lo carga con la instancia de React de la app. `tokens.css` transcribe `tokens.json`; las fuentes son instancias woff2 generadas desde google/fonts (OFL, ver `licenses/`).
- `src/styles/responsive.css` adapta la geometría de los componentes a 360 px (el bundle está pensado a 1200 px). No toca colores ni tipos.
- **Contenido determinista** en JSON versionado: `src/data/chords.json` y `src/data/lessons/*.json`, con el contrato IA → web. `npm run validate` comprueba con tonal.js que cada acorde contenga solo sus notas (solo se permite omitir la quinta), raíz en el bajo, dedos coherentes, etiquetas del mástil correctas, tabs posibles y 3 preguntas por lección.
- Extensiones al contrato para la biblioteca estática: `id`, `channel`, `summary` en la lección; `note` (texto antes del bloque) en cada bloque; `chords` y `bpm` en `exercise`.

## Límites honestos

- El afinador lee **una nota a la vez**; con ruido o acordes falla.
- Metrónomo, tab y acordes corren en `Tone.Transport` (reloj de audio): no se desfasan; si iOS suspende Safari con la pantalla bloqueada, se detienen.
- En iPhone, el switch de silencio apaga el audio web.
- Sin componentes aún (no construidos, esperan aprobación de diseño): patrón de rasgueo, timeline de canción, chat del tutor, onboarding, pantalla de canción.

## Fases 1-4 (nov 2026)

- `src/lib/tabtext` parser de tab ASCII; `src/lib/chords` cifrado por compases + formas (reusa `data/chords.json`); `src/lib/audio` motor, afinador, agenda y transport; `src/lib/song` esquema zod, seeds, prompt; `src/lib/gear` catálogo y RigProvider; `src/i18n` diccionarios es/en (cliente: el export estático no tiene proxy).
- `npm test`: 49 pruebas (vitest). Propuestas sin componente aprobado: cifrado por compases, formulario de importación, selector de pastilla, canal Clean/O.D. (`src/styles/app-ext.css`).
- Canciones con derechos entran por "Pega tu tab"; las semillas son originales o de dominio público. La búsqueda con IA necesita servidor (prompt listo en `src/lib/song/prompt.ts`).

## Siguiente

Fase 2 (canciones con IA, caché, validador, "Suena distinto") cuando la Fase 1 funcione bien en el celular.

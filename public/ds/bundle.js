/* @ds-bundle: {"format":4,"namespace":"DailyRiffs","components":[{"name":"PosterHero"},{"name":"Button"},{"name":"ChannelTag"},{"name":"SectionTitle"},{"name":"NavBar"},{"name":"LessonCard"},{"name":"CourseTape"},{"name":"AlbumSleeve"},{"name":"Meter"},{"name":"StickyNote"},{"name":"KeycapWord"},{"name":"Readout"},{"name":"Metronome"},{"name":"VUTuner"},{"name":"AmpPanel"},{"name":"RackUnit"},{"name":"QuizConsole"},{"name":"Fretboard"},{"name":"ChordDiagram"},{"name":"TabStaff"},{"name":"AnatomyCallout"},{"name":"AnatomyMap"},{"name":"SpecSheet"},{"name":"HistoryTimeline"},{"name":"Statement"},{"name":"HalftoneImage"},{"name":"TabRain"}]} */
(function () {
  var React = window.React;
  var h = React.createElement;
  var useState = React.useState, useEffect = React.useEffect, useRef = React.useRef, useCallback = React.useCallback;

  function cx() { return Array.prototype.filter.call(arguments, Boolean).join(' '); }
  function omit(o, keys) { var r = {}; for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k) && keys.indexOf(k) < 0) r[k] = o[k]; return r; }
  function pad(n, w) { var s = String(n); while (s.length < (w || 3)) s = '0' + s; return s; }
  function reducedMotion() { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }

  var CHANNELS = {
    teoria: { code: 'CH-01', label: 'Teoría', jp: 'セオリー' },
    tecnica: { code: 'CH-02', label: 'Técnica', jp: 'テクニック' },
    repertorio: { code: 'CH-03', label: 'Repertorio', jp: 'レパートリー' },
    instrumento: { code: 'CH-04', label: 'Instrumento', jp: 'ギター' }
  };

  /* ---------- audio: Karplus-Strong plucked string + metronome click ---------- */
  var audio = null;
  function ctx() {
    if (audio) return audio;
    try { var AC = window.AudioContext || window.webkitAudioContext; audio = AC ? new AC() : null; } catch (e) { audio = null; }
    return audio;
  }
  var OPEN = [329.63, 246.94, 196.0, 146.83, 110.0, 82.41]; /* string 1 (high e) .. 6 (low E) */
  var NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  var OPEN_IDX = [4, 11, 7, 2, 9, 4]; /* E B G D A E */
  function noteName(string, fret) { return NAMES[(OPEN_IDX[string - 1] + fret) % 12]; }
  function pluck(string, fret, when) { pluckHz(OPEN[string - 1] * Math.pow(2, fret / 12), when); }
  function pluckHz(f, when) {
    var ac = ctx(); if (!ac) return;
    if (ac.state === 'suspended') ac.resume();
    var sr = ac.sampleRate, len = Math.floor(sr * 1.6), N = Math.max(2, Math.round(sr / f));
    var buf = ac.createBuffer(1, len, sr), d = buf.getChannelData(0), ring = new Float32Array(N), i;
    for (i = 0; i < N; i++) ring[i] = Math.random() * 2 - 1;
    var idx = 0, decay = 0.994 + Math.min(0.005, f / 200000);
    for (i = 0; i < len; i++) {
      var nx = (idx + 1) % N, v = ring[idx];
      ring[idx] = decay * 0.5 * (v + ring[nx]);
      d[i] = v * 0.35; idx = nx;
    }
    var src = ac.createBufferSource(); src.buffer = buf;
    var g = ac.createGain(); g.gain.value = 0.8;
    src.connect(g); g.connect(ac.destination);
    src.start(when || ac.currentTime);
  }
  function click(accent) {
    var ac = ctx(); if (!ac) return;
    if (ac.state === 'suspended') ac.resume();
    var o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime;
    o.type = 'square'; o.frequency.value = accent ? 1760 : 1175;
    g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + 0.06);
  }


  /* ---------- PosterHero ---------- */
  function PosterHero(p) {
    var variant = p.variant || 'slab', word = p.word || 'RIFF';
    return h('section', { className: cx('dr-hero', 'dr-hero--' + variant, p.className), 'aria-label': typeof p.title === 'string' ? p.title : undefined },
      h('div', { className: 'dr-hero__copy' },
        p.rain ? h(TabRain, { fill: true, opacity: p.rain === true ? 0.22 : p.rain }) : null,
        h('div', { className: 'dr-hero__in' },
          p.kicker ? h('p', { className: 'dr-hero__kicker' }, h('span', { className: 'dr-led is-on', 'aria-hidden': true }), p.kicker) : null,
          h(SectionTitle, { align: 'left', eyebrow: p.eyebrow, title: p.title, size: 'lg', as: p.as || 'h1' }),
          p.summary ? h('p', { className: 'dr-hero__sum' }, p.summary) : null,
          h('div', { className: 'dr-hero__act' },
            h(Button, { variant: 'primary', icon: '▶', onClick: p.onCta }, p.cta || 'Tocar ahora'),
            p.note ? h('span', { className: 'dr-hero__note' }, p.note) : null))),
      h('div', { className: 'dr-hero__slab', 'aria-hidden': true },
        variant === 'stack'
          ? h('div', { className: 'dr-hero__stack' }, [0, 1, 2].map(function (i) { return h('span', { key: i, className: cx('dr-hero__word', i < 2 && 'is-outline') }, word); }))
          : h('span', { className: 'dr-hero__word' }, word),
        p.jp ? h('span', { className: 'dr-hero__jp' }, p.jp) : null,
        p.counter ? h('span', { className: 'dr-hero__count' }, p.counter) : null));
  }

  /* ---------- Button ---------- */
  function Button(p) {
    var variant = p.variant || 'primary', size = p.size || 'md';
    var rest = omit(p, ['variant', 'size', 'icon', 'led', 'children', 'className']);
    var isToggle = variant === 'key' && p.led != null;
    return h('button', Object.assign({ type: 'button' }, rest, {
      className: cx('dr-btn', 'dr-btn--' + variant, 'dr-btn--' + size, p.className),
      'aria-pressed': isToggle ? !!p.led : undefined
    }),
      isToggle ? h('span', { className: cx('dr-led', p.led && 'is-on'), 'aria-hidden': true }) : null,
      p.icon ? h('span', { className: 'dr-btn__icon', 'aria-hidden': true }, p.icon) : null,
      h('span', { className: 'dr-btn__label' }, p.children));
  }

  /* ---------- ChannelTag ---------- */
  function ChannelTag(p) {
    var ch = CHANNELS[p.channel] || CHANNELS.teoria;
    return h('span', { className: cx('dr-tag', 'dr-tag--' + (p.channel || 'teoria'), p.className) },
      h('span', { className: 'dr-tag__code' }, ch.code),
      h('span', { className: 'dr-tag__sep', 'aria-hidden': true }, '·'),
      h('span', null, p.children || ch.label),
      p.jp ? h('span', { className: 'dr-tag__jp', 'aria-hidden': true }, ch.jp) : null);
  }

  /* ---------- SectionTitle ---------- */
  function SectionTitle(p) {
    var Tag = p.as || 'h2';
    return h('header', { className: cx('dr-title', 'dr-title--' + (p.align || 'center'), p.className) },
      p.kicker ? h('p', { className: 'dr-title__kicker' }, p.kicker) : null,
      p.eyebrow ? h('p', { className: 'dr-title__eyebrow' }, p.eyebrow) : null,
      h(Tag, { className: cx('dr-title__main', p.size === 'lg' && 'is-lg') }, p.title));
  }

  /* ---------- NavBar ---------- */
  function NavBar(p) {
    var items = p.items || [
      { channel: 'teoria', label: 'Teoría' }, { channel: 'tecnica', label: 'Técnica' },
      { channel: 'repertorio', label: 'Repertorio' }, { channel: 'instrumento', label: 'Instrumento' }];
    return h('nav', { className: cx('dr-nav', p.className), 'aria-label': 'Principal' },
      h('a', { className: 'dr-nav__brand', href: p.homeHref || '#' },
        h('span', { className: 'dr-led is-on', 'aria-hidden': true }),
        h('span', { className: 'dr-nav__brandtxt' }, p.brand || 'DAILYRIFFS', h('small', { 'aria-hidden': true }, 'デイリーリフ'))),
      h('ul', { className: 'dr-nav__list' }, items.map(function (it, i) {
        var ch = CHANNELS[it.channel] || {};
        var active = p.active === it.channel;
        return h('li', { key: i },
          h('a', { className: cx('dr-nav__item', 'dr-nav__item--' + it.channel, active && 'is-active'), href: it.href || '#', 'aria-current': active ? 'page' : undefined },
            h('span', { className: 'dr-nav__code' }, ch.code || it.code, h('span', { className: 'dr-nav__jp', 'aria-hidden': true }, ch.jp)),
            h('span', { className: 'dr-nav__label' }, it.label)));
      })),
      p.cta === null ? null : h(Button, { variant: 'primary', size: 'sm', icon: '▶', onClick: p.onCta }, p.cta || 'Riff del día'));
  }

  /* ---------- Level bars (internal) ---------- */
  function LevelBars(p) {
    var lv = Math.max(1, Math.min(5, p.level || 1));
    var names = ['Inicial', 'Básico', 'Intermedio', 'Avanzado', 'Experto'];
    return h('span', { className: 'dr-level', role: 'img', 'aria-label': 'Nivel ' + lv + ' de 5: ' + names[lv - 1] },
      [1, 2, 3, 4, 5].map(function (i) { return h('span', { key: i, className: cx('dr-level__bar', i <= lv && 'is-on'), style: { height: (4 + i * 3) + 'px' } }); }),
      h('span', { className: 'dr-level__txt', 'aria-hidden': true }, names[lv - 1]));
  }

  /* ---------- Meter ---------- */
  function Meter(p) {
    var segs = p.segments || 12, v = Math.max(0, Math.min(1, p.value || 0)), lit = Math.round(v * segs);
    return h('div', { className: cx('dr-meter', p.compact && 'is-compact', p.className), role: 'meter', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': Math.round(v * 100), 'aria-label': p.label || 'Progreso' },
      p.label && !p.compact ? h('span', { className: 'dr-meter__label' }, p.label) : null,
      h('span', { className: 'dr-meter__segs', 'data-channel': p.channel || undefined },
        Array.from({ length: segs }, function (_, i) {
          var hot = i >= segs - Math.max(1, Math.round(segs / 6));
          return h('span', { key: i, className: cx('dr-meter__seg', i < lit && 'is-on', hot && 'is-hot') });
        })),
      h('span', { className: 'dr-meter__val' }, Math.round(v * 100) + '%'));
  }

  /* ---------- LessonCard ---------- */
  function LessonCard(p) {
    var Tag = p.href ? 'a' : (p.onClick ? 'button' : 'article');
    var props = { className: cx('dr-card', 'dr-card--' + (p.channel || 'teoria'), p.className) };
    if (p.href) props.href = p.href;
    if (p.onClick) { props.onClick = p.onClick; props.type = 'button'; }
    return h(Tag, props,
      h('div', { className: 'dr-card__top' },
        h(ChannelTag, { channel: p.channel }),
        h('span', { className: 'dr-card__num' }, p.progress >= 1 ? h('span', { className: 'dr-card__glint' }, '✦ COMPLETA') : null, pad(p.number || 1))),
      h('h3', { className: 'dr-card__title' }, p.title),
      p.summary ? h('p', { className: 'dr-card__sum' }, p.summary) : null,
      h('div', { className: 'dr-card__foot' },
        h('span', { className: 'dr-card__dur' }, (p.duration || '—') ),
        h(LevelBars, { level: p.level })),
      p.progress != null ? h(Meter, { value: p.progress, segments: 16, compact: true, label: 'Progreso de la lección' }) : null);
  }

  /* ---------- CourseTape ---------- */
  function CourseTape(p) {
    var chs = p.channels && p.channels.length ? p.channels : ['teoria', 'tecnica', 'repertorio', 'instrumento'];
    var Tag = p.href ? 'a' : 'article', side = p.side || 'A';
    return h(Tag, { className: cx('dr-tape', 'dr-tape--' + (p.tone || 'void'), p.className), href: p.href },
      h('div', { className: 'dr-tape__label' },
        h('div', { className: 'dr-tape__head' },
          h('span', { className: 'dr-tape__side', 'aria-label': 'Lado ' + side }, side, h('small', { 'aria-hidden': true }, '面')),
          h('div', { className: 'dr-tape__meta' },
            h('span', { className: 'dr-tape__code' }, p.code || 'DR-90'),
            h('h3', { className: 'dr-tape__title' }, p.title)),
          h('span', { className: 'dr-tape__len', 'aria-hidden': true }, p.length || Math.max(30, Math.ceil((p.minutes || 60) / 30) * 30))),
        h('div', { className: 'dr-tape__stripes', 'aria-hidden': true },
          chs.map(function (c) { return h('span', { key: c, className: 'dr-tape__stripe dr-tape__stripe--' + c }); })),
        h('div', { className: 'dr-tape__window', 'aria-hidden': true },
          h('span', { className: 'dr-tape__reel' }), h('span', { className: 'dr-tape__band' }), h('span', { className: 'dr-tape__reel' }))),
      h('div', { className: 'dr-tape__foot' },
        h('span', null, pad(p.lessons || 0, 2) + ' LECCIONES'),
        h('span', null, (p.minutes || 0) + ' MIN'),
        h('span', { className: 'dr-tape__chs' }, chs.map(function (c) { return h('span', { key: c, className: 'dr-tape__dot dr-tape__dot--' + c, title: CHANNELS[c].label }); }))));
  }

  /* ---------- Readout (LCD) ---------- */
  function Readout(p) {
    var ghost = String(p.value).replace(/[0-9]/g, '8').replace(/[A-Za-z#]/g, '8');
    return h('div', { className: cx('dr-lcd', p.size === 'sm' && 'is-sm', p.className), 'data-theme': 'stage', role: 'status', 'aria-live': p.live ? 'polite' : undefined },
      p.label ? h('span', { className: 'dr-lcd__label' }, p.label) : null,
      h('span', { className: 'dr-lcd__val' },
        h('span', { className: 'dr-lcd__ghost', 'aria-hidden': true }, ghost),
        h('span', { className: 'dr-lcd__digits' }, p.value)),
      p.unit ? h('span', { className: 'dr-lcd__unit' }, p.unit) : null,
      p.children);
  }

  /* ---------- Metronome ---------- */
  function Metronome(p) {
    var min = p.min || 40, max = p.max || 240, beats = p.beats || 4;
    var s1 = useState(p.bpm || 96), bpm = s1[0], setBpm = s1[1];
    var s2 = useState(false), playing = s2[0], setPlaying = s2[1];
    var s3 = useState(-1), beat = s3[0], setBeat = s3[1];
    var taps = useRef([]), drag = useRef(null);
    var set = useCallback(function (v) { v = Math.max(min, Math.min(max, Math.round(v))); setBpm(v); if (p.onChange) p.onChange(v); }, [min, max, p.onChange]);
    useEffect(function () {
      if (!playing) { setBeat(-1); return; }
      var n = 0, t = setInterval(tick, 60000 / bpm);
      function tick() { var b = n % beats; setBeat(b); if (p.sound !== false) click(b === 0); n++; }
      tick();
      return function () { clearInterval(t); };
    }, [playing, bpm, beats]);
    function onKey(e) {
      var k = e.key;
      if (k === 'ArrowUp' || k === 'ArrowRight') { set(bpm + (e.shiftKey ? 10 : 1)); e.preventDefault(); }
      else if (k === 'ArrowDown' || k === 'ArrowLeft') { set(bpm - (e.shiftKey ? 10 : 1)); e.preventDefault(); }
      else if (k === 'Home') { set(min); e.preventDefault(); } else if (k === 'End') { set(max); e.preventDefault(); }
    }
    function onDown(e) { drag.current = { y: e.clientY, v: bpm }; e.currentTarget.setPointerCapture(e.pointerId); }
    function onMove(e) { if (drag.current) set(drag.current.v + (drag.current.y - e.clientY) / 2); }
    function onUp() { drag.current = null; }
    function onWheel(e) { set(bpm + (e.deltaY < 0 ? 1 : -1)); }
    function tap() {
      var now = Date.now(), a = taps.current.filter(function (t) { return now - t < 2500; }); a.push(now); taps.current = a;
      if (a.length > 1) { var iv = (a[a.length - 1] - a[0]) / (a.length - 1); set(60000 / iv); }
    }
    var angle = -135 + 270 * (bpm - min) / (max - min);
    return h('div', { className: cx('dr-metro', p.className) },
      p.grille !== false ? h('span', { className: cx('dr-metro__grille', beat === 0 && 'is-pulse'), 'aria-hidden': true }) : null,
      h(Readout, { label: 'TEMPO', value: pad(bpm, 3), unit: 'BPM' },
        h('span', { className: 'dr-metro__beats', 'aria-hidden': true },
          Array.from({ length: beats }, function (_, i) { return h('span', { key: i, className: cx('dr-metro__beat', i === beat && 'is-on', i === 0 && 'is-one') }); }))),
      h('div', { className: 'dr-metro__controls' },
        h('div', { className: 'dr-knob', role: 'slider', tabIndex: 0, 'aria-label': 'Tempo', 'aria-valuemin': min, 'aria-valuemax': max, 'aria-valuenow': bpm, 'aria-valuetext': bpm + ' BPM',
          onKeyDown: onKey, onPointerDown: onDown, onPointerMove: onMove, onPointerUp: onUp, onPointerCancel: onUp, onWheel: onWheel },
          h('span', { className: 'dr-knob__cap', style: { transform: 'rotate(' + angle + 'deg)' } }, h('span', { className: 'dr-knob__mark' }))),
        h('span', { className: 'dr-knob__label', 'aria-hidden': true }, 'TEMPO'),
        h('div', { className: 'dr-metro__keys' },
          h(Button, { variant: 'key', led: playing, onClick: function () { setPlaying(!playing); } }, playing ? 'STOP' : 'PLAY'),
          h(Button, { variant: 'key', onClick: tap }, 'TAP'))));
  }

  /* ---------- Fretboard ---------- */
  function Fretboard(p) {
    var frets = p.frets || 12, FW = p.fretWidth || 58, SG = 26, LEFT = 44, TOP = 22;
    var W = LEFT + frets * FW + 16, H = TOP * 2 + SG * 5;
    var init = (p.notes || []).map(function (n) { return n.string + ':' + n.fret; });
    var roles = {}; (p.notes || []).forEach(function (n) { roles[n.string + ':' + n.fret] = n; });
    var s1 = useState(init), on = s1[0], setOn = s1[1];
    var s2 = useState(null), last = s2[0], setLast = s2[1];
    function x(f) { return f === 0 ? LEFT - 20 : LEFT + (f - 0.5) * FW; }
    function y(s) { return TOP + (s - 1) * SG; }
    function hit(s, f) {
      var key = s + ':' + f;
      if (p.sound !== false) pluck(s, f);
      setLast({ s: s, f: f, n: noteName(s, f) });
      if (p.interactive !== false) setOn(function (a) { return a.indexOf(key) >= 0 && !roles[key] ? a.filter(function (k) { return k !== key; }) : (a.indexOf(key) >= 0 ? a : a.concat(key)); });
      if (p.onNote) p.onNote({ string: s, fret: f, note: noteName(s, f) });
    }
    var inl = [3, 5, 7, 9, 15, 17, 19, 21].filter(function (f) { return f <= frets; });
    var kids = [];
    kids.push(h('rect', { key: 'wood', className: 'dr-fb__wood', x: LEFT, y: TOP - 12, width: frets * FW, height: SG * 5 + 24, rx: 4 }));
    inl.forEach(function (f) { kids.push(h('circle', { key: 'i' + f, className: 'dr-fb__inlay', cx: x(f), cy: TOP + SG * 2.5, r: 5 })); });
    if (frets >= 12) { kids.push(h('circle', { key: 'i12a', className: 'dr-fb__inlay', cx: x(12), cy: TOP + SG * 1.5, r: 5 })); kids.push(h('circle', { key: 'i12b', className: 'dr-fb__inlay', cx: x(12), cy: TOP + SG * 3.5, r: 5 })); }
    for (var f = 1; f <= frets; f++) kids.push(h('line', { key: 'f' + f, className: 'dr-fb__fret', x1: LEFT + f * FW, x2: LEFT + f * FW, y1: TOP - 12, y2: TOP + SG * 5 + 12 }));
    kids.push(h('rect', { key: 'nut', className: 'dr-fb__nut', x: LEFT - 5, y: TOP - 12, width: 6, height: SG * 5 + 24 }));
    for (var s = 1; s <= 6; s++) kids.push(h('line', { key: 's' + s, className: 'dr-fb__string', x1: LEFT - 30, x2: W - 6, y1: y(s), y2: y(s), style: { strokeWidth: 0.8 + s * 0.35 } }));
    for (var ff = 0; ff <= frets; ff++) {
      kids.push(h('text', { key: 'n' + ff, className: 'dr-fb__fretnum', x: ff === 0 ? LEFT - 20 : x(ff), y: H - 2, textAnchor: 'middle' }, ff === 0 ? '0' : ff));
    }
    for (s = 1; s <= 6; s++) for (ff = 0; ff <= frets; ff++) (function (s, ff) {
      var key = s + ':' + ff, active = on.indexOf(key) >= 0, n = noteName(s, ff), role = roles[key] && roles[key].role || 'tone';
      var label = 'Cuerda ' + s + ', traste ' + ff + ': ' + n;
      kids.push(h('g', { key: 'c' + key, className: cx('dr-fb__cell', active && 'is-on', active && 'is-' + role), role: 'button', tabIndex: 0, 'aria-label': label, 'aria-pressed': active,
        onClick: function () { hit(s, ff); }, onKeyDown: function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hit(s, ff); } } },
        h('rect', { className: 'dr-fb__hit', x: (ff === 0 ? LEFT - 40 : LEFT + (ff - 1) * FW), y: y(s) - SG / 2, width: ff === 0 ? 36 : FW, height: SG }),
        active ? h('circle', { className: 'dr-fb__dot', cx: x(ff), cy: y(s), r: 10.5 }) : null,
        active && p.showNames !== false ? h('text', { className: 'dr-fb__dottxt', x: x(ff), y: y(s) + 4, textAnchor: 'middle' }, (roles[key] && roles[key].label) || n) : null));
    })(s, ff);
    return h('figure', { className: cx('dr-fb', p.className), 'data-theme': 'stage' },
      h('div', { className: 'dr-fb__scroll' }, h('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, role: 'group', 'aria-label': p.title || 'Diapasón interactivo' }, kids)),
      h('figcaption', { className: 'dr-fb__cap' },
        h('span', null, p.title || 'DIAPASÓN · AFINACIÓN ESTÁNDAR E A D G B E'),
        h('span', { className: 'dr-fb__last', 'aria-live': 'polite' }, last ? ('▶ ' + last.n + ' · CUERDA ' + last.s + ' · TRASTE ' + last.f) : 'TOCA UN TRASTE')));
  }

  /* ---------- ChordDiagram ---------- */
  function ChordDiagram(p) {
    var fr = p.frets || ['x', 3, 2, 0, 1, 0]; /* low E -> high e */
    var fingers = p.fingers || [];
    var base = p.baseFret || 1, rows = 5, SX = 22, SY = 26, L = 28, T = 34;
    var W = L * 2 + SX * 5, H = T + SY * rows + 14;
    var kids = [];
    kids.push(h('rect', { key: 'w', className: 'dr-cd__wood', x: L, y: T, width: SX * 5, height: SY * rows, rx: 2 }));
    for (var r = 0; r <= rows; r++) kids.push(h('line', { key: 'r' + r, className: r === 0 && base === 1 ? 'dr-cd__nut' : 'dr-cd__fret', x1: L, x2: L + SX * 5, y1: T + r * SY, y2: T + r * SY }));
    for (var s = 0; s < 6; s++) kids.push(h('line', { key: 's' + s, className: 'dr-cd__string', x1: L + s * SX, x2: L + s * SX, y1: T, y2: T + SY * rows }));
    if (p.barre) kids.push(h('rect', { key: 'barre', className: 'dr-cd__dot', x: L + (p.barre.from) * SX - 9, y: T + (p.barre.fret - base + 0.5) * SY - 9, width: (p.barre.to - p.barre.from) * SX + 18, height: 18, rx: 9 }));
    fr.forEach(function (v, i) {
      var cxp = L + i * SX;
      if (v === 'x' || v === 'X' || v === null) kids.push(h('text', { key: 'm' + i, className: 'dr-cd__mute', x: cxp, y: T - 10, textAnchor: 'middle' }, '×'));
      else if (v === 0) kids.push(h('circle', { key: 'm' + i, className: 'dr-cd__open', cx: cxp, cy: T - 15, r: 5 }));
      else {
        var cyp = T + (v - base + 0.5) * SY;
        kids.push(h('circle', { key: 'd' + i, className: 'dr-cd__dot', cx: cxp, cy: cyp, r: 9 }));
        if (fingers[i]) kids.push(h('text', { key: 't' + i, className: 'dr-cd__finger', x: cxp, y: cyp + 4, textAnchor: 'middle' }, fingers[i]));
      }
    });
    if (base > 1) kids.push(h('text', { key: 'base', className: 'dr-cd__base', x: L - 10, y: T + SY * 0.5 + 4, textAnchor: 'end' }, base + 'fr'));
    function strum() {
      if (p.sound === false) return;
      var ac = ctx(); if (!ac) return; var t = ac.currentTime;
      fr.forEach(function (v, i) { if (typeof v === 'number') pluck(6 - i, v, t + i * 0.035); });
    }
    return h('figure', { className: cx('dr-cd', p.className), 'data-theme': 'stage' },
      h('button', { type: 'button', className: 'dr-cd__btn', onClick: strum, 'aria-label': 'Rasguear acorde ' + (p.name || '') + ': ' + fr.join(' ') },
        h('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, 'aria-hidden': true }, kids)),
      h('figcaption', { className: 'dr-cd__name' }, p.name || 'C', p.quality ? h('span', { className: 'dr-cd__q' }, p.quality) : null));
  }

  /* ---------- TabStaff ---------- */
  function parseTab(lines) {
    var body = lines.map(function (l) { var i = l.indexOf('|'); return i >= 0 ? l.slice(i + 1) : l; });
    var labels = lines.map(function (l) { var i = l.indexOf('|'); return i >= 0 ? l.slice(0, i) : ''; });
    var width = Math.max.apply(null, body.map(function (b) { return b.length; }));
    var events = [];
    for (var c = 0; c < width; c++) {
      var hits = [];
      body.forEach(function (b, si) {
        var ch = b.charAt(c), prev = b.charAt(c - 1);
        if (/[0-9]/.test(ch) && !/[0-9]/.test(prev)) { var m = /^[0-9]+/.exec(b.slice(c)); hits.push({ string: si + 1, fret: parseInt(m[0], 10) }); }
      });
      events.push(hits);
    }
    return { body: body, labels: labels, width: width, events: events };
  }
  function TabStaff(p) {
    var lines = p.lines || ['e|-------0---------|', 'B|-----1---1-------|', 'G|---0-------0-----|', 'D|-2-----------2---|', 'A|-3---------------|', 'E|-----------------|'];
    var tab = parseTab(lines);
    var s1 = useState(false), playing = s1[0], setPlaying = s1[1];
    var s2 = useState(-1), col = s2[0], setCol = s2[1];
    var bpm = p.bpm || 90;
    useEffect(function () {
      if (!playing) return;
      var c = -1, t = setInterval(function () {
        c++; if (c >= tab.width) { if (p.loop) c = 0; else { setPlaying(false); setCol(-1); return; } }
        setCol(c);
        if (p.sound !== false) tab.events[c].forEach(function (e) { pluck(e.string, e.fret); });
      }, 60000 / (bpm * 4));
      return function () { clearInterval(t); };
    }, [playing, bpm, lines.join('\n')]);
    return h('figure', { className: cx('dr-tab', p.className) },
      h('div', { className: 'dr-tab__head' },
        h('div', null,
          p.channel ? h(ChannelTag, { channel: p.channel }) : null,
          p.title ? h('figcaption', { className: 'dr-tab__title' }, p.title) : null),
        h('div', { className: 'dr-tab__ctl' },
          h('span', { className: 'dr-tab__bpm' }, pad(bpm, 3) + ' BPM'),
          h(Button, { variant: 'key', size: 'sm', led: playing, onClick: function () { setPlaying(!playing); if (playing) setCol(-1); } }, playing ? 'STOP' : 'PLAY'))),
      h('div', { className: 'dr-tab__staff', role: 'img', 'aria-label': 'Tablatura: ' + lines.join(' / ') },
        tab.body.map(function (b, i) {
          var a = col >= 0 ? b.slice(0, col) : b, m = col >= 0 ? b.charAt(col) || ' ' : '', z = col >= 0 ? b.slice(col + 1) : '';
          return h('div', { key: i, className: 'dr-tab__line', 'aria-hidden': true },
            h('span', { className: 'dr-tab__str' }, tab.labels[i] + '|'),
            h('span', null, a),
            col >= 0 ? h('span', { className: cx('dr-tab__head-col', /[0-9]/.test(m) && 'is-hit') }, m) : null,
            z);
        })),
      p.legend !== false ? h('p', { className: 'dr-tab__legend' }, 'h = hammer-on · p = pull-off · b = bend · r = release · / = slide · x = nota muerta') : null);
  }

  /* ---------- AnatomyCallout ---------- */
  function AnatomyCallout(p) {
    return h('div', { className: cx('dr-callout', 'dr-callout--' + (p.side || 'left'), p.className) },
      h('span', { className: 'dr-callout__n', 'aria-hidden': true }, pad(p.n || 1, 2)),
      h('span', { className: 'dr-callout__lead', 'aria-hidden': true }),
      h('div', { className: 'dr-callout__box' },
        h('p', { className: 'dr-callout__kicker' }, (p.kicker || 'PIEZA') + ' ' + pad(p.n || 1, 2)),
        h('h4', { className: 'dr-callout__title' }, p.title),
        p.children ? h('div', { className: 'dr-callout__body' }, p.children) : null));
  }


  /* =================== v2: moodboard pieces =================== */

  /* ---------- TabRain (matrix rain + Midjourney ASCII hero, made of tablature) ---------- */
  function TabRain(p) {
    var ref = useRef(null);
    useEffect(function () {
      var cv = ref.current; if (!cv || !cv.getContext) return;
      var g = cv.getContext('2d'); if (!g) return;
      var dpr = window.devicePixelRatio || 1, W = 1, H = 1, cols = 0, drops = [], fs = p.fontSize || 14, raf = 0, last = 0, alive = true;
      var color = (getComputedStyle(cv).getPropertyValue('--lcd-ink') || '').trim() || '#6bfc95';
      var CH = (p.chars || '0123456789------||hpb/x~EADGBe').split('');
      function size() {
        var r = cv.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height);
        cv.width = W * dpr; cv.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
        cols = Math.max(1, Math.floor(W / (fs * 0.9))); drops = Array.from({ length: cols }, function () { return Math.random() * H / fs; });
      }
      function step() {
        g.globalCompositeOperation = 'destination-out'; g.fillStyle = 'rgba(0,0,0,0.14)'; g.fillRect(0, 0, W, H);
        g.globalCompositeOperation = 'source-over'; g.font = '500 ' + fs + 'px "JetBrains Mono", monospace'; g.fillStyle = color;
        for (var i = 0; i < cols; i++) {
          var y = drops[i] * fs;
          g.globalAlpha = Math.random() > 0.95 ? 1 : 0.7;
          g.fillText(CH[(Math.random() * CH.length) | 0], i * (W / cols), y);
          if (y > H && Math.random() > 0.97) drops[i] = 0;
          drops[i]++;
        }
        g.globalAlpha = 1;
      }
      function loop(t) { if (!alive) return; if (t - last > (p.interval || 70)) { last = t; step(); } raf = requestAnimationFrame(loop); }
      size();
      for (var k = 0; k < 24; k++) step();
      if (reducedMotion()) { for (k = 0; k < 40; k++) step(); }
      else raf = requestAnimationFrame(loop);
      var ro = window.ResizeObserver ? new ResizeObserver(size) : null; if (ro) ro.observe(cv);
      return function () { alive = false; cancelAnimationFrame(raf); if (ro) ro.disconnect(); };
    }, []);
    return h('canvas', { ref: ref, className: cx('dr-rain', p.fill && 'is-fill', p.className), 'aria-hidden': true,
      style: { opacity: p.opacity != null ? p.opacity : 0.4, height: p.fill ? undefined : (p.height || 240) } });
  }

  /* ---------- VUTuner (MINICOMP VU meter) ---------- */
  var STRS = [{ s: 6, n: 'E', o: 2 }, { s: 5, n: 'A', o: 2 }, { s: 4, n: 'D', o: 3 }, { s: 3, n: 'G', o: 3 }, { s: 2, n: 'B', o: 3 }, { s: 1, n: 'E', o: 4 }];
  function detectPitch(buf, sr) {
    var SIZE = buf.length, rms = 0, i, j;
    for (i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
    if (Math.sqrt(rms / SIZE) < 0.01) return -1;
    var r1 = 0, r2 = SIZE - 1, th = 0.2;
    for (i = 0; i < SIZE / 2; i++) if (Math.abs(buf[i]) < th) { r1 = i; break; }
    for (i = 1; i < SIZE / 2; i++) if (Math.abs(buf[SIZE - i]) < th) { r2 = SIZE - i; break; }
    buf = buf.slice(r1, r2); SIZE = buf.length;
    var c = new Float32Array(SIZE);
    for (i = 0; i < SIZE; i++) for (j = 0; j < SIZE - i; j++) c[i] += buf[j] * buf[j + i];
    var d = 0; while (d < SIZE - 1 && c[d] > c[d + 1]) d++;
    var mv = -1, mp = -1; for (i = d; i < SIZE; i++) if (c[i] > mv) { mv = c[i]; mp = i; }
    if (mp < 1) return -1;
    var T0 = mp, x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1] || 0, a = (x1 + x3 - 2 * x2) / 2, b = (x3 - x1) / 2;
    if (a) T0 = T0 - b / (2 * a);
    return sr / T0;
  }
  function VUTuner(p) {
    var s1 = useState(p.string || 5), target = s1[0], setTarget = s1[1];
    var s2 = useState(p.cents || 0), cents = s2[0], setCents = s2[1];
    var s3 = useState(false), mic = s3[0], setMic = s3[1];
    var s4 = useState(null), heard = s4[0], setHeard = s4[1];
    var anim = useRef(0), micRef = useRef(null);
    function simulate(s) {
      setTarget(s); setHeard(null); if (p.sound !== false) pluck(s, 0);
      cancelAnimationFrame(anim.current);
      var start = (Math.random() > 0.5 ? 1 : -1) * (18 + Math.random() * 24), t0 = performance.now();
      if (reducedMotion()) { setCents(0); return; }
      (function f(t) { var k = (t - t0) / 1000; var v = start * Math.exp(-2.6 * k) * Math.cos(5.5 * k); setCents(v); if (k < 1.8) anim.current = requestAnimationFrame(f); else setCents(0); })(t0);
    }
    function stopMic() { var m = micRef.current; if (m) { m.alive = false; m.stream.getTracks().forEach(function (t) { t.stop(); }); } micRef.current = null; }
    function toggleMic() {
      if (mic && mic !== 'error') { stopMic(); setMic(false); setHeard(null); return; }
      var ac = ctx(); if (!ac || !navigator.mediaDevices) { setMic('error'); return; }
      navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
        if (ac.state === 'suspended') ac.resume();
        var an = ac.createAnalyser(); an.fftSize = 2048; ac.createMediaStreamSource(stream).connect(an);
        var buf = new Float32Array(an.fftSize), m = { stream: stream, alive: true }; micRef.current = m; setMic(true);
        (function tick() {
          if (!m.alive) return;
          an.getFloatTimeDomainData(buf); var f = detectPitch(buf, ac.sampleRate);
          if (f > 60 && f < 1400) { var midi = 12 * Math.log2(f / 440) + 69, n = Math.round(midi); setCents((midi - n) * 100); setHeard({ note: NAMES[n % 12] + (Math.floor(n / 12) - 1), hz: f }); }
          setTimeout(tick, 90);
        })();
      }).catch(function () { setMic('error'); });
    }
    useEffect(function () { return function () { cancelAnimationFrame(anim.current); stopMic(); }; }, []);
    var c = Math.max(-50, Math.min(50, cents)), inTune = Math.abs(c) < 4;
    var tgt = STRS.filter(function (x) { return x.s === target; })[0] || STRS[1];
    var note = heard ? heard.note : tgt.n + tgt.o, hz = heard ? heard.hz : OPEN[target - 1] * Math.pow(2, c / 1200);
    var ticks = [], labels = [-50, -25, 0, 25, 50], R = 128, PX = 160, PY = 182;
    for (var v = -50; v <= 50; v += 5) {
      var a = v * 0.9 * Math.PI / 180, big = v % 25 === 0, r0 = big ? R - 14 : R - 7;
      ticks.push(h('line', { key: 't' + v, x1: PX + r0 * Math.sin(a), y1: PY - r0 * Math.cos(a), x2: PX + R * Math.sin(a), y2: PY - R * Math.cos(a), className: big ? 'dr-vu__tick is-big' : 'dr-vu__tick' }));
    }
    labels.forEach(function (v) { var a = v * 0.9 * Math.PI / 180, r = R + 14; ticks.push(h('text', { key: 'l' + v, x: PX + r * Math.sin(a), y: PY - r * Math.cos(a) + 4, textAnchor: 'middle', className: 'dr-vu__num' }, v > 0 ? '+' + v : v)); });
    var arcA = 48 * Math.PI / 180, Ra = R - 22;
    var arc = 'M' + (PX - Ra * Math.sin(arcA)) + ',' + (PY - Ra * Math.cos(arcA)) + ' A' + Ra + ',' + Ra + ' 0 0 1 ' + (PX + Ra * Math.sin(arcA)) + ',' + (PY - Ra * Math.cos(arcA));
    return h('div', { className: cx('dr-vu', p.className) },
      h('div', { className: 'dr-vu__screen' },
        h('div', { className: 'dr-vu__top' }, h('span', null, '‹ ESTÁNDAR ›'), h('span', null, 'CENTS  ·  HZ')),
        h('svg', { viewBox: '0 0 320 150', className: 'dr-vu__svg', 'aria-hidden': true },
          h('path', { d: arc, className: 'dr-vu__arc' }), ticks,
          h('g', { style: { transform: 'rotate(' + (c * 0.9) + 'deg)', transformOrigin: PX + 'px ' + PY + 'px' }, className: 'dr-vu__needle' },
            h('line', { x1: PX, y1: PY - 84, x2: PX, y2: PY - R - 6 }))),
        h('div', { className: 'dr-vu__read', role: 'status', 'aria-live': 'polite' },
          h('span', { className: 'dr-vu__label' }, 'TUNER'),
          h('span', { className: 'dr-vu__note' }, note),
          h('span', { className: cx('dr-vu__state', inTune && 'is-ok') }, inTune ? '● AFINADA' : (c < 0 ? '▲ TENSA' : '▼ AFLOJA'))),
        h('div', { className: 'dr-vu__bottom' },
          h('span', null, 'ENTRADA', h('br'), mic === true ? 'MIC' : 'REFERENCIA'),
          h('span', { style: { textAlign: 'right' } }, 'FRECUENCIA', h('br'), hz.toFixed(1) + ' HZ'))),
      h('div', { className: 'dr-vu__keys' },
        STRS.map(function (x) { return h(Button, { key: x.s, variant: 'key', size: 'sm', led: target === x.s && mic !== true, onClick: function () { simulate(x.s); }, 'aria-label': 'Cuerda ' + x.s + ': ' + x.n + x.o }, x.n + (x.s === 1 ? '¹' : '')); }),
        h(Button, { variant: 'key', size: 'sm', led: mic === true, onClick: toggleMic }, mic === 'error' ? 'SIN MIC' : 'MIC')),
      h('div', { className: 'dr-vu__foot' }, h('span', { className: 'dr-vu__model' }, 'TUNE-COMP', h('small', null, 'V1')), h('span', { className: 'dr-vu__jp' }, 'チューナー'), h('span', { className: 'dr-led is-on', 'aria-hidden': true })));
  }

  /* ---------- QuizConsole (Sony MG+ dual screens) ---------- */
  var QZ = [
    { q: '¿Qué intervalo hay entre la cuerda 6 al aire (E) y el traste 5 de la misma cuerda (A)?', options: ['Tercera mayor', 'Cuarta justa', 'Quinta justa'], answer: 1, explain: 'De E a A hay 5 semitonos: una cuarta justa. Por eso afinas la cuerda 5 con el traste 5 de la 6.' },
    { q: '¿Qué pieza fija la altura de las cuerdas al aire y las guía al clavijero?', options: ['Selleta', 'Cejuela', 'Alma'], answer: 1, explain: 'La cejuela (nut). La selleta (saddle) hace lo mismo del lado del puente.' },
    { q: 'En una tab, ¿qué significa 5h7?', options: ['Bend del 5 al 7', 'Slide del 5 al 7', 'Hammer-on del 5 al 7'], answer: 2, explain: 'h = hammer-on: tocas el 5 y "martillas" el 7 sin volver a pulsar con la púa.' }
  ];
  function QuizConsole(p) {
    var qs = p.questions || QZ, L = 'ABCD';
    var s1 = useState(0), i = s1[0], setI = s1[1];
    var s2 = useState(null), picked = s2[0], setPicked = s2[1];
    var s3 = useState(0), score = s3[0], setScore = s3[1];
    var done = i >= qs.length, q = qs[Math.min(i, qs.length - 1)];
    function pick(k) { if (picked != null || done) return; setPicked(k); if (k === q.answer) setScore(score + 1); }
    function next() { if (done) { setI(0); setScore(0); setPicked(null); return; } setI(i + 1); setPicked(null); }
    return h('div', { className: cx('dr-quiz', p.className) },
      h('div', { className: 'dr-quiz__brand' },
        h('div', null, h('span', { className: 'dr-quiz__logo' }, 'DAILYRIFFS'), h('span', { className: 'dr-quiz__model' }, p.model || 'QZ+'), h('span', { className: 'dr-quiz__sub' }, p.subtitle || 'práctica diaria')),
        h('div', { className: 'dr-quiz__sel' }, h('span', null, 'SELECT'), h('span', { className: 'dr-quiz__red', 'aria-hidden': true }))),
      h('div', { className: 'dr-quiz__screens' },
        h('div', { className: 'dr-quiz__crt', 'aria-live': 'polite' },
          done ? h('p', { className: 'dr-quiz__q' }, 'Fin de la cinta.', h('br'), 'Puntaje: ' + score + '/' + qs.length)
            : [h('span', { key: 'c', className: 'dr-quiz__count' }, 'P ' + pad(i + 1, 2) + '/' + pad(qs.length, 2) + (p.channel ? '  ·  ' + CHANNELS[p.channel].code : '')), h('p', { key: 'q', className: 'dr-quiz__q' }, q.q)]),
        h('div', { className: 'dr-quiz__crt', 'aria-live': 'polite' },
          done ? h('p', { className: 'dr-quiz__q' }, '▶ para rebobinar')
            : picked == null ? q.options.map(function (o, k) { return h('p', { key: k, className: 'dr-quiz__opt' }, h('b', null, L[k]), ' ' + o); })
              : [h('p', { key: 'v', className: cx('dr-quiz__verdict', picked === q.answer && 'is-ok') }, picked === q.answer ? '✓ CORRECTO' : '✗ ERA ' + L[q.answer]), h('p', { key: 'e', className: 'dr-quiz__ex' }, q.explain)])),
      h('div', { className: 'dr-quiz__panel' },
        h('span', { className: 'dr-quiz__grille', 'aria-hidden': true }),
        h('div', { className: 'dr-quiz__keys' }, !done ? q.options.map(function (o, k) {
          return h('button', { key: k, type: 'button', className: cx('dr-quiz__key', picked === k && 'is-picked', picked != null && k === q.answer && 'is-right'), onClick: function () { pick(k); }, disabled: picked != null, 'aria-label': 'Responder ' + L[k] + ': ' + o }, L[k]);
        }) : null),
        h('button', { type: 'button', className: 'dr-quiz__next', onClick: next, 'aria-label': done ? 'Repetir' : 'Siguiente pregunta' }, '▶')),
      h('div', { className: 'dr-quiz__foot' }, h('span', null, 'SCORE ' + pad(score, 2)), h('span', { className: 'dr-quiz__jp' }, 'クイズ・練習')));
  }

  /* ---------- RackUnit (Fisher Studio-Standard hi-fi) ---------- */
  function RackUnit(p) {
    var total = p.lessons || 12;
    var s1 = useState(p.current || 1), cur = s1[0], setCur = s1[1];
    function seek(v) { v = Math.max(1, Math.min(total, v)); setCur(v); if (p.onSeek) p.onSeek(v); }
    return h('div', { className: cx('dr-rack', p.className) },
      h('span', { className: 'dr-rack__wood', 'aria-hidden': true }),
      h('div', { className: 'dr-rack__face' },
        ['tl', 'tr', 'bl', 'br'].map(function (k) { return h('span', { key: k, className: 'dr-rack__screw is-' + k, 'aria-hidden': true }); }),
        h('div', { className: 'dr-rack__power' }, h('span', { className: 'dr-rack__lbl' }, 'POWER'), h('span', { className: 'dr-rack__pkey', 'aria-hidden': true }), h('span', { className: 'dr-led is-on', 'aria-hidden': true })),
        h('div', { className: 'dr-rack__main' },
          h('div', { className: 'dr-rack__plate' }, h('span', { className: 'dr-rack__model' }, p.model || 'Studio·Lesson'), h('span', { className: 'dr-rack__by' }, 'BY'), h('span', { className: 'dr-rack__brand' }, 'DAILYRIFFS'),
            h('span', { className: 'dr-rack__code' }, p.code || 'DR-33')),
          h('h3', { className: 'dr-rack__title' }, p.title),
          h('div', { className: 'dr-rack__dial', role: 'slider', tabIndex: 0, 'aria-label': 'Lección del módulo', 'aria-valuemin': 1, 'aria-valuemax': total, 'aria-valuenow': cur, 'aria-valuetext': 'Lección ' + cur + ' de ' + total,
            onKeyDown: function (e) { if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { seek(cur + 1); e.preventDefault(); } if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { seek(cur - 1); e.preventDefault(); } } },
            h('span', { className: 'dr-rack__band' }, 'LECC'),
            h('div', { className: 'dr-rack__scale' },
              Array.from({ length: total }, function (_, k) { return h('button', { key: k, type: 'button', tabIndex: -1, className: cx('dr-rack__tick', k + 1 < cur && 'is-done', k + 1 === cur && 'is-cur'), onClick: function () { seek(k + 1); }, 'aria-label': 'Ir a lección ' + (k + 1) }, pad(k + 1, 2)); }),
              h('span', { className: 'dr-rack__needle', style: { left: ((cur - 0.5) / total * 100) + '%' }, 'aria-hidden': true })))),
        h('div', { className: 'dr-rack__side' }, p.children)));
  }

  /* ---------- AmpPanel (Marshall-style tolex + brass panel) ---------- */
  function AmpKnob(p) {
    var drag = useRef(null), v = p.value;
    function set(n) { n = Math.max(0, Math.min(10, Math.round(n * 2) / 2)); p.onChange(n); }
    return h('div', { className: 'dr-ampk' },
      h('span', { className: 'dr-ampk__lbl' }, p.label),
      h('div', { className: 'dr-ampk__knob', role: 'slider', tabIndex: 0, 'aria-label': p.label, 'aria-valuemin': 0, 'aria-valuemax': 10, 'aria-valuenow': v,
        onKeyDown: function (e) { if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { set(v + 0.5); e.preventDefault(); } if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { set(v - 0.5); e.preventDefault(); } },
        onPointerDown: function (e) { drag.current = { y: e.clientY, v: v }; e.currentTarget.setPointerCapture(e.pointerId); },
        onPointerMove: function (e) { if (drag.current) set(drag.current.v + (drag.current.y - e.clientY) / 12); },
        onPointerUp: function () { drag.current = null; }, onPointerCancel: function () { drag.current = null; },
        onWheel: function (e) { set(v + (e.deltaY < 0 ? 0.5 : -0.5)); } },
        h('span', { className: 'dr-ampk__cap', style: { transform: 'rotate(' + (-135 + 27 * v) + 'deg)' } }, h('span', { className: 'dr-ampk__ptr' }))),
      h('span', { className: 'dr-ampk__val' }, (v % 1 ? v.toFixed(1) : v)));
  }
  function AmpPanel(p) {
    var defs = p.controls || [{ id: 'gain', label: 'GAIN', value: 7 }, { id: 'bass', label: 'BASS', value: 5 }, { id: 'middle', label: 'MIDDLE', value: 6 }, { id: 'treble', label: 'TREBLE', value: 7 }, { id: 'presence', label: 'PRESENCE', value: 4 }, { id: 'master', label: 'MASTER', value: 5 }];
    var s1 = useState(defs.map(function (d) { return d.value; })), vals = s1[0], setVals = s1[1];
    var s2 = useState(p.on !== false), on = s2[0], setOn = s2[1];
    return h('div', { className: cx('dr-amp', p.className), 'data-theme': 'stage' },
      h('div', { className: 'dr-amp__tolex' }, h('span', { className: 'dr-amp__badge' }, p.model || 'DailyRiffs'), h('span', { className: 'dr-amp__badgejp' }, 'アンプ')),
      h('div', { className: 'dr-amp__panel' },
        h('div', { className: 'dr-amp__inputs' }, h('span', { className: 'dr-amp__lbl' }, 'INPUT'), h('div', { className: 'dr-amp__jacks' }, h('span', { className: 'dr-amp__jack' }), h('span', { className: 'dr-amp__jack' })), h('span', { className: 'dr-amp__lbl' }, 'HI · LO')),
        h('div', { className: 'dr-amp__knobs' }, defs.map(function (d, k) {
          return h(AmpKnob, { key: d.id, label: d.label, value: vals[k], onChange: function (n) { var nv = vals.slice(); nv[k] = n; setVals(nv); if (p.onChange) { var o = {}; defs.forEach(function (dd, kk) { o[dd.id] = nv[kk]; }); p.onChange(o); } } });
        })),
        h('div', { className: 'dr-amp__power' },
          h('span', { className: cx('dr-amp__jewel', on && 'is-on'), 'aria-hidden': true }),
          h('button', { type: 'button', className: cx('dr-amp__toggle', on && 'is-on'), 'aria-pressed': on, 'aria-label': 'Encendido', onClick: function () { setOn(!on); } }, h('span', null)),
          h('span', { className: 'dr-amp__lbl' }, 'POWER'))),
      p.preset ? h('div', { className: 'dr-amp__preset' }, h('span', null, 'PRESET'), h('span', { className: 'dr-amp__pname' }, p.preset)) : null);
  }

  /* ---------- StickyNote (THINK RETRO / BYTE ME post-its) ---------- */
  function StickyNote(p) {
    var tone = p.tone || 'mustard', rot = p.rotate != null ? p.rotate : -2;
    return h('aside', { className: cx('dr-note', 'dr-note--' + tone, p.className), style: { transform: 'rotate(' + rot + 'deg)' } },
      h('span', { className: 'dr-note__tape', 'aria-hidden': true }),
      p.kicker ? h('p', { className: 'dr-note__kicker' }, p.kicker) : null,
      h('div', { className: 'dr-note__body' }, p.children),
      p.sign ? h('p', { className: 'dr-note__sign' }, p.sign) : null);
  }

  /* ---------- KeycapWord ("P R O C E S S O S" keycaps) ---------- */
  var PENTA = [0, 3, 5, 7, 10, 12, 15, 17, 19];
  function KeycapWord(p) {
    var word = String(p.word || 'RIFF').split('');
    var s1 = useState(-1), lit = s1[0], setLit = s1[1];
    var n = 0;
    return h('div', { className: cx('dr-keys', 'dr-keys--' + (p.tone || 'dark'), p.className), role: 'group', 'aria-label': p.label || ('Palabra ' + p.word + ', cada tecla toca una nota') },
      word.map(function (ch, i) {
        if (ch === ' ') return h('span', { key: i, className: 'dr-keys__gap' });
        var step = n++;
        return h('button', { key: i, type: 'button', className: cx('dr-keys__cap', lit === i && 'is-on'), 'aria-label': 'Tecla ' + ch,
          onClick: function () { if (p.sound !== false) pluck(5, PENTA[step % PENTA.length] + (p.root || 0)); setLit(i); setTimeout(function () { setLit(-1); }, 200); } },
          h('span', null, ch));
      }));
  }

  /* ---------- AlbumSleeve (album covers + CD/vinyl) ---------- */
  function AlbumSleeve(p) {
    var pattern = p.pattern || 'rings', disc = p.disc || 'vinyl', Tag = p.href ? 'a' : 'article';
    return h(Tag, { className: cx('dr-album', p.className), href: p.href },
      h('div', { className: 'dr-album__stage' },
        h('span', { className: cx('dr-album__disc', 'dr-album__disc--' + disc), 'data-channel': p.discColor || undefined, 'aria-hidden': true }, h('span', { className: 'dr-album__hole' })),
        h('div', { className: cx('dr-album__sleeve', 'dr-album__sleeve--' + pattern) },
          p.art ? h('img', { src: p.art, alt: '' }) : null,
          h('span', { className: 'dr-album__ctitle' }, p.coverTitle || p.title),
          h('span', { className: 'dr-album__cside' }, p.code || 'LP · 33⅓'))),
      h('div', { className: 'dr-album__meta' },
        h(ChannelTag, { channel: p.channel || 'repertorio' }),
        h('h3', { className: 'dr-album__title' }, p.title),
        p.artist ? h('p', { className: 'dr-album__artist' }, p.artist) : null,
        h('div', { className: 'dr-album__facts' }, h('span', null, 'TONO ' + (p.keySig || 'Am')), h('span', null, pad(p.bpm || 90, 3) + ' BPM'), h(LevelBars, { level: p.level || 2 }))));
  }

  /* ---------- AnatomyMap (D71 Toaster lámina + Capcom line art) ---------- */
  var GUITAR_PARTS = [
    { x: 64, y: 150, kicker: 'Clavijero', title: 'Pala (headstock)', body: 'Sostiene las clavijas. Su ángulo aprieta las cuerdas contra la cejuela para que no zumben.' },
    { x: 78, y: 104, kicker: 'Afinación', title: 'Clavijas (tuners)', body: 'Engranajes que tensan cada cuerda. Más tensión = nota más aguda.' },
    { x: 126, y: 194, kicker: 'Mástil', title: 'Cejuela (nut)', body: 'Pieza ranurada que fija la altura y separación de las cuerdas al aire.' },
    { x: 290, y: 116, kicker: 'Diapasón', title: 'Trastes (frets)', body: 'Cada traste sube un semitono. El 12 divide la cuerda a la mitad: la octava.' },
    { x: 430, y: 194, kicker: 'Mástil', title: 'Mástil y alma (truss rod)', body: 'Dentro corre una varilla de acero que contrarresta la tensión de las cuerdas.' },
    { x: 580, y: 150, kicker: 'Caja', title: 'Boca (sound hole)', body: 'Deja salir el aire que mueve la tapa: ahí nace el volumen de una acústica.' },
    { x: 690, y: 64, kicker: 'Caja', title: 'Tapa armónica (top)', body: 'La madera que vibra. Abeto o cedro: rígida y ligera para amplificar.' },
    { x: 748, y: 216, kicker: 'Puente', title: 'Puente (bridge)', body: 'Ancla las cuerdas a la tapa y le transmite su vibración.' },
    { x: 790, y: 112, kicker: 'Puente', title: 'Selleta (saddle)', body: 'Define el final de la longitud vibrante. Su posición compensa la afinación.' }
  ];
  function AnatomyMap(p) {
    var parts = p.parts || GUITAR_PARTS, tone = p.tone || 'brass';
    var s1 = useState(p.selected || 0), sel = s1[0], setSel = s1[1];
    var NUT = 127, SAD = 758, LEN = SAD - NUT, frets = [], inl = [];
    for (var f = 1; f <= 14; f++) { var x = NUT + LEN * (1 - Math.pow(2, -f / 12)); if (x < 520) frets.push(h('line', { key: 'f' + f, x1: x, x2: x, y1: 137, y2: 163, className: 'dr-map__fret' })); }
    [3, 5, 7, 9].forEach(function (f) { var a = NUT + LEN * (1 - Math.pow(2, -(f - 1) / 12)), b = NUT + LEN * (1 - Math.pow(2, -f / 12)); inl.push(h('circle', { key: 'i' + f, cx: (a + b) / 2, cy: 150, r: 2.6, className: 'dr-map__inlay' })); });
    var a12 = NUT + LEN * (1 - Math.pow(2, -11 / 12)), b12 = NUT + LEN * 0.5;
    inl.push(h('circle', { key: 'i12a', cx: (a12 + b12) / 2, cy: 144, r: 2.6, className: 'dr-map__inlay' }), h('circle', { key: 'i12b', cx: (a12 + b12) / 2, cy: 156, r: 2.6, className: 'dr-map__inlay' }));
    var strings = [0, 1, 2, 3, 4, 5].map(function (k) { return h('line', { key: 's' + k, x1: NUT, y1: 140 + k * 4, x2: SAD, y2: 137.5 + k * 5, className: 'dr-map__string' }); });
    var body = 'M452,150 C452,86 492,60 545,60 C592,60 606,86 630,90 C655,94 668,38 728,36 C806,34 846,92 846,150 C846,208 806,266 728,264 C668,262 655,206 630,210 C606,214 592,240 545,240 C492,240 452,214 452,150 Z';
    var pt = parts[sel] || parts[0];
    return h('figure', { className: cx('dr-map', 'dr-map--' + tone, p.className), 'data-theme': 'stage' },
      h('div', { className: 'dr-map__head' }, h('span', null, p.title || 'DR-A1 · GUITARRA ACÚSTICA · ANATOMÍA'), h('span', { className: 'dr-map__jp' }, 'ギター')),
      h('svg', { viewBox: '0 0 880 300', className: 'dr-map__svg', role: 'group', 'aria-label': 'Lámina de anatomía: elige una pieza' },
        h('path', { d: body, className: 'dr-map__line' }),
        h('circle', { cx: 580, cy: 150, r: 34, className: 'dr-map__line' }), h('circle', { cx: 580, cy: 150, r: 41, className: 'dr-map__thin' }), h('circle', { cx: 580, cy: 150, r: 45, className: 'dr-map__thin' }),
        h('path', { d: 'M40,128 L127,135 L127,165 L40,172 Q30,172 30,162 L30,138 Q30,128 40,128 Z', className: 'dr-map__line dr-map__fill' }),
        [52, 78, 104].map(function (x) { return h('g', { key: 'tu' + x }, h('line', { x1: x, y1: 129, x2: x, y2: 112, className: 'dr-map__thin' }), h('rect', { x: x - 6, y: 102, width: 12, height: 10, rx: 3, className: 'dr-map__line' }), h('circle', { cx: x, cy: 138, r: 3, className: 'dr-map__thin' }), h('line', { x1: x, y1: 171, x2: x, y2: 188, className: 'dr-map__thin' }), h('rect', { x: x - 6, y: 188, width: 12, height: 10, rx: 3, className: 'dr-map__line' }), h('circle', { cx: x, cy: 162, r: 3, className: 'dr-map__thin' })); }),
        h('path', { d: 'M127,136 L520,139 L520,161 L127,164 Z', className: 'dr-map__line dr-map__fill' }),
        h('rect', { x: 123, y: 134, width: 5, height: 32, className: 'dr-map__solid' }),
        frets, inl,
        h('rect', { x: 736, y: 122, width: 40, height: 56, rx: 7, className: 'dr-map__line dr-map__fill' }),
        h('line', { x1: SAD, y1: 130, x2: SAD, y2: 170, className: 'dr-map__heavy' }),
        [0, 1, 2, 3, 4, 5].map(function (k) { return h('circle', { key: 'p' + k, cx: 768, cy: 137.5 + k * 5, r: 1.6, className: 'dr-map__solid' }); }),
        strings,
        parts.map(function (q, i) {
          var on = i === sel;
          return h('g', { key: 'h' + i, className: cx('dr-map__hot', on && 'is-on'), role: 'button', tabIndex: 0, 'aria-pressed': on, 'aria-label': pad(i + 1, 2) + ' ' + q.title,
            onClick: function () { setSel(i); }, onKeyDown: function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSel(i); } } },
            h('circle', { cx: q.x, cy: q.y, r: 13 }), h('text', { x: q.x, y: q.y + 4, textAnchor: 'middle' }, pad(i + 1, 2)));
        })),
      h('div', { className: 'dr-map__info' },
        h(AnatomyCallout, { n: sel + 1, kicker: pt.kicker, title: pt.title }, h('p', null, pt.body)),
        h('ol', { className: 'dr-map__list' }, parts.map(function (q, i) { return h('li', { key: i }, h('button', { type: 'button', className: cx(i === sel && 'is-on'), onClick: function () { setSel(i); } }, pad(i + 1, 2) + ' ' + q.title.replace(/ \(.*\)/, ''))); }))));
  }

  /* ---------- HalftoneImage (DZP statue / red posters / black-cat poster) ---------- */
  function HalftoneImage(p) {
    return h('figure', { className: cx('dr-ht', 'dr-ht--' + (p.tone || 'red'), p.className), style: { aspectRatio: p.ratio || '4 / 5', '--dr-dot': (p.dot || 5) + 'px' } },
      h('img', { src: p.src, alt: p.alt || '' }),
      h('span', { className: 'dr-ht__screen', 'aria-hidden': true }),
      p.grain !== false ? h('span', { className: 'dr-ht__grain', 'aria-hidden': true }) : null,
      p.jp ? h('span', { className: 'dr-ht__jp', 'aria-hidden': true }, p.jp) : null,
      p.caption ? h('figcaption', { className: 'dr-ht__cap' }, p.caption) : null);
  }

  /* ---------- Statement ("SOUND HAS A SHAPE.") ---------- */
  function Statement(p) {
    var vertical = p.vertical !== false;
    return h('section', { className: cx('dr-stmt', vertical && 'is-vertical', p.className) },
      h('h2', { className: 'dr-stmt__text' }, p.text || 'EL SONIDO TIENE FORMA.'),
      h('div', { className: 'dr-stmt__side' },
        p.kicker ? h('p', { className: 'dr-stmt__kicker' }, p.kicker) : null,
        p.children ? h('div', { className: 'dr-stmt__body' }, p.children) : null,
        p.by ? h('p', { className: 'dr-stmt__by' }, '— ' + p.by) : null,
        p.jp ? h('p', { className: 'dr-stmt__jp' }, p.jp) : null));
  }

  /* ---------- HistoryTimeline (FM tuner dial of the Fisher rack) ---------- */
  var HIST = [
    { year: 1932, title: 'La primera eléctrica comercial', body: 'Una lap steel de aluminio apodada "Frying Pan" populariza la pastilla electromagnética.' },
    { year: 1950, title: 'Cuerpo sólido en serie', body: 'Llegan las primeras eléctricas de cuerpo macizo fabricadas en serie: menos acople, más sustain.' },
    { year: 1957, title: 'Nace el humbucker', body: 'Dos bobinas en fase opuesta cancelan el zumbido de 60 Hz. El sonido se vuelve grueso.' },
    { year: 1962, title: 'Amplificadores de alta ganancia', body: 'Los amplis británicos de válvulas empujan la distorsión al centro del rock.' },
    { year: 1967, title: 'Fuzz y wah-wah', body: 'Los pedales convierten la guitarra en un laboratorio de timbre.' },
    { year: 1977, title: 'Puente de doble bloqueo', body: 'Las palancas extremas ya no desafinan: arranca la era del shred.' },
    { year: 1998, title: 'Modelado digital', body: 'Un procesador del tamaño de un frijol imita amplis completos. El estudio cabe en una mochila.' }
  ];
  function HistoryTimeline(p) {
    var ev = p.events || HIST, from = p.from || 1930, to = p.to || 2010;
    var s1 = useState(p.selected || 0), sel = s1[0], setSel = s1[1];
    function pos(y) { return ((y - from) / (to - from) * 100) + '%'; }
    var decades = []; for (var y = from; y <= to; y += 10) decades.push(y);
    var e = ev[sel];
    return h('section', { className: cx('dr-hist', p.className) },
      h('div', { className: 'dr-hist__dial' },
        h('span', { className: 'dr-hist__band' }, 'AÑO'),
        h('div', { className: 'dr-hist__track' },
          decades.map(function (d) { return h('span', { key: d, className: 'dr-hist__dec', style: { left: pos(d) } }, String(d).slice(2)); }),
          ev.map(function (x, i) { return h('button', { key: i, type: 'button', className: cx('dr-hist__mark', i === sel && 'is-on'), style: { left: pos(x.year) }, onClick: function () { setSel(i); }, 'aria-label': x.year + ': ' + x.title, 'aria-pressed': i === sel }, h('span', null)); }),
          h('span', { className: 'dr-hist__needle', style: { left: pos(e.year) }, 'aria-hidden': true })),
        h('span', { className: 'dr-hist__band' }, 'ヒストリー')),
      h('div', { className: 'dr-hist__card', 'aria-live': 'polite' },
        h('span', { className: 'dr-hist__year' }, e.year),
        h('div', { className: 'dr-hist__txt' },
          h('p', { className: 'dr-hist__kicker' }, (CHANNELS.instrumento.code) + ' · HISTORIA · ' + pad(sel + 1, 2) + '/' + pad(ev.length, 2)),
          h('h4', { className: 'dr-hist__title' }, e.title),
          h('p', { className: 'dr-hist__body' }, e.body)),
        h('div', { className: 'dr-hist__nav' },
          h(Button, { variant: 'key', size: 'sm', onClick: function () { setSel((sel - 1 + ev.length) % ev.length); }, 'aria-label': 'Evento anterior' }, '◀'),
          h(Button, { variant: 'key', size: 'sm', onClick: function () { setSel((sel + 1) % ev.length); }, 'aria-label': 'Evento siguiente' }, '▶'))));
  }

  /* ---------- SpecSheet (Schecter spec page / D71 'Anatomy & features') ---------- */
  function SpecSheet(p) {
    return h('section', { className: cx('dr-spec', p.className) },
      h('header', { className: 'dr-spec__head' },
        h('p', { className: 'dr-spec__kicker' }, p.kicker || 'ANATOMÍA Y CARACTERÍSTICAS'),
        h('h3', { className: 'dr-spec__name' }, p.name),
        p.subtitle ? h('p', { className: 'dr-spec__sub' }, p.subtitle) : null),
      h('dl', { className: 'dr-spec__list' }, (p.specs || []).map(function (s, i) {
        return h('div', { key: i, className: 'dr-spec__row' }, h('dt', null, h('b', null, pad(i + 1, 2)), ' ' + s[0]), h('span', { className: 'dr-spec__lead', 'aria-hidden': true }), h('dd', null, s[1]));
      })),
      p.children ? h('div', { className: 'dr-spec__foot' }, p.children) : null);
  }

  var api = { TabRain: TabRain, VUTuner: VUTuner, QuizConsole: QuizConsole, RackUnit: RackUnit, AmpPanel: AmpPanel, StickyNote: StickyNote, KeycapWord: KeycapWord, AlbumSleeve: AlbumSleeve, AnatomyMap: AnatomyMap, HalftoneImage: HalftoneImage, Statement: Statement, HistoryTimeline: HistoryTimeline, SpecSheet: SpecSheet, PosterHero: PosterHero, Button: Button, ChannelTag: ChannelTag, SectionTitle: SectionTitle, NavBar: NavBar, LessonCard: LessonCard, CourseTape: CourseTape, Meter: Meter, Readout: Readout, Metronome: Metronome, Fretboard: Fretboard, ChordDiagram: ChordDiagram, TabStaff: TabStaff, AnatomyCallout: AnatomyCallout, CHANNELS: CHANNELS, pluck: pluck, pluckHz: pluckHz, noteName: noteName };
  window.DailyRiffs = Object.assign(window.DailyRiffs || {}, api);
})();

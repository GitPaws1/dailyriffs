'use client';
// VUTuner v2 (reemplaza al VUTuner del bundle en /afinar) — afinador de hardware. Detección McLeod (pitchy) por cuadro de animación,
// mediana+EMA, LOCK con histéresis: tira de 9 LEDs, LCD de fósforo y destello al afinar.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PitchDetector } from 'pitchy';
import { useDS } from '@/ds/DSProvider';
import { cx } from './cx';
import { pluck, reducedMotion, unlock } from '@/lib/audio/engine';
import { STRINGS, cents, createSmoother, createTuneLock, hzToMidi, ledIndex, midiName, nearestString, type LockState } from '@/lib/audio/tuner';

export interface VUTunerLabels {
  standard: string; scale: string; input: string; mic: string; ref: string; freq: string;
  flat: string; sharp: string; inTune: string; noMic: string; auto: string;
  lcdIdle: string; lcdListen: string; lcdDenied: string; lcdLocked: string; string: string;
}

type Mic = 'off' | 'on' | 'denied';
interface Reading { hz: number; note: string; c: number }

const R = 128, PX = 160, PY = 182;
const NEEDLE_DEG = 0.9; // grados por cent

export function VUTunerPro({ labels: L, initialString = 6, className }: { labels: VUTunerLabels; initialString?: number; className?: string }) {
  const ds = useDS();
  const [target, setTarget] = useState(initialString);
  const [auto, setAuto] = useState(true);
  const [mic, setMic] = useState<Mic>('off');
  const [reading, setReading] = useState<Reading | null>(null);
  const [lock, setLock] = useState<LockState>('idle');
  const [led, setLed] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);

  const needleRef = useRef<SVGGElement>(null);
  const live = useRef({ target, auto });
  live.current = { target, auto };
  const run = useRef<{ alive: boolean; stream?: MediaStream; raf: number } | null>(null);

  const ticks = useMemo(() => {
    const out: React.ReactNode[] = [];
    for (let v = -50; v <= 50; v += 5) {
      const a = (v * NEEDLE_DEG * Math.PI) / 180, big = v % 25 === 0, r0 = big ? R - 14 : R - 7;
      out.push(<line key={`t${v}`} x1={PX + r0 * Math.sin(a)} y1={PY - r0 * Math.cos(a)} x2={PX + R * Math.sin(a)} y2={PY - R * Math.cos(a)} className={big ? 'dr-vu__tick is-big' : 'dr-vu__tick'} />);
    }
    for (const v of [-50, -25, 0, 25, 50]) {
      const a = (v * NEEDLE_DEG * Math.PI) / 180, r = R + 14;
      out.push(<text key={`l${v}`} x={PX + r * Math.sin(a)} y={PY - r * Math.cos(a) + 4} textAnchor="middle" className="dr-vu__num">{v > 0 ? `+${v}` : v}</text>);
    }
    const arcA = (48 * Math.PI) / 180, Ra = R - 22;
    out.push(<path key="arc" className="dr-vu__arc" d={`M${PX - Ra * Math.sin(arcA)},${PY - Ra * Math.cos(arcA)} A${Ra},${Ra} 0 0 1 ${PX + Ra * Math.sin(arcA)},${PY - Ra * Math.cos(arcA)}`} />);
    // Zona verde de LOCK (±3 cents) marcada en el arco.
    const z = (3 * NEEDLE_DEG * Math.PI) / 180, Rz = R - 2;
    out.push(<path key="zone" className="dr-vu__zone" d={`M${PX - Rz * Math.sin(z)},${PY - Rz * Math.cos(z)} A${Rz},${Rz} 0 0 1 ${PX + Rz * Math.sin(z)},${PY - Rz * Math.cos(z)}`} />);
    return out;
  }, []);

  const setNeedle = (c: number) => {
    const el = needleRef.current;
    if (el) el.style.transform = `rotate(${Math.max(-50, Math.min(50, c)) * NEEDLE_DEG}deg)`;
  };

  const stopMic = useCallback(() => {
    const r = run.current;
    if (r) { r.alive = false; cancelAnimationFrame(r.raf); r.stream?.getTracks().forEach((t) => t.stop()); }
    run.current = null;
  }, []);

  const startMic = useCallback(async () => {
    const ac = await unlock();
    if (!ac || !navigator.mediaDevices?.getUserMedia) { setMic('denied'); return; }
    let stream: MediaStream;
    try {
      // Sin cancelación de eco ni AGC: deforman la fundamental de las cuerdas graves.
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    } catch { setMic('denied'); return; }

    const an = ac.createAnalyser();
    an.fftSize = 2048;
    ac.createMediaStreamSource(stream).connect(an);
    const buf = new Float32Array(an.fftSize);
    const det = PitchDetector.forFloat32Array(an.fftSize);
    det.minVolumeDecibels = -48;
    const smooth = createSmoother(0.35);
    const lk = createTuneLock({ enter: 3, exit: 7, near: 12, holdMs: 180 });
    const r = { alive: true, stream, raf: 0 };
    run.current = r;
    setMic('on');

    let silent = 0, lastUi = 0, lastLock: LockState = 'idle', lastLed: number | null = null, lastTarget = live.current.target;
    const frame = (now: number) => {
      if (!r.alive) return;
      an.getFloatTimeDomainData(buf);
      const [hz, clarity] = det.findPitch(buf, ac.sampleRate);
      if (clarity > 0.92 && hz > 60 && hz < 1400) {
        silent = 0;
        const { auto: isAuto, target: sel } = live.current;
        const st = isAuto ? nearestString(hz) : STRINGS.find((s) => s.s === sel)!;
        if (st.s !== lastTarget) { lastTarget = st.s; smooth.reset(); lk.reset(); if (isAuto) setTarget(st.s); }
        const c = smooth.push(cents(hz, st.hz));
        setNeedle(c);
        const ls = lk.update(c, now);
        if (ls !== lastLock) {
          if (ls === 'locked') {
            navigator.vibrate?.(30);
            if (!reducedMotion()) { setFlash(true); window.setTimeout(() => setFlash(false), 260); }
          }
          lastLock = ls; setLock(ls);
        }
        const li = ledIndex(c);
        if (li !== lastLed) { lastLed = li; setLed(li); }
        if (now - lastUi > 100) { lastUi = now; setReading({ hz, note: midiName(Math.round(hzToMidi(hz))), c }); }
      } else if (++silent === 24) {
        smooth.reset(); lk.update(null, now);
        lastLock = 'idle'; lastLed = null;
        setLock('idle'); setLed(null); setReading(null); setNeedle(0);
      }
      r.raf = requestAnimationFrame(frame);
    };
    r.raf = requestAnimationFrame(frame);
  }, []);

  useEffect(() => () => stopMic(), [stopMic]);

  const toggleMic = () => {
    if (mic === 'on') { stopMic(); setMic('off'); setReading(null); setLock('idle'); setLed(null); setNeedle(0); return; }
    void startMic();
  };

  const pickString = (s: number) => {
    setTarget(s);
    if (mic === 'on') { setAuto(false); return; }
    void unlock().then(() => pluck(s, 0));
  };

  const tgt = STRINGS.find((s) => s.s === target) ?? STRINGS[0];
  const locked = lock === 'locked';
  const c = reading?.c ?? 0;
  const stateTxt = !reading ? '' : locked ? L.inTune : c < 0 ? L.flat : L.sharp;
  const lcdMsg = mic === 'denied' ? L.lcdDenied : locked ? L.lcdLocked : mic === 'on' ? (reading ? stateTxt : L.lcdListen) : L.lcdIdle;
  const centsTxt = reading ? `${c >= 0 ? '+' : '−'}${String(Math.min(99, Math.round(Math.abs(c)))).padStart(2, '0')}¢` : '±00¢';
  const announce = reading ? `${reading.note} ${locked ? L.inTune : stateTxt}` : '';

  return (
    <div className={cx('dr-vu', locked && 'is-lock', className)} data-lock={lock}>
      <div className={cx('dr-vu__screen', flash && 'is-flash')}>
        <div className="dr-vu__top"><span>{L.standard}</span><span>{L.scale}</span></div>
        <svg viewBox="0 0 320 150" className="dr-vu__svg" aria-hidden>
          {ticks}
          <g ref={needleRef} style={{ transformOrigin: `${PX}px ${PY}px` }} className="dr-vu__needle">
            <line x1={PX} y1={PY - 84} x2={PX} y2={PY - R - 6} />
          </g>
        </svg>
        <div className="dr-vu__read" aria-hidden>
          <span className="dr-vu__label">TUNER</span>
          <span className="dr-vu__note">{reading?.note ?? `${tgt.n}${tgt.o}`}</span>
          <span className={cx('dr-vu__state', locked && 'is-ok')}>{stateTxt || '·'}</span>
        </div>
        <div className="dr-vu__bottom">
          <span>{L.input}<br />{mic === 'on' ? L.mic : L.ref}</span>
          <span style={{ textAlign: 'right' }}>{L.freq}<br />{(reading?.hz ?? tgt.hz).toFixed(1)} HZ</span>
        </div>
      </div>

      <div className="dr-vu__leds" aria-hidden>
        {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((i) => (
          <span key={i} className={cx('dr-vu__ledseg', i === 0 && 'is-center', led === i && 'is-on', i === 0 && locked && 'is-lock')} />
        ))}
      </div>

      <div className={cx('dr-vu__lcd', locked && 'is-lock')} data-theme="stage">
        <span className="dr-vu__lcdnote">{tgt.n}<small>{tgt.o}</small></span>
        <span className="dr-vu__lcdmsg">{lcdMsg}</span>
        <span className="dr-vu__lcdc">{centsTxt}</span>
      </div>
      <span className="sr-only" role="status" aria-live="polite">{announce}</span>

      <div className="dr-vu__keys">
        {STRINGS.map((x) => (
          <ds.Button key={x.s} variant="key" size="sm" led={target === x.s} onClick={() => pickString(x.s)} aria-label={`${L.string} ${x.s}: ${x.n}${x.o}`}>
            {x.n}{x.s === 1 ? '¹' : ''}
          </ds.Button>
        ))}
        <ds.Button variant="key" size="sm" led={auto} onClick={() => setAuto(!auto)} disabled={mic !== 'on'}>{L.auto}</ds.Button>
        <ds.Button variant="key" size="sm" led={mic === 'on'} onClick={toggleMic}>{mic === 'denied' ? L.noMic : L.mic}</ds.Button>
      </div>
      <div className="dr-vu__foot">
        <span className="dr-vu__model">TUNE-COMP<small>V2</small></span>
        <span className="dr-vu__jp" aria-hidden>チューナー</span>
        <span className={cx('dr-led', mic === 'on' && 'is-on')} aria-hidden />
      </div>
    </div>
  );
}

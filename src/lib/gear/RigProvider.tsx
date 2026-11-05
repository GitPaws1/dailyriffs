'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { DEFAULT_RIG, type Rig } from './catalog';

const KEY = 'dr:rig:v1';

interface RigCtx { rig: Rig; setRig: (patch: Partial<Rig>) => void; reset: () => void }
const Ctx = createContext<RigCtx | null>(null);

export function RigProvider({ children }: { children: ReactNode }) {
  const [rig, set] = useState<Rig>(DEFAULT_RIG);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) set({ ...DEFAULT_RIG, ...JSON.parse(raw) });
    } catch { /* se queda el equipo por defecto */ }
  }, []);

  const persist = (r: Rig) => { try { localStorage.setItem(KEY, JSON.stringify(r)); } catch { /* noop */ } };
  const setRig = useCallback((patch: Partial<Rig>) => set((r) => { const n = { ...r, ...patch }; persist(n); return n; }), []);
  const reset = useCallback(() => { set(DEFAULT_RIG); persist(DEFAULT_RIG); }, []);

  return <Ctx.Provider value={{ rig, setRig, reset }}>{children}</Ctx.Provider>;
}

export function useRig(): RigCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useRig fuera de RigProvider');
  return c;
}

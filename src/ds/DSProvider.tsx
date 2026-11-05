'use client';
/* Carga el bundle del sistema de diseño (IIFE que lee window.React) con la misma instancia de React de la app. */
import * as React from 'react';
import type { DailyRiffsDS } from './types';

const DSContext = React.createContext<DailyRiffsDS | null>(null);
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';
let loading: Promise<DailyRiffsDS> | null = null;

function loadDS(): Promise<DailyRiffsDS> {
  const w = window as unknown as { React: typeof React; DailyRiffs?: DailyRiffsDS };
  if (w.DailyRiffs) return Promise.resolve(w.DailyRiffs);
  if (loading) return loading;
  w.React = React;
  loading = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = `${BASE}/ds/bundle.js`;
    s.onload = () => (w.DailyRiffs ? resolve(w.DailyRiffs) : reject(new Error('bundle sin DailyRiffs')));
    s.onerror = () => { loading = null; reject(new Error('no cargó el bundle')); };
    document.head.appendChild(s);
  });
  return loading;
}

export function DSProvider({ children }: { children: React.ReactNode }) {
  const [ds, setDs] = React.useState<DailyRiffsDS | null>(null);
  const [error, setError] = React.useState(false);
  React.useEffect(() => { loadDS().then(setDs).catch(() => setError(true)); }, []);
  if (error) return <div className="boot"><p className="kicker">Error al cargar · recarga la página</p></div>;
  if (!ds) return <div className="boot" aria-busy="true"><p className="kicker">Cargando cinta…</p></div>;
  return <DSContext.Provider value={ds}>{children}</DSContext.Provider>;
}

export function useDS(): DailyRiffsDS {
  const ds = React.useContext(DSContext);
  if (!ds) throw new Error('useDS fuera de DSProvider');
  return ds;
}

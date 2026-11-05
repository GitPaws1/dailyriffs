'use client';
import { useEffect, useState } from 'react';
import { load, type Store } from './storage';
/** Lee el progreso local y se actualiza cuando cambia (en esta u otra pestaña). */
export function useStore(): Store {
  const [s, setS] = useState<Store>(() => load());
  useEffect(() => {
    const on = () => setS(load());
    window.addEventListener('dailyriffs:store', on);
    window.addEventListener('storage', on);
    return () => { window.removeEventListener('dailyriffs:store', on); window.removeEventListener('storage', on); };
  }, []);
  return s;
}

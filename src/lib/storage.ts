/* Progreso local (por dispositivo). Lecturas y escrituras protegidas: el almacenamiento puede no existir. */
const KEY = 'dailyriffs:v1';
export interface Store { done: Record<string, string>; best: Record<string, number>; bpm: { date: string; bpm: number }[]; theme?: 'stage' | 'cassette'; lang?: 'es' | 'en' }
const empty = (): Store => ({ done: {}, best: {}, bpm: [] });

export function load(): Store {
  try { const raw = window.localStorage.getItem(KEY); return raw ? { ...empty(), ...JSON.parse(raw) } : empty(); } catch { return empty(); }
}
export function save(mut: (s: Store) => void): Store {
  const s = load(); mut(s);
  try { window.localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* sin almacenamiento */ }
  window.dispatchEvent(new Event('dailyriffs:store'));
  return s;
}
export const today = () => new Date().toISOString().slice(0, 10);

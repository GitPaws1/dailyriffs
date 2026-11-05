'use client';
/* i18n base sin dependencias. El sitio es export estático (GitHub Pages): no hay proxy que negocie
   Accept-Language, así que el idioma vive en el cliente (store local → es).
   Cuando haya servidor, el paso natural es app/[lang] + proxy.ts reutilizando estos diccionarios. */
import * as React from 'react';
import es from './es.json';
import en from './en.json';
import { load, save } from '@/lib/storage';

export type Locale = 'es' | 'en';
export type Dict = typeof es;
export const LOCALES: Locale[] = ['es', 'en'];
const DICTS: Record<Locale, Dict> = { es, en: en as Dict };

interface Ctx { lang: Locale; t: Dict; setLang: (l: Locale) => void }
const I18n = React.createContext<Ctx>({ lang: 'es', t: es, setLang: () => {} });

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, set] = React.useState<Locale>('es');
  React.useEffect(() => {
    // Español por defecto: el contenido (lecciones, acordes) es en español. EN solo si se elige.
    const saved = load().lang;
    if (saved) set(saved);
  }, []);
  React.useEffect(() => { document.documentElement.lang = lang === 'es' ? 'es-MX' : lang; }, [lang]);
  const setLang = React.useCallback((l: Locale) => { set(l); save((s) => { s.lang = l; }); }, []);
  return <I18n.Provider value={{ lang, t: DICTS[lang], setLang }}>{children}</I18n.Provider>;
}

export const useI18n = () => React.useContext(I18n);
export const useT = () => React.useContext(I18n).t;

'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useDS } from '@/ds/DSProvider';
import type { Channel } from '@/ds/types';
import { BASE, href } from '@/lib/nav';
import { save } from '@/lib/storage';

const ITEMS: { channel: Channel; label: string; path: string }[] = [
  { channel: 'teoria', label: 'Diapasón', path: '/diapason/' },
  { channel: 'tecnica', label: 'Acordes', path: '/acordes/' },
  { channel: 'repertorio', label: 'Canciones', path: '/canciones/' },
  { channel: 'instrumento', label: 'Afinador', path: '/afinar/' },
];

export function Shell({ active, children }: { active?: Channel; children: React.ReactNode }) {
  const ds = useDS();
  const router = useRouter();
  const [theme, setTheme] = React.useState<'stage' | 'cassette'>('stage');
  React.useEffect(() => { setTheme(document.documentElement.dataset.theme === 'cassette' ? 'cassette' : 'stage'); }, []);

  function toggleTheme() {
    const t = theme === 'stage' ? 'cassette' : 'stage';
    document.documentElement.dataset.theme = t;
    setTheme(t);
    save((s) => { s.theme = t; });
  }

  /* Navegación del lado del cliente para los <a> internos de los componentes (NavBar, LessonCard, CourseTape). */
  function onClickCapture(e: React.MouseEvent) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as HTMLElement).closest('a');
    if (!a || a.target || a.hasAttribute('download')) return;
    const url = new URL(a.href, window.location.href);
    if (url.origin !== window.location.origin || !url.pathname.startsWith(BASE + '/')) return;
    e.preventDefault();
    router.push(url.pathname.slice(BASE.length) + url.search + url.hash);
  }

  return (
    <div onClickCapture={onClickCapture}>
      <a className="skip" href="#main">Saltar al contenido</a>
      <ds.NavBar items={ITEMS.map((i) => ({ channel: i.channel, label: i.label, href: href(i.path) }))} active={active} homeHref={href('/')} cta={null} />
      <main id="main">{children}</main>
      <footer className="footer">
        <p className="kicker">DAILYRIFFS · FASE 1 · <a className="link" href={href('/metronomo/')}>METRÓNOMO</a> · <a className="link" href={href('/lecciones/')}>LECCIONES</a></p>
        <ds.Button variant="key" size="sm" led={theme === 'cassette'} onClick={toggleTheme} aria-label="Tema claro Cassette">CASSETTE</ds.Button>
      </footer>
    </div>
  );
}

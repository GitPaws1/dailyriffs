import type { Metadata, Viewport } from 'next';
import '@/styles/fonts.css';
import '@/styles/tokens.css';
import '@/styles/ds-bundle.css';
import '@/styles/responsive.css';
import '@/styles/app.css';
import '@/styles/app-ext.css';
import { DSProvider } from '@/ds/DSProvider';
import { I18nProvider } from '@/i18n/I18nProvider';
import { RigProvider } from '@/lib/gear/RigProvider';

export const metadata: Metadata = {
  title: { default: 'DailyRiffs', template: '%s · DailyRiffs' },
  icons: { icon: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22%3E%3Ccircle cx=%228%22 cy=%228%22 r=%226%22 fill=%22%23fc6e02%22/%3E%3C/svg%3E' },
  description: 'Aprende guitarra eléctrica desde cero, tocando: afinador, diapasón, acordes, metrónomo, tabs con metrónomo y lecciones cortas.',
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#000000' };

/* Aplica el tema guardado antes de pintar, para evitar parpadeo. */
const themeScript = `try{var s=JSON.parse(localStorage.getItem('dailyriffs:v1')||'{}');if(s.theme==='cassette')document.documentElement.dataset.theme='cassette'}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX" data-theme="stage" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body><I18nProvider><RigProvider><DSProvider>{children}</DSProvider></RigProvider></I18nProvider></body>
    </html>
  );
}

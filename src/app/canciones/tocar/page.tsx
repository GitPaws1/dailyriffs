import { Suspense } from 'react';
import { CancionView } from '@/views/CancionView';
export const metadata = { title: 'Tocar' };
export default function Page() { return <Suspense fallback={null}><CancionView /></Suspense>; }

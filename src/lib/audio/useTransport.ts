'use client';

import { useEffect, useMemo, useState } from 'react';
import { PracticeTransport, type LoadOpts, type TransportState } from './transport';

/** Un transport por vista. Se detiene al desmontar; en segundo plano sigue sonando (el reloj es de audio, no de pantalla). */
export function useTransport(bpm: number, load?: LoadOpts) {
  const t = useMemo(() => new PracticeTransport(bpm), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [state, setState] = useState<TransportState>(t.state);

  useEffect(() => t.subscribe(setState), [t]);
  useEffect(() => { if (load) t.load(load); }, [t, load]);
  useEffect(() => () => t.dispose(), [t]);

  return { t, state };
}

export type TransportHandle = ReturnType<typeof useTransport>;

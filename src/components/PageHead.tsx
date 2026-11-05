'use client';
import { useDS } from '@/ds/DSProvider';
import type { Channel } from '@/ds/types';

export function PageHead({ channel, title, kicker, lead }: { channel: Channel; title: string; kicker?: string; lead?: string }) {
  const ds = useDS();
  return (
    <header className="stack section--tight read">
      <div className="row row--center"><ds.ChannelTag channel={channel} jp />{kicker ? <span className="kicker">{kicker}</span> : null}</div>
      <ds.SectionTitle title={title} align="left" as="h1" />
      {lead ? <p className="lead">{lead}</p> : null}
    </header>
  );
}

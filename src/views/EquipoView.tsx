'use client';
import { Shell } from '@/components/Shell';
import { PageHead } from '@/components/PageHead';
import { RigPanel } from '@/components/gear/RigPanel';
import { useT } from '@/i18n/I18nProvider';

export function EquipoView() {
  const t = useT();
  return (
    <Shell active="instrumento">
      <div className="page">
        <PageHead channel="instrumento" kicker="SQUIER STRATOCASTER SSS · FENDER FRONTMAN 10G" title={t.gear.title} lead={t.gear.summary} />
        <section className="section--tight"><RigPanel g={t.gear} /></section>
      </div>
    </Shell>
  );
}

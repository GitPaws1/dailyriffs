import { LESSONS, lessonById } from '@/lib/content';
import { LessonView } from '@/views/LessonView';

export const dynamicParams = false;
export function generateStaticParams() { return LESSONS.map((l) => ({ id: l.id })); }
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `${id} · ${lessonById(id)?.title ?? 'Lección'}` };
}
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LessonView id={id} />;
}

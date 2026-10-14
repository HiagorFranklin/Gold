import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActor } from "@/lib/auth";
import { getTopic } from "@/lib/data";
import { can } from "@/lib/permissions";
import { TopicForm } from "@/components/admin/TopicForm";
import { Notice, PageTitle } from "@/components/admin/ui";

export const metadata = { title: "Editar ficha" };

export default async function EditTopic({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ salvo?: string }> }) {
  const actor = await requireActor("health:edit");
  const { id } = await params;
  const { salvo } = await searchParams;
  const topic = getTopic(Number(id));
  if (!topic) notFound();
  return (
    <div className="max-w-4xl">
      <Link href="/admin/saude" className="text-xs text-mist hover:text-gold">← Conteúdo de saúde</Link>
      <PageTitle title={topic.title}>
        {topic.published ? (
          <Link href={`/saude/${topic.slug}`} target="_blank" className="text-xs text-gold hover:underline">Ver no site ↗</Link>
        ) : null}
      </PageTitle>
      {salvo && <div className="mb-6"><Notice kind="success">Ficha salva.</Notice></div>}
      <TopicForm key={topic.updated_at} topic={topic} canPublish={can(actor, "health:publish")} />
    </div>
  );
}

import Link from "next/link";
import { requireActor } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { TopicForm } from "@/components/admin/TopicForm";
import { PageTitle } from "@/components/admin/ui";

export const metadata = { title: "Nova ficha" };

export default async function NewTopic() {
  const actor = await requireActor("health:edit");
  return (
    <div className="max-w-4xl">
      <Link href="/admin/saude" className="text-xs text-mist hover:text-gold">← Conteúdo de saúde</Link>
      <PageTitle title="Nova ficha educativa" />
      <TopicForm topic={null} canPublish={can(actor, "health:publish")} />
    </div>
  );
}

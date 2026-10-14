import Link from "next/link";
import { requireActor } from "@/lib/auth";
import { listAllTopics } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { can } from "@/lib/permissions";
import { PageTitle } from "@/components/admin/ui";

export const metadata = { title: "Conteúdo de saúde" };

export default async function TopicsAdmin() {
  const actor = await requireActor();
  const topics = listAllTopics();
  return (
    <div className="max-w-5xl">
      <PageTitle title="Conteúdo de saúde" intro="Fichas educativas por princípio ativo. Conteúdo preliminar aparece com o aviso de revisão pendente.">
        {can(actor, "health:edit") && (
          <Link href="/admin/saude/novo" className="btn-gold">Nova ficha</Link>
        )}
      </PageTitle>
      <div className="card-gp divide-y divide-line">
        {topics.map((t) => (
          <Link key={t.id} href={`/admin/saude/${t.id}`} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-white/[0.02]">
            <div>
              <p className="font-semibold">{t.title}</p>
              <p className="text-xs text-mist-2">Revisão: {formatDate(t.reviewed_at)}{t.reviewed_by ? ` · ${t.reviewed_by}` : ""}</p>
            </div>
            <div className="flex gap-2 text-[11px] font-semibold">
              <span className={`rounded-full px-2.5 py-0.5 ${t.review_status === "revisado" ? "bg-emerald-400/15 text-emerald-300" : "bg-amber-300/15 text-amber-200"}`}>
                {t.review_status === "revisado" ? "Revisado" : "Preliminar"}
              </span>
              <span className={`rounded-full px-2.5 py-0.5 ${t.published ? "bg-gold/15 text-gold" : "bg-white/5 text-mist-2"}`}>
                {t.published ? "Publicado" : "Rascunho"}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

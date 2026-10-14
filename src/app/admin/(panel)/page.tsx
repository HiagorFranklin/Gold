import Link from "next/link";
import { requireActor } from "@/lib/auth";
import { listAdminProducts, listAllTopics, listAudit, listMessages, getSettings } from "@/lib/data";
import { REGULATORY_STATUSES } from "@/lib/compliance";
import { formatDateTime } from "@/lib/format";
import { Notice, PageTitle, StatusBadge } from "@/components/admin/ui";
import { can } from "@/lib/permissions";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const actor = await requireActor();
  const { erro } = await searchParams;
  const products = listAdminProducts();
  const topics = listAllTopics();
  const settings = getSettings();
  const messages = can(actor, "messages:view") ? listMessages().filter((m) => !m.handled) : [];
  const audit = can(actor, "audit:view") ? listAudit(8) : [];
  const blocked = products.filter((p) => p.compliance.hardBlocked).length;
  const publicCount = products.filter((p) => p.compliance.effective.publicListing).length;
  const pending = products.filter((p) => p.regulatory_status === "pendente_verificacao" || p.regulatory_status === "em_analise").length;

  const missing = [
    !settings.whatsapp_number && "Número do WhatsApp",
    !settings.hero_image_url && "Fotografia do banner principal",
    !settings.training_image_url && "Imagem de treino",
    !settings.science_image_url && "Imagem de ciência/laboratório",
    !settings.contact_email && !settings.contact_phone && "E-mail ou telefone de contato",
    !settings.cnpj && "CNPJ e razão social",
  ].filter(Boolean) as string[];

  return (
    <div>
      <PageTitle title="Visão geral" intro="Resumo do cadastro, da situação regulatória e das pendências do site." />
      {erro === "permissao" && (
        <div className="mb-6">
          <Notice kind="error">Seu perfil não tem permissão para acessar aquela área.</Notice>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Produtos cadastrados", products.length],
          ["Visíveis ao público", publicCount],
          ["Com proibição vigente", blocked],
          ["Pendentes / em análise", pending],
        ].map(([label, value]) => (
          <div key={label} className="card-gp p-5">
            <p className="text-xs uppercase tracking-wider text-mist">{label}</p>
            <p className="mt-2 font-display text-4xl text-gold">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="card-gp p-6">
          <h2 className="font-display text-2xl">Situação regulatória</h2>
          <ul className="mt-4 space-y-2">
            {REGULATORY_STATUSES.map((s) => (
              <li key={s} className="flex items-center justify-between text-sm">
                <StatusBadge status={s} />
                <Link href={`/admin/produtos?status=${s}`} className="text-mist hover:text-gold">
                  {products.filter((p) => p.regulatory_status === s).length} itens →
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section className="card-gp p-6">
          <h2 className="font-display text-2xl">Pendências de configuração</h2>
          {missing.length ? (
            <ul className="mt-4 space-y-2 text-sm text-amber-100">
              {missing.map((m) => (
                <li key={m}>• {m}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-mist">Nenhuma pendência.</p>
          )}
          {can(actor, "settings:edit") && (
            <Link href="/admin/configuracoes" className="btn-outline mt-5 !px-4 !py-2 text-xs">
              Abrir configurações
            </Link>
          )}
          <p className="mt-6 text-sm text-mist">
            Conteúdo de saúde: {topics.filter((t) => t.published).length} publicados,{" "}
            {topics.filter((t) => t.review_status !== "revisado").length} aguardando revisão profissional.
          </p>
          {messages.length > 0 && (
            <p className="mt-2 text-sm text-mist">
              <Link href="/admin/mensagens" className="text-gold hover:underline">
                {messages.length} mensagem(ns) de contato sem resposta
              </Link>
            </p>
          )}
        </section>
      </div>

      {audit.length > 0 && (
        <section className="card-gp mt-6 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl">Alterações recentes</h2>
            <Link href="/admin/auditoria" className="text-xs text-gold">
              Ver histórico →
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-line text-sm">
            {audit.map((a) => (
              <li key={a.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span>
                  <span className="text-white/85">{a.admin_email}</span> · {a.action} · {a.entity}
                </span>
                <span className="text-mist-2">{formatDateTime(a.created_at)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

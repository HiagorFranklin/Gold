/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { requireActor } from "@/lib/auth";
import { listAdminProducts } from "@/lib/data";
import { REGULATORY_STATUSES, REGULATORY_STATUS_LABELS, normalize, type RegulatoryStatus } from "@/lib/compliance";
import { formatBRL, formatDate } from "@/lib/format";
import { can } from "@/lib/permissions";
import { BlockNotice, Flag, PageTitle, StatusBadge } from "@/components/admin/ui";

export const metadata = { title: "Produtos" };

export default async function ProductsAdmin({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const actor = await requireActor();
  const { status, q } = await searchParams;
  let products = listAdminProducts();
  if (status && (REGULATORY_STATUSES as readonly string[]).includes(status)) products = products.filter((p) => p.regulatory_status === status);
  if (q) products = products.filter((p) => normalize(`${p.name} ${p.active_ingredient} ${p.manufacturer}`).includes(normalize(q)));

  return (
    <div>
      <PageTitle title="Produtos" intro="Cadastro interno completo. A exibição pública, os preços e os pedidos dependem da situação regulatória de cada item.">
        {can(actor, "products:edit") && (
          <Link href="/admin/produtos/novo" className="btn-gold">
            Novo produto
          </Link>
        )}
      </PageTitle>

      <form className="card-gp mb-6 grid gap-3 p-4 md:grid-cols-[2fr_1fr_auto]" role="search">
        <input name="q" defaultValue={q} placeholder="Pesquisar nome, princípio ativo ou fabricante" className="input-gp" aria-label="Pesquisar" />
        <select name="status" defaultValue={status ?? ""} className="input-gp" aria-label="Situação regulatória">
          <option value="">Todas as situações</option>
          {REGULATORY_STATUSES.map((s) => (
            <option key={s} value={s}>
              {REGULATORY_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <button className="btn-outline !py-2.5">Filtrar</button>
      </form>

      <p className="mb-3 text-sm text-mist">{products.length} produto(s)</p>
      <div className="card-gp overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-gold/25 text-[11px] uppercase tracking-[0.14em] text-gold">
            <tr>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Apresentação</th>
              <th className="px-4 py-3 text-right">Valor de referência</th>
              <th className="px-4 py-3">Situação regulatória</th>
              <th className="px-4 py-3">Exibição pública efetiva</th>
              <th className="px-4 py-3">Atualizado</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const e = p.compliance.effective;
              return (
                <tr key={p.id} className="border-b border-line align-top last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      {p.image_url ? (
                        <img src={p.image_url} alt="" className="h-10 w-10 rounded object-cover" />
                      ) : (
                        <span className="h-10 w-10 shrink-0 rounded border border-dashed border-white/15" aria-hidden="true" />
                      )}
                      <div>
                        <Link href={`/admin/produtos/${p.id}`} className="font-semibold hover:text-gold">
                          {p.name}
                        </Link>
                        <p className="text-xs text-mist-2">
                          {p.active_ingredient} · {p.manufacturer || "fabricante não informado"}
                        </p>
                        {p.compliance.hardBlocked && <BlockNotice className="mt-1" />}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-mist">{p.presentation}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatBRL(p.price_cents)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.regulatory_status as RegulatoryStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <Flag on={e.publicListing} label="Ficha" />
                      <Flag on={e.price} label="Preço" />
                      <Flag on={e.availability} label="Disponível" />
                      <Flag on={e.whatsappOrder} label="WhatsApp" />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-mist">{formatDate(p.updated_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import Link from "next/link";
import { requireActor } from "@/lib/auth";
import { listAdminProducts } from "@/lib/data";
import {
  DISPLAY_GROUPS,
  DISPLAY_GROUP_HINTS,
  DISPLAY_GROUP_LABELS,
  displayGroup,
  normalize,
  publicVisibilitySummary,
  type DisplayGroup,
} from "@/lib/compliance";
import { formatDate } from "@/lib/format";
import { PageTitle, StatusBadge } from "@/components/admin/ui";

export const metadata = { title: "Consulta regulatória" };

const GROUP_STYLE: Record<DisplayGroup, string> = {
  aprovado: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  pendente: "border-amber-300/30 bg-amber-300/10 text-amber-200",
  restrito: "border-violet-300/30 bg-violet-300/10 text-violet-200",
  bloqueado: "border-red-400/30 bg-red-400/10 text-red-300",
};

export default async function RegulatoryConsult({ searchParams }: { searchParams: Promise<{ q?: string; grupo?: string; fabricante?: string }> }) {
  await requireActor("panel:view");
  const { q = "", grupo = "", fabricante = "" } = await searchParams;
  const all = listAdminProducts().map((p) => ({ ...p, group: displayGroup(p.regulatory_status, p.compliance) }));
  const manufacturers = [...new Set(all.map((p) => p.manufacturer).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const rows = all.filter(
    (p) =>
      (!q || normalize(`${p.name} ${p.active_ingredient}`).includes(normalize(q))) &&
      (!grupo || p.group === grupo) &&
      (!fabricante || p.manufacturer === fabricante),
  );

  return (
    <div>
      <PageTitle
        title="Consulta regulatória"
        intro="Todos os produtos do banco, com a situação regulatória e o que cada um exibe no site. Nenhum registro é removido; a exibição pública é decidida item a item."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {DISPLAY_GROUPS.map((g) => (
          <Link
            key={g}
            href={grupo === g ? "/admin/consulta-regulatoria" : `/admin/consulta-regulatoria?grupo=${g}`}
            aria-current={grupo === g ? "true" : undefined}
            className={`rounded-2xl border p-4 transition hover:brightness-125 ${GROUP_STYLE[g]} ${grupo === g ? "ring-2 ring-gold/50" : ""}`}
          >
            <p className="text-xs font-semibold uppercase tracking-wider">{DISPLAY_GROUP_LABELS[g]}</p>
            <p className="mt-1 font-display text-4xl">{all.filter((p) => p.group === g).length}</p>
            <p className="mt-1 text-xs opacity-80">{DISPLAY_GROUP_HINTS[g]}</p>
          </Link>
        ))}
      </div>

      <form className="card-gp mb-4 grid gap-3 p-4 md:grid-cols-[2fr_1fr_1fr_auto]" role="search">
        <input name="q" defaultValue={q} placeholder="Pesquisar nome ou princípio ativo" aria-label="Pesquisar" className="input-gp" />
        <select name="grupo" defaultValue={grupo} aria-label="Classificação" className="input-gp">
          <option value="">Todas as classificações</option>
          {DISPLAY_GROUPS.map((g) => (
            <option key={g} value={g}>
              {DISPLAY_GROUP_LABELS[g]}
            </option>
          ))}
        </select>
        <select name="fabricante" defaultValue={fabricante} aria-label="Fabricante informado" className="input-gp">
          <option value="">Todos os fabricantes</option>
          {manufacturers.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <button className="btn-outline !py-2.5">Filtrar</button>
      </form>

      <p className="mb-3 text-sm text-mist">
        {rows.length} de {all.length} produto(s)
      </p>
      <div className="card-gp overflow-x-auto">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <caption className="sr-only">Consulta regulatória dos produtos</caption>
          <thead className="border-b border-gold/25 text-[11px] uppercase tracking-[0.14em] text-gold">
            <tr>
              <th scope="col" className="px-4 py-3">Produto</th>
              <th scope="col" className="px-4 py-3">Apresentação</th>
              <th scope="col" className="px-4 py-3">Fabricante informado</th>
              <th scope="col" className="px-4 py-3">Classificação</th>
              <th scope="col" className="px-4 py-3">Status regulatório</th>
              <th scope="col" className="px-4 py-3">No site</th>
              <th scope="col" className="px-4 py-3">Motivo / verificação</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-b border-line align-top last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/admin/produtos/${p.id}`} className="font-semibold hover:text-gold">
                    {p.name}
                  </Link>
                  <p className="text-xs text-mist-2">{p.active_ingredient}</p>
                </td>
                <td className="px-4 py-3 text-mist">{p.presentation || "—"}</td>
                <td className="px-4 py-3 text-mist">{p.manufacturer || "Não informado"}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${GROUP_STYLE[p.group]}`}>
                    {DISPLAY_GROUP_LABELS[p.group]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.regulatory_status} />
                </td>
                <td className="px-4 py-3 text-xs text-white/80">{publicVisibilitySummary(p.compliance)}</td>
                <td className="max-w-xs px-4 py-3 text-xs text-mist">
                  {p.compliance.hardRules.length > 0 ? (
                    <ul className="space-y-0.5">
                      {p.compliance.hardRules.map((r) => (
                        <li key={r.id}>• {r.title}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="line-clamp-2">{p.regulatory_justification || "Sem justificativa registrada"}</p>
                  )}
                  <p className="mt-1 text-mist-2">Verificação: {formatDate(p.regulatory_checked_at)}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

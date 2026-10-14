import { requireActor } from "@/lib/auth";
import { listAudit } from "@/lib/data";
import { formatDateTime } from "@/lib/format";
import { PageTitle } from "@/components/admin/ui";

export const metadata = { title: "Auditoria" };

export default async function AuditAdmin() {
  await requireActor("audit:view");
  const rows = listAudit(500);
  return (
    <div>
      <PageTitle title="Histórico de auditoria" intro="Registro das alterações importantes: produtos, preços, situação regulatória, conteúdo, configurações e acessos." />
      <div className="card-gp overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-gold/25 text-[11px] uppercase tracking-[0.14em] text-gold">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Usuário</th>
              <th className="px-4 py-3">Ação</th>
              <th className="px-4 py-3">Entidade</th>
              <th className="px-4 py-3">Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-line align-top last:border-0">
                <td className="whitespace-nowrap px-4 py-2 text-xs text-mist">{formatDateTime(r.created_at)}</td>
                <td className="px-4 py-2">{r.admin_email}</td>
                <td className="px-4 py-2">{r.action}</td>
                <td className="px-4 py-2 text-mist">{r.entity}{r.entity_id ? ` · ${r.entity_id.slice(0, 8)}` : ""}</td>
                <td className="max-w-md px-4 py-2"><code className="block truncate text-xs text-mist-2" title={r.details}>{r.details}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

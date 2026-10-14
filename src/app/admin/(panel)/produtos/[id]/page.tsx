import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActor } from "@/lib/auth";
import { getAdminProduct, listAllTopics, listCategories, type AuditEntry } from "@/lib/data";
import { getDb } from "@/lib/db";
import { can } from "@/lib/permissions";
import { productToFormValues } from "@/lib/admin-forms";
import { formatDateTime } from "@/lib/format";
import { ProductForm } from "@/components/admin/ProductForm";
import { Notice, PageTitle, StatusBadge } from "@/components/admin/ui";

export const metadata = { title: "Editar produto" };

export default async function EditProduct({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ salvo?: string }> }) {
  const actor = await requireActor();
  const { id } = await params;
  const { salvo } = await searchParams;
  const product = getAdminProduct(id);
  if (!product) notFound();
  const history = can(actor, "audit:view")
    ? (getDb().prepare("SELECT * FROM audit_log WHERE entity = 'product' AND entity_id = ? ORDER BY id DESC LIMIT 30").all(id) as AuditEntry[])
    : [];

  return (
    <div className="max-w-5xl">
      <Link href="/admin/produtos" className="text-xs text-mist hover:text-gold">← Produtos</Link>
      <PageTitle title={product.name} intro={`${product.presentation} · ID ${product.id}`}>
        <div className="flex items-center gap-3">
          <StatusBadge status={product.regulatory_status} />
          {product.compliance.effective.publicListing && (
            <Link href={`/catalogo/${product.slug}`} target="_blank" className="text-xs text-gold hover:underline">
              Ver página pública ↗
            </Link>
          )}
        </div>
      </PageTitle>
      {salvo && (
        <div className="mb-6">
          <Notice kind="success">Alterações salvas e refletidas no site.</Notice>
        </div>
      )}
      <ProductForm
        key={product.updated_at}
        values={productToFormValues(product)}
        categories={listCategories()}
        topics={listAllTopics()}
        canEdit={can(actor, "products:edit")}
        canPrice={can(actor, "products:price")}
        canRegulatory={can(actor, "products:regulatory")}
      />
      {history.length > 0 && (
        <section className="card-gp mt-8 p-6">
          <h2 className="font-display text-2xl">Histórico de alterações</h2>
          <ul className="mt-4 divide-y divide-line text-sm">
            {history.map((h) => {
              const details = JSON.parse(h.details || "{}") as { changes?: Record<string, { de: unknown; para: unknown }> };
              return (
                <li key={h.id} className="py-3">
                  <p>
                    <span className="text-white/85">{h.admin_email}</span> · {h.action} ·{" "}
                    <span className="text-mist-2">{formatDateTime(h.created_at)}</span>
                  </p>
                  {details.changes && (
                    <ul className="mt-1 space-y-0.5 text-xs text-mist">
                      {Object.entries(details.changes).map(([k, c]) => (
                        <li key={k}>
                          <span className="text-gold/80">{k}</span>: {String(c.de ?? "—").slice(0, 80)} → {String(c.para ?? "—").slice(0, 80)}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

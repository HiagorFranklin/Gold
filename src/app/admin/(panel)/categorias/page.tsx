import { requireActor } from "@/lib/auth";
import { listAdminProducts, listCategories } from "@/lib/data";
import { can } from "@/lib/permissions";
import { deleteCategoryAction, saveCategoryAction } from "@/app/admin/actions";
import { ActionForm } from "@/components/admin/ActionForm";
import { Notice, PageTitle } from "@/components/admin/ui";

export const metadata = { title: "Categorias" };

function Fields({ c }: { c?: { id: number; name: string; description: string; sort_order: number; image_url: string | null } }) {
  const p = c ? `c${c.id}-` : "new-";
  return (
    <div className="grid gap-4 md:grid-cols-[2fr_3fr_100px]">
      {c && <input type="hidden" name="id" value={c.id} />}
      <div>
        <label htmlFor={`${p}name`} className="label-gp">Nome</label>
        <input id={`${p}name`} name="name" defaultValue={c?.name} required className="input-gp" />
      </div>
      <div>
        <label htmlFor={`${p}desc`} className="label-gp">Descrição</label>
        <input id={`${p}desc`} name="description" defaultValue={c?.description} className="input-gp" />
      </div>
      <div>
        <label htmlFor={`${p}order`} className="label-gp">Ordem</label>
        <input id={`${p}order`} name="sort_order" type="number" min={0} defaultValue={c?.sort_order ?? 0} className="input-gp" />
      </div>
      <div className="md:col-span-3">
        <label htmlFor={`${p}img`} className="label-gp">Imagem do card (opcional)</label>
        <input id={`${p}img`} name="image_file" type="file" accept="image/jpeg,image/png,image/webp" className="input-gp" />
        {c?.image_url && (
          <label className="mt-2 flex items-center gap-2 text-xs text-mist">
            <input type="checkbox" name="remove_image" className="accent-[#D4AF37]" /> Remover imagem atual
          </label>
        )}
      </div>
    </div>
  );
}

export default async function CategoriesAdmin({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const actor = await requireActor();
  const { erro } = await searchParams;
  const categories = listCategories();
  const products = listAdminProducts();
  const editable = can(actor, "categories:edit");
  return (
    <div className="max-w-5xl">
      <PageTitle title="Categorias" intro="Organize o catálogo. Categorias com produtos vinculados não podem ser excluídas." />
      {erro === "em-uso" && (
        <div className="mb-6">
          <Notice kind="error">Esta categoria possui produtos vinculados e não pode ser excluída.</Notice>
        </div>
      )}
      <div className="space-y-4">
        {categories.map((c) => {
          const n = products.filter((p) => p.category_id === c.id).length;
          return (
            <div key={c.id} className="card-gp p-5">
              <p className="mb-3 text-xs text-mist">
                /{c.slug} · {n} produto(s)
              </p>
              {editable ? (
                <>
                  <ActionForm action={saveCategoryAction}>
                    <Fields c={c} />
                  </ActionForm>
                  {n === 0 && (
                    <form action={deleteCategoryAction} className="mt-3">
                      <input type="hidden" name="id" value={c.id} />
                      <button className="text-xs text-red-300 hover:underline">Excluir categoria</button>
                    </form>
                  )}
                </>
              ) : (
                <p className="font-semibold">{c.name}</p>
              )}
            </div>
          );
        })}
      </div>
      {editable && (
        <section className="card-gp mt-8 border-gold/30 p-5">
          <h2 className="mb-4 font-display text-2xl">Nova categoria</h2>
          <ActionForm action={saveCategoryAction} submitLabel="Criar categoria">
            <Fields />
          </ActionForm>
        </section>
      )}
    </div>
  );
}

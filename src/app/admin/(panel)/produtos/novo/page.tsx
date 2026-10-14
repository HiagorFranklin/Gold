import Link from "next/link";
import { requireActor } from "@/lib/auth";
import { listAllTopics, listCategories } from "@/lib/data";
import { can } from "@/lib/permissions";
import { productToFormValues } from "@/lib/admin-forms";
import { ProductForm } from "@/components/admin/ProductForm";
import { PageTitle } from "@/components/admin/ui";

export const metadata = { title: "Novo produto" };

export default async function NewProduct() {
  const actor = await requireActor("products:edit");
  return (
    <div className="max-w-5xl">
      <Link href="/admin/produtos" className="text-xs text-mist hover:text-gold">← Produtos</Link>
      <PageTitle title="Novo produto" intro="Todo produto novo começa como “Pendente de verificação” e não é exibido ao público até a confirmação da regularidade." />
      <ProductForm
        values={productToFormValues(null)}
        categories={listCategories()}
        topics={listAllTopics()}
        canEdit
        canPrice={can(actor, "products:price")}
        canRegulatory={can(actor, "products:regulatory")}
      />
    </div>
  );
}

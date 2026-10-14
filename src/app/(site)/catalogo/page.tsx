import type { Metadata } from "next";
import { listCategories, listPublicProducts } from "@/lib/data";
import { PageHero } from "@/components/site/PageHero";
import { CatalogBrowser } from "@/components/site/CatalogBrowser";
import { getSiteContext } from "@/lib/site";

export const metadata: Metadata = {
  title: "Catálogo de produtos",
  description: "Catálogo Gold Pharma com pesquisa, filtros por categoria e fabricante e fichas individuais.",
};

export default async function CatalogPage({ searchParams }: { searchParams: Promise<{ categoria?: string }> }) {
  const { categoria } = await searchParams;
  const { settings } = getSiteContext();
  const categories = listCategories();
  const initial = categories.some((c) => c.slug === categoria) ? categoria : "";
  return (
    <>
      <PageHero
        eyebrow="Catálogo"
        title="Catálogo de produtos"
        intro="Pesquise por nome, filtre por categoria ou fabricante e consulte a ficha completa de cada item. Somente itens com divulgação permitida são exibidos."
        variant="lab"
        image={settings.science_image_url}
        imageAlt={settings.science_image_alt}
      />
      <div className="container-gp py-14">
        <CatalogBrowser
          products={listPublicProducts()}
          categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
          initialCategory={initial}
        />
      </div>
    </>
  );
}

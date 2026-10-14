"use client";

import { useMemo, useState } from "react";
import type { PublicProduct } from "@/lib/data";
import { normalize } from "@/lib/compliance";
import { EmptyCatalog, ProductCard } from "./ProductCard";
import { SearchIcon } from "./icons";

type Props = {
  products: PublicProduct[];
  categories: { slug: string; name: string }[];
  initialCategory?: string;
};

export function CatalogBrowser({ products, categories, initialCategory = "" }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [manufacturer, setManufacturer] = useState("");
  const [order, setOrder] = useState<"az" | "za">("az");

  const manufacturers = useMemo(
    () => [...new Set(products.map((p) => p.manufacturer).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [products],
  );

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    const list = products.filter(
      (p) =>
        (!q || normalize(`${p.name} ${p.active_ingredient}`).includes(q)) &&
        (!category || p.category_slug === category) &&
        (!manufacturer || p.manufacturer === manufacturer),
    );
    list.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    if (order === "za") list.reverse();
    return list;
  }, [products, query, category, manufacturer, order]);

  return (
    <div>
      <div className="card-gp grid gap-4 p-4 md:grid-cols-[1.6fr_1fr_1fr_auto] md:items-end md:p-5">
        <div>
          <label htmlFor="busca" className="label-gp">
            Pesquisar
          </label>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-2" />
            <input
              id="busca"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nome do produto ou princípio ativo"
              className="input-gp pl-10"
            />
          </div>
        </div>
        <div>
          <label htmlFor="categoria" className="label-gp">
            Categoria
          </label>
          <select id="categoria" value={category} onChange={(e) => setCategory(e.target.value)} className="input-gp">
            <option value="">Todas</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="fabricante" className="label-gp">
            Fabricante
          </label>
          <select id="fabricante" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} className="input-gp">
            <option value="">Todos</option>
            {manufacturers.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="ordem" className="label-gp">
            Ordem
          </label>
          <select id="ordem" value={order} onChange={(e) => setOrder(e.target.value as "az" | "za")} className="input-gp">
            <option value="az">A → Z</option>
            <option value="za">Z → A</option>
          </select>
        </div>
      </div>

      <p className="mt-6 text-sm text-mist" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? "item encontrado" : "itens encontrados"}
      </p>

      {filtered.length > 0 ? (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="mt-6">
          {products.length === 0 ? (
            <EmptyCatalog
              title="Nenhum produto em exibição"
              text="No momento não há produtos com divulgação permitida para exibir. Fale com a nossa equipe para informações sobre o atendimento ou consulte o conteúdo educativo."
            />
          ) : (
            <EmptyCatalog title="Nenhum item encontrado" text="Ajuste a pesquisa ou os filtros para ver outros resultados." />
          )}
        </div>
      )}
    </div>
  );
}

"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useMemo, useState } from "react";
import type { PublicProduct } from "@/lib/data";
import { normalize } from "@/lib/compliance";
import { formatBRL } from "@/lib/format";
import { AVAILABILITY_LABEL, EmptyCatalog } from "./ProductCard";
import { LogoMark } from "./Logo";
import { SearchIcon, WhatsAppIcon } from "./icons";

type Row = PublicProduct & { whatsapp_href: string | null };
type SortKey = "name-asc" | "name-desc" | "price-asc" | "price-desc";

export function PriceTable({ rows, categories }: { rows: Row[]; categories: { slug: string; name: string }[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<SortKey>("name-asc");
  const hasPrices = rows.some((r) => r.price_cents != null);

  const list = useMemo(() => {
    const q = normalize(query.trim());
    const out = rows.filter(
      (r) => (!q || normalize(`${r.name} ${r.active_ingredient}`).includes(q)) && (!category || r.category_slug === category),
    );
    const byName = (a: Row, b: Row) => a.name.localeCompare(b.name, "pt-BR") || a.presentation.localeCompare(b.presentation, "pt-BR");
    out.sort((a, b) => {
      if (sort === "name-asc") return byName(a, b);
      if (sort === "name-desc") return byName(b, a);
      // Itens sem preço público vão para o fim
      const pa = a.price_cents ?? Number.POSITIVE_INFINITY;
      const pb = b.price_cents ?? Number.POSITIVE_INFINITY;
      if (pa === pb) return byName(a, b);
      if (sort === "price-asc") return pa - pb;
      if (a.price_cents == null) return 1;
      if (b.price_cents == null) return -1;
      return pb - pa;
    });
    return out;
  }, [rows, query, category, sort]);

  const thumb = (r: Row) =>
    r.image_url ? (
      <img src={r.image_url} alt={r.image_alt} loading="lazy" className="h-14 w-14 rounded-lg border border-line object-cover" />
    ) : (
      <span className="flex h-14 w-14 items-center justify-center rounded-lg border border-line bg-ink" role="img" aria-label={r.image_alt}>
        <LogoMark className="h-7 w-7 opacity-60" />
      </span>
    );

  const action = (r: Row) =>
    r.whatsapp_href ? (
      <a
        href={r.whatsapp_href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-full bg-gold px-4 py-2 text-xs font-semibold text-ink hover:bg-gold-soft"
        aria-label={`Consultar ${r.name} pelo WhatsApp`}
      >
        <WhatsAppIcon className="h-3.5 w-3.5" /> Consultar
      </a>
    ) : (
      <Link href={`/catalogo/${r.slug}`} className="inline-flex rounded-full border border-gold/40 px-4 py-2 text-xs font-semibold text-gold hover:bg-gold/10">
        Ver ficha
      </Link>
    );

  return (
    <div>
      <div className="card-gp grid gap-4 p-4 md:grid-cols-[1.6fr_1fr_1fr] md:items-end md:p-5">
        <div>
          <label htmlFor="tv-busca" className="label-gp">
            Pesquisar por nome
          </label>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-2" />
            <input id="tv-busca" type="search" value={query} onChange={(e) => setQuery(e.target.value)} className="input-gp pl-10" placeholder="Ex.: whey" />
          </div>
        </div>
        <div>
          <label htmlFor="tv-cat" className="label-gp">
            Categoria
          </label>
          <select id="tv-cat" value={category} onChange={(e) => setCategory(e.target.value)} className="input-gp">
            <option value="">Todas</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="tv-ordem" className="label-gp">
            Ordenar por
          </label>
          <select id="tv-ordem" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="input-gp">
            <option value="name-asc">Nome (A → Z)</option>
            <option value="name-desc">Nome (Z → A)</option>
            {hasPrices && <option value="price-asc">Menor valor</option>}
            {hasPrices && <option value="price-desc">Maior valor</option>}
          </select>
        </div>
      </div>

      <p className="mt-6 text-sm text-mist" aria-live="polite">
        {list.length} {list.length === 1 ? "item" : "itens"}
      </p>

      {list.length === 0 ? (
        <div className="mt-6">
          <EmptyCatalog
            title={rows.length === 0 ? "Tabela em atualização" : "Nenhum item encontrado"}
            text={
              rows.length === 0
                ? "Os valores são publicados somente para itens com regularidade sanitária verificada. Fale com a nossa equipe para mais informações sobre o atendimento."
                : "Ajuste a pesquisa ou o filtro de categoria."
            }
          />
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="card-gp mt-6 hidden overflow-hidden md:block">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Tabela de valores Gold Pharma</caption>
              <thead className="border-b border-gold/25 bg-ink/60 text-[11px] uppercase tracking-[0.18em] text-gold">
                <tr>
                  <th scope="col" className="px-5 py-4">Imagem</th>
                  <th scope="col" className="px-5 py-4">Nome</th>
                  <th scope="col" className="px-5 py-4">Apresentação</th>
                  <th scope="col" className="px-5 py-4 text-right">Valor</th>
                  <th scope="col" className="px-5 py-4">Disponibilidade</th>
                  <th scope="col" className="px-5 py-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id} className="border-b border-line transition last:border-0 hover:bg-white/[0.02]">
                    <td className="px-5 py-3">{thumb(r)}</td>
                    <td className="px-5 py-3">
                      <Link href={`/catalogo/${r.slug}`} className="font-semibold hover:text-gold">
                        {r.name}
                      </Link>
                      {r.category_name && <p className="text-xs text-mist-2">{r.category_name}</p>}
                    </td>
                    <td className="px-5 py-3 text-mist">{r.presentation}</td>
                    <td className="px-5 py-3 text-right font-semibold text-gold">
                      {r.price_cents != null ? formatBRL(r.price_cents) : <span className="text-xs font-normal text-mist-2">Não divulgado</span>}
                    </td>
                    <td className="px-5 py-3 text-mist">{r.availability ? AVAILABILITY_LABEL[r.availability] : "—"}</td>
                    <td className="px-5 py-3 text-right">{action(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Celular */}
          <ul className="mt-6 space-y-3 md:hidden">
            {list.map((r) => (
              <li key={r.id} className="card-gp flex gap-4 p-4">
                {thumb(r)}
                <div className="min-w-0 flex-1">
                  <Link href={`/catalogo/${r.slug}`} className="font-semibold leading-snug">
                    {r.name}
                  </Link>
                  <p className="text-xs text-mist">{r.presentation}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gold">{r.price_cents != null ? formatBRL(r.price_cents) : <span className="text-xs font-normal text-mist-2">Valor não divulgado</span>}</p>
                      <p className="text-xs text-mist-2">{r.availability ? AVAILABILITY_LABEL[r.availability] : "—"}</p>
                    </div>
                    {action(r)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

import Link from "next/link";
import type { PublicProduct } from "@/lib/data";
import { formatBRL } from "@/lib/format";
import { SceneImage } from "./SceneImage";

export const AVAILABILITY_LABEL = {
  disponivel: "Disponível",
  sob_consulta: "Sob consulta",
  indisponivel: "Indisponível",
} as const;

export function ProductCard({ product }: { product: PublicProduct }) {
  return (
    <article className="card-gp card-gp-hover group relative flex flex-col overflow-hidden">
      <SceneImage
        src={product.image_url}
        alt={product.image_alt}
        variant="product"
        overlay="bottom"
        className="aspect-square"
      />
      {product.image_url && product.image_is_illustrative && (
        <span className="absolute left-3 top-3 rounded-full bg-ink/80 px-2.5 py-1 text-[10px] uppercase tracking-wider text-mist">
          Imagem ilustrativa
        </span>
      )}
      <div className="flex flex-1 flex-col p-5">
        {product.category_name && <p className="text-[11px] uppercase tracking-[0.2em] text-gold/80">{product.category_name}</p>}
        <h3 className="mt-2 font-display text-2xl font-semibold leading-tight">
          <Link href={`/catalogo/${product.slug}`} className="after:absolute after:inset-0">
            {product.name}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-mist">{product.presentation}</p>
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            {product.price_cents != null ? (
              <p className="text-lg font-semibold text-gold">{formatBRL(product.price_cents)}</p>
            ) : (
              <p className="text-xs text-mist-2">Valor não divulgado</p>
            )}
            {product.availability && <p className="text-xs text-mist">{AVAILABILITY_LABEL[product.availability]}</p>}
          </div>
          <span className="text-xs font-semibold text-gold transition group-hover:translate-x-1">Ver ficha →</span>
        </div>
      </div>
    </article>
  );
}

export function EmptyCatalog({ title, text }: { title: string; text: string }) {
  return (
    <div className="card-gp flex flex-col items-center px-6 py-16 text-center">
      <div className="h-px w-16 bg-gradient-to-r from-transparent via-gold to-transparent" />
      <h3 className="mt-6 font-display text-3xl">{title}</h3>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-mist">{text}</p>
    </div>
  );
}

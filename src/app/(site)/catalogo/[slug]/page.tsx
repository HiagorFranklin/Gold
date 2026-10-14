import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicProduct, getPublishedTopicById } from "@/lib/data";
import { formatBRL, formatDate, parseSources, whatsappLink } from "@/lib/format";
import { getSiteContext, productWhatsappMessage } from "@/lib/site";
import { SceneImage } from "@/components/site/SceneImage";
import { HealthInfo } from "@/components/site/HealthInfo";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { AVAILABILITY_LABEL } from "@/components/site/ProductCard";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const p = getPublicProduct(slug);
  if (!p) return { title: "Item não encontrado" };
  return { title: p.name, description: `${p.name} — ${p.presentation}. Ficha informativa Gold Pharma.` };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  // Produtos bloqueados, pendentes ou sem divulgação permitida não possuem página pública.
  const product = getPublicProduct(slug);
  if (!product) notFound();
  const topic = getPublishedTopicById(product.health_topic_id);
  const { settings } = getSiteContext();
  const orderHref = product.whatsapp_order
    ? whatsappLink(settings.whatsapp_number, productWhatsappMessage(settings.whatsapp_message, product))
    : null;
  const refs = parseSources(product.reference_sources);

  return (
    <div className="container-gp pb-10 pt-32">
      <nav aria-label="Trilha" className="text-xs text-mist">
        <Link href="/catalogo" className="hover:text-gold">
          Catálogo
        </Link>
        <span className="mx-2 text-mist-2">/</span>
        <span className="text-white/80">{product.name}</span>
      </nav>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <div className="relative">
          <SceneImage src={product.image_url} alt={product.image_alt} variant="product" overlay="none" className="aspect-square rounded-3xl border border-line" />
          {product.image_url && product.image_is_illustrative && (
            <p className="mt-2 text-xs text-mist-2">Imagem ilustrativa. Não representa a embalagem real do produto.</p>
          )}
        </div>
        <div>
          {product.category_name && <p className="eyebrow">{product.category_name}</p>}
          <h1 className="heading-display mt-3 text-5xl">{product.name}</h1>
          <p className="mt-3 text-lg text-mist">{product.presentation}</p>

          <dl className="mt-8 grid grid-cols-2 gap-4 text-sm">
            {[
              ["Princípio ativo", product.active_ingredient || "Não informado"],
              ["Fabricante informado", product.manufacturer || "Não informado"],
              ["Situação", product.regulatory_label],
              ["Registro Anvisa", product.anvisa_registration || "—"],
              ["Verificação regulatória", formatDate(product.regulatory_checked_at)],
              ["Revisão das informações", formatDate(product.info_reviewed_at)],
            ].map(([k, v]) => (
              <div key={k} className="card-gp p-4">
                <dt className="text-[11px] uppercase tracking-[0.16em] text-mist-2">{k}</dt>
                <dd className="mt-1 text-white/90">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 flex flex-wrap items-center gap-6 rounded-2xl border border-gold/25 bg-graphite/70 p-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-mist-2">Valor</p>
              <p className="mt-1 text-3xl font-semibold text-gold">
                {product.price_cents != null ? formatBRL(product.price_cents) : <span className="text-base font-normal text-mist">Não divulgado</span>}
              </p>
              {product.availability && <p className="mt-1 text-sm text-mist">{AVAILABILITY_LABEL[product.availability]}</p>}
            </div>
            {orderHref && <WhatsAppButton href={orderHref} label="Consultar pelo WhatsApp" className="ml-auto" />}
          </div>

          {product.description && (
            <div className="prose-gp mt-8">
              {product.description.split("\n").filter(Boolean).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          )}

          {refs.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-mist">Fontes de referência</h2>
              <ul className="mt-2 space-y-1 text-sm">
                {refs.map((s, i) => (
                  <li key={i}>
                    {s.url ? (
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-gold/90 hover:underline">
                        {s.label}
                      </a>
                    ) : (
                      <span className="text-mist">{s.label}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="mt-16">
        <HealthInfo topic={topic} />
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { listCategories, listPublicProducts } from "@/lib/data";
import { whatsappLink } from "@/lib/format";
import { getSiteContext, productWhatsappMessage } from "@/lib/site";
import { PageHero } from "@/components/site/PageHero";
import { PriceTable } from "@/components/site/PriceTable";

export const metadata: Metadata = {
  title: "Tabela de Valores",
  description: "Tabela de valores Gold Pharma, atualizada a partir do cadastro.",
};

export default function PriceTablePage() {
  const { settings } = getSiteContext();
  const rows = listPublicProducts().map((p) => ({
    ...p,
    whatsapp_href: p.whatsapp_order
      ? whatsappLink(settings.whatsapp_number, productWhatsappMessage(settings.whatsapp_message, p))
      : null,
  }));
  return (
    <>
      <PageHero
        eyebrow="Valores"
        title="Tabela de Valores"
        intro="Valores carregados diretamente do cadastro. Preços e disponibilidade são exibidos apenas para itens com regularidade sanitária verificada."
        variant="brand"
        imageAlt="Composição gráfica Gold Pharma em preto e dourado"
      />
      <div className="container-gp py-14">
        <PriceTable rows={rows} categories={listCategories().map((c) => ({ slug: c.slug, name: c.name }))} />
        <p className="mt-8 text-xs leading-relaxed text-mist-2">
          Valores sujeitos a alteração sem aviso prévio. Medicamentos de venda sob prescrição e substâncias sujeitas a
          controle especial não são ofertados por este canal.
        </p>
      </div>
    </>
  );
}

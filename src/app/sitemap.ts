import type { MetadataRoute } from "next";
import { listPublicProducts, listPublishedTopics } from "@/lib/data";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.SITE_URL || "http://localhost:3000";
  const pages = ["", "/catalogo", "/tabela-de-valores", "/saude", "/sobre", "/contato", "/privacidade", "/termos", "/informacoes-legais"];
  return [
    ...pages.map((p) => ({ url: `${base}${p}` })),
    ...listPublicProducts().map((p) => ({ url: `${base}/catalogo/${p.slug}` })),
    ...listPublishedTopics().map((t) => ({ url: `${base}/saude/${t.slug}` })),
  ];
}

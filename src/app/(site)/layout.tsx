import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { getSiteContext } from "@/lib/site";

// Conteúdo sempre lido do banco: preços e textos refletem o painel imediatamente.
export const dynamic = "force-dynamic";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const { settings, whatsappHref } = getSiteContext();
  return (
    <>
      <Header whatsappHref={whatsappHref} />
      <main id="conteudo">{children}</main>
      <Footer settings={settings} whatsappHref={whatsappHref} />
    </>
  );
}

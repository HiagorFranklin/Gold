import type { Metadata } from "next";
import { getSiteContext } from "@/lib/site";
import { PageHero, SectionHeading } from "@/components/site/PageHero";
import { SceneImage } from "@/components/site/SceneImage";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";

export const metadata: Metadata = { title: "Sobre a Gold Pharma", description: "Conheça a Gold Pharma: missão, valores e compromisso com informação responsável." };

export default function AboutPage() {
  const { settings, whatsappHref } = getSiteContext();
  const values = settings.values.split("\n").map((v) => v.trim()).filter(Boolean);
  return (
    <>
      <PageHero eyebrow="Institucional" title="Sobre a Gold Pharma" intro={settings.mission} variant="brand" image={settings.about_image_url} imageAlt={settings.about_image_alt} />
      <section className="container-gp grid gap-12 py-20 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <SectionHeading eyebrow="Quem somos" title={settings.about_title} />
          <div className="prose-gp mt-6">
            {settings.about_text.split("\n\n").map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
        <SceneImage src={settings.training_image_url} alt={settings.training_image_alt} variant="gym" className="aspect-[4/5] rounded-2xl border border-line" />
      </section>
      {values.length > 0 && (
        <section className="border-y border-line bg-graphite/40 py-20">
          <div className="container-gp">
            <SectionHeading eyebrow="Valores" title="O que nos orienta" align="center" />
            <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {values.map((v, i) => (
                <li key={v} className="card-gp p-6 text-center">
                  <p className="font-display text-4xl text-gold/70">{String(i + 1).padStart(2, "0")}</p>
                  <p className="mt-3 font-semibold">{v}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
      <section className="container-gp py-20 text-center">
        <h2 className="heading-display text-4xl">Ficou com alguma dúvida?</h2>
        <p className="mx-auto mt-4 max-w-xl text-mist">Nossa equipe atende pelo WhatsApp. Você revisa a mensagem antes de enviar.</p>
        <WhatsAppButton href={whatsappHref} className="mt-8" />
      </section>
    </>
  );
}

import type { Metadata } from "next";
import { getSiteContext } from "@/lib/site";
import { PageHero } from "@/components/site/PageHero";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = { title: "Contato", description: "Fale com a Gold Pharma pelo WhatsApp ou pelo formulário de contato." };

export default function ContactPage() {
  const { settings, whatsappHref } = getSiteContext();
  const items = [
    ["E-mail", settings.contact_email],
    ["Telefone", settings.contact_phone],
    ["Endereço", settings.address],
    ["Horário de atendimento", settings.business_hours],
  ].filter(([, v]) => v);
  return (
    <>
      <PageHero eyebrow="Contato" title="Fale com a Gold Pharma" intro="Atendimento pelo WhatsApp ou pelo formulário. Responderemos pelo canal que você indicar." variant="recovery" imageAlt="Composição gráfica Gold Pharma" />
      <section className="container-gp grid gap-10 py-16 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-6">
          <div className="card-gp p-6 md:p-8">
            <h2 className="font-display text-3xl font-semibold">WhatsApp</h2>
            <p className="mt-3 text-sm leading-relaxed text-mist">
              A conversa abre com uma mensagem pronta, que você pode revisar antes de enviar. Nada é enviado automaticamente.
            </p>
            {whatsappHref ? (
              <WhatsAppButton href={whatsappHref} className="mt-6 w-full" />
            ) : (
              <p className="mt-6 rounded-lg border border-line bg-ink/60 p-4 text-sm text-mist">O atendimento por WhatsApp estará disponível em breve. Utilize o formulário ao lado.</p>
            )}
          </div>
          {items.length > 0 && (
            <dl className="card-gp space-y-5 p-6 md:p-8">
              {items.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[11px] uppercase tracking-[0.16em] text-gold">{k}</dt>
                  <dd className="mt-1 whitespace-pre-line text-white/85">{v}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
        <div>
          <h2 className="sr-only">Formulário de contato</h2>
          <ContactForm />
        </div>
      </section>
    </>
  );
}

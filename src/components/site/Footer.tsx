import Link from "next/link";
import { LogoMark } from "./Logo";
import { WhatsAppButton } from "./WhatsAppButton";

export function Footer({ settings, whatsappHref }: { settings: Record<string, string>; whatsappHref: string | null }) {
  const year = new Date().getFullYear();
  return (
    <footer className="relative mt-24 border-t border-line bg-[#070707]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
      <div className="container-gp grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <LogoMark className="h-11 w-11" />
            <div className="leading-none">
              <p className="font-display text-xl font-bold tracking-[0.22em]">GOLD</p>
              <p className="mt-0.5 text-[10px] font-semibold tracking-[0.55em] text-gold">PHARMA</p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-relaxed text-mist">{settings.mission}</p>
          <WhatsAppButton href={whatsappHref} variant="compact" className="mt-6" />
        </div>

        <div>
          <h2 className="eyebrow">Navegação</h2>
          <ul className="mt-5 space-y-3 text-sm text-mist">
            {[
              ["/catalogo", "Catálogo de produtos"],
              ["/tabela-de-valores", "Tabela de valores"],
              ["/saude", "Informações de saúde"],
              ["/sobre", "Sobre a Gold Pharma"],
              ["/contato", "Contato"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="transition hover:text-gold">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="eyebrow">Contato</h2>
          <ul className="mt-5 space-y-3 text-sm text-mist">
            {settings.contact_email && (
              <li>
                <a href={`mailto:${settings.contact_email}`} className="hover:text-gold">
                  {settings.contact_email}
                </a>
              </li>
            )}
            {settings.contact_phone && <li>{settings.contact_phone}</li>}
            {settings.address && <li className="whitespace-pre-line">{settings.address}</li>}
            {settings.business_hours && <li>{settings.business_hours}</li>}
            {!settings.contact_email && !settings.contact_phone && !settings.address && (
              <li>
                <Link href="/contato" className="hover:text-gold">
                  Fale conosco pela página de contato
                </Link>
              </li>
            )}
          </ul>
        </div>

        <div>
          <h2 className="eyebrow">Institucional</h2>
          <ul className="mt-5 space-y-3 text-sm text-mist">
            <li>
              <Link href="/privacidade" className="hover:text-gold">
                Política de privacidade
              </Link>
            </li>
            <li>
              <Link href="/termos" className="hover:text-gold">
                Termos de uso
              </Link>
            </li>
            <li>
              <Link href="/informacoes-legais" className="hover:text-gold">
                Informações legais
              </Link>
            </li>
          </ul>
          {(settings.company_legal_name || settings.cnpj || settings.technical_responsible) && (
            <div className="mt-6 space-y-1 text-xs text-mist-2">
              {settings.company_legal_name && <p>{settings.company_legal_name}</p>}
              {settings.cnpj && <p>CNPJ {settings.cnpj}</p>}
              {settings.technical_responsible && <p>Responsável técnico: {settings.technical_responsible}</p>}
            </div>
          )}
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-gp flex flex-col gap-3 py-6 text-xs text-mist-2 md:flex-row md:items-center md:justify-between">
          <p>© {year} Gold Pharma. Todos os direitos reservados.</p>
          <p className="max-w-2xl md:text-right">{settings.footer_disclaimer}</p>
        </div>
      </div>
    </footer>
  );
}

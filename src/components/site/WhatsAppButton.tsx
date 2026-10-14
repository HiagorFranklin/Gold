import Link from "next/link";
import { WhatsAppIcon } from "./icons";

type Props = {
  href: string | null;
  label?: string;
  variant?: "gold" | "outline" | "ghost" | "compact";
  className?: string;
};

/** Abre a conversa no WhatsApp; o cliente revisa e envia a mensagem manualmente. */
export function WhatsAppButton({ href, label = "Falar pelo WhatsApp", variant = "gold", className = "" }: Props) {
  const cls =
    variant === "compact"
      ? "inline-flex items-center gap-2 rounded-full border border-gold/40 px-4 py-2 text-xs font-semibold text-gold transition hover:border-gold hover:bg-gold/10"
      : variant === "outline"
        ? "btn-outline"
        : variant === "ghost"
          ? "btn-ghost"
          : "btn-gold";
  if (!href) {
    // Número ainda não configurado no painel: direciona para a página de contato.
    return (
      <Link href="/contato" className={`${cls} ${className}`}>
        <WhatsAppIcon />
        {label}
      </Link>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${cls} ${className}`}
      aria-label={`${label} (abre o WhatsApp em nova aba)`}
    >
      <WhatsAppIcon />
      {label}
    </a>
  );
}

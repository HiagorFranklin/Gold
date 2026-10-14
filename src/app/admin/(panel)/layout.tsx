import type { Metadata } from "next";
import Link from "next/link";
import { requireActor } from "@/lib/auth";
import { can, ROLE_LABELS } from "@/lib/permissions";
import { LogoMark } from "@/components/site/Logo";
import { AdminNav } from "@/components/admin/AdminNav";
import { logoutAction } from "../login/actions";

export const metadata: Metadata = { title: { default: "Painel", template: "%s | Painel Gold Pharma" }, robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireActor("panel:view");
  const items = [
    { href: "/admin", label: "Visão geral" },
    { href: "/admin/produtos", label: "Produtos" },
    { href: "/admin/consulta-regulatoria", label: "Consulta regulatória" },
    { href: "/admin/categorias", label: "Categorias" },
    { href: "/admin/saude", label: "Conteúdo de saúde" },
    ...(can(actor, "settings:edit") ? [{ href: "/admin/configuracoes", label: "Site e WhatsApp" }] : []),
    ...(can(actor, "messages:view") ? [{ href: "/admin/mensagens", label: "Mensagens" }] : []),
    ...(can(actor, "audit:view") ? [{ href: "/admin/auditoria", label: "Auditoria" }] : []),
    ...(can(actor, "users:manage") ? [{ href: "/admin/usuarios", label: "Usuários" }] : []),
    { href: "/admin/conta", label: "Minha conta" },
  ];
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="border-b border-line bg-[#070707] p-5 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex flex-wrap items-center justify-between gap-4 lg:block">
          <Link href="/admin" className="flex items-center gap-3">
            <LogoMark className="h-9 w-9" />
            <span className="leading-none">
              <span className="block font-display text-lg font-bold tracking-[0.2em]">GOLD</span>
              <span className="block text-[9px] font-semibold tracking-[0.5em] text-gold">PAINEL</span>
            </span>
          </Link>
          <div className="lg:mt-8">
            <AdminNav items={items} />
          </div>
        </div>
        <div className="mt-6 border-t border-line pt-5 text-xs text-mist lg:absolute lg:inset-x-5 lg:bottom-5">
          <p className="truncate text-white/80">{actor.email}</p>
          <p className="mt-0.5 text-mist-2">{ROLE_LABELS[actor.role]}</p>
          <div className="mt-3 flex gap-3">
            <Link href="/" className="hover:text-gold" target="_blank">
              Ver site ↗
            </Link>
            <form action={logoutAction}>
              <button className="hover:text-gold">Sair</button>
            </form>
          </div>
        </div>
      </aside>
      <main className="min-w-0 p-5 md:p-10">{children}</main>
    </div>
  );
}

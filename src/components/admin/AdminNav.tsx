"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export type NavItem = { href: string; label: string };

export function AdminNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="admin-menu"
        className="rounded-full border border-white/15 px-4 py-2 text-sm lg:hidden"
      >
        Menu
      </button>
      <nav id="admin-menu" aria-label="Painel" className={`${open ? "block" : "hidden"} w-full lg:block`}>
        <ul className="mt-4 space-y-1 lg:mt-0">
          {items.map((i) => (
            <li key={i.href}>
              <Link
                href={i.href}
                onClick={() => setOpen(false)}
                aria-current={active(i.href) ? "page" : undefined}
                className={`block rounded-lg px-3 py-2 text-sm transition ${
                  active(i.href) ? "bg-gold/10 text-gold" : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                {i.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}

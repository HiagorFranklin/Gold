import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getActor } from "@/lib/auth";
import { LogoMark } from "@/components/site/Logo";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Acesso administrativo", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getActor()) redirect("/admin");
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5">
      <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-gold/10 blur-3xl" />
      <div className="card-gp relative w-full max-w-md p-8 md:p-10">
        <div className="flex flex-col items-center text-center">
          <LogoMark className="h-14 w-14" />
          <h1 className="heading-display mt-5 text-3xl">Painel Gold Pharma</h1>
          <p className="mt-2 text-sm text-mist">Acesso restrito à equipe autorizada.</p>
        </div>
        <div className="mt-8">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useActionState } from "react";
import { sendContact, type ContactState } from "./actions";
import { submitWithoutReset } from "@/lib/submit";

export function ContactForm() {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendContact, null);
  if (state?.ok) {
    return (
      <div role="status" className="card-gp p-8 text-center">
        <p className="font-display text-3xl text-gold">Obrigado!</p>
        <p className="mt-3 text-mist">{state.message}</p>
      </div>
    );
  }
  return (
    <form onSubmit={(e) => submitWithoutReset(e, action)} className="card-gp space-y-5 p-6 md:p-8" noValidate>
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label htmlFor="name" className="label-gp">Nome</label>
          <input id="name" name="name" required autoComplete="name" className="input-gp" />
        </div>
        <div>
          <label htmlFor="contact" className="label-gp">E-mail ou telefone</label>
          <input id="contact" name="contact" required autoComplete="email" className="input-gp" />
        </div>
      </div>
      <div>
        <label htmlFor="subject" className="label-gp">Assunto</label>
        <input id="subject" name="subject" className="input-gp" />
      </div>
      <div>
        <label htmlFor="message" className="label-gp">Mensagem</label>
        <textarea id="message" name="message" required rows={5} className="input-gp" aria-describedby="msg-hint" />
        <p id="msg-hint" className="mt-2 text-xs text-mist-2">Não inclua informações médicas, exames ou dados de saúde.</p>
      </div>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <label className="flex items-start gap-3 text-sm text-mist">
        <input type="checkbox" name="consent" className="mt-1 accent-[#D4AF37]" />
        <span>
          Concordo com a <Link href="/privacidade" className="text-gold underline-offset-4 hover:underline">política de privacidade</Link>.
        </span>
      </label>
      {state && !state.ok && (
        <p role="alert" className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {state.message}
        </p>
      )}
      <button type="submit" className="btn-gold w-full md:w-auto" disabled={pending}>
        {pending ? "Enviando…" : "Enviar mensagem"}
      </button>
    </form>
  );
}

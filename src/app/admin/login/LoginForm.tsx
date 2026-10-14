"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, null);
  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="email" className="label-gp">E-mail</label>
        <input id="email" name="email" type="email" required autoComplete="username" defaultValue={state?.email} key={state?.email} className="input-gp" />
      </div>
      <div>
        <label htmlFor="password" className="label-gp">Senha</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="input-gp" />
      </div>
      {state?.error && (
        <p role="alert" className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {state.error}
        </p>
      )}
      <button className="btn-gold w-full" disabled={pending}>
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}

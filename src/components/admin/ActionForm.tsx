"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/admin/actions";
import { Notice } from "./ui";
import { submitWithoutReset } from "@/lib/submit";

type Props = {
  action: (state: FormState, fd: FormData) => Promise<FormState>;
  children: React.ReactNode;
  submitLabel?: string;
  className?: string;
  resetOnSuccess?: boolean;
};

export function ActionForm({ action, children, submitLabel = "Salvar", className = "" }: Props) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null);
  return (
    <form onSubmit={(e) => submitWithoutReset(e, formAction)} className={`space-y-4 ${className}`}>
      {state?.errors && (
        <Notice kind="error">
          <ul className="list-disc pl-5">
            {state.errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </Notice>
      )}
      {state?.ok && state.message && <Notice kind="success">{state.message}</Notice>}
      {children}
      <button className="btn-gold" disabled={pending}>
        {pending ? "Salvando…" : submitLabel}
      </button>
    </form>
  );
}

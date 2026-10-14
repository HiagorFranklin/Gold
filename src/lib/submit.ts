import { startTransition, type FormEvent } from "react";

/**
 * Envia o formulário para a server action sem o reset automático do React 19,
 * preservando o que o usuário digitou quando o servidor devolve um erro.
 */
export function submitWithoutReset(e: FormEvent<HTMLFormElement>, action: (fd: FormData) => void) {
  e.preventDefault();
  const fd = new FormData(e.currentTarget);
  startTransition(() => action(fd));
}

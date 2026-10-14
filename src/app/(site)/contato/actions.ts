"use server";

import { z } from "zod";
import { getDb } from "@/lib/db";

const schema = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(120),
  contact: z.string().trim().min(5, "Informe um e-mail ou telefone.").max(160),
  subject: z.string().trim().max(160).default(""),
  message: z.string().trim().min(10, "Escreva uma mensagem um pouco maior.").max(3000),
  consent: z.literal("on", { error: "É necessário concordar com a política de privacidade." }),
  website: z.string().max(0).optional(), // armadilha anti-spam
});

export type ContactState = { ok: boolean; message: string } | null;

export async function sendContact(_: ContactState, formData: FormData): Promise<ContactState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const d = parsed.data;
  getDb()
    .prepare("INSERT INTO contact_messages (name, contact, subject, message) VALUES (?, ?, ?, ?)")
    .run(d.name, d.contact, d.subject, d.message);
  return { ok: true, message: "Mensagem enviada. Retornaremos pelo contato informado." };
}

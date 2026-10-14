"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getActor, hashPassword, requireActor, verifyPassword } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getAdminProduct, getSettings, logAudit, type ProductRow } from "@/lib/data";
import { parseBRL, slugify, sourcesFromText } from "@/lib/format";
import { can, ROLES } from "@/lib/permissions";
import { saveProduct, type ProductInput } from "@/lib/product-service";
import { saveImageUpload } from "@/lib/uploads";
import { DEFAULT_SETTINGS } from "@/lib/seed";

export type FormState = { ok?: boolean; errors?: string[]; message?: string } | null;

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "");
const bool = (fd: FormData, k: string) => fd.get(k) === "on";
const optId = (fd: FormData, k: string) => {
  const v = str(fd, k);
  return v ? Number(v) : null;
};

function refreshPublic() {
  revalidatePath("/", "layout");
}

// ---------------- Produtos ----------------

export async function saveProductAction(_: FormState, fd: FormData): Promise<FormState> {
  const actor = await getActor();
  if (!actor) redirect("/admin/login");
  const id = str(fd, "id") || undefined;
  const existing = id ? getAdminProduct(id) : null;

  const price = parseBRL(str(fd, "price"));
  if (Number.isNaN(price)) return { errors: ["Valor inválido. Use o formato 165,00."] };

  const upload = await saveImageUpload(fd.get("image_file") as File | null);
  if (upload.error) return { errors: [upload.error] };
  let imageUrl = upload.url ?? str(fd, "image_url");
  if (bool(fd, "remove_image")) imageUrl = "";

  let input: ProductInput = {
    name: str(fd, "name"),
    active_ingredient: str(fd, "active_ingredient"),
    manufacturer: str(fd, "manufacturer"),
    presentation: str(fd, "presentation"),
    description: str(fd, "description"),
    image_url: imageUrl,
    image_alt: str(fd, "image_alt"),
    image_is_illustrative: bool(fd, "image_is_illustrative"),
    category_id: optId(fd, "category_id"),
    health_topic_id: optId(fd, "health_topic_id"),
    price_cents: price,
    availability: str(fd, "availability") as ProductInput["availability"],
    regulatory_status: str(fd, "regulatory_status") as ProductInput["regulatory_status"],
    regulatory_justification: str(fd, "regulatory_justification"),
    regulatory_source: str(fd, "regulatory_source"),
    regulatory_checked_at: str(fd, "regulatory_checked_at"),
    regulatory_reviewer: str(fd, "regulatory_reviewer"),
    anvisa_registration: str(fd, "anvisa_registration"),
    reference_sources: JSON.stringify(sourcesFromText(str(fd, "reference_sources"))),
    info_reviewed_at: str(fd, "info_reviewed_at"),
    publish_info: bool(fd, "publish_info"),
    show_price: bool(fd, "show_price"),
    commercially_available: bool(fd, "commercially_available"),
    whatsapp_orders: bool(fd, "whatsapp_orders"),
    featured: bool(fd, "featured"),
  };

  // Campos protegidos: quem não tem permissão não os envia; preservamos o valor gravado.
  const keep = (p: ProductRow) => ({
    regulatory_status: p.regulatory_status,
    regulatory_justification: p.regulatory_justification,
    regulatory_source: p.regulatory_source,
    regulatory_checked_at: p.regulatory_checked_at ?? "",
    regulatory_reviewer: p.regulatory_reviewer,
    anvisa_registration: p.anvisa_registration,
    publish_info: !!p.publish_info,
    show_price: !!p.show_price,
    commercially_available: !!p.commercially_available,
    whatsapp_orders: !!p.whatsapp_orders,
  });
  if (existing && !can(actor, "products:price")) input = { ...input, price_cents: existing.price_cents };
  if (existing && !can(actor, "products:regulatory")) input = { ...input, ...keep(existing) };
  if (!existing && !can(actor, "products:regulatory")) {
    input = {
      ...input,
      regulatory_status: "pendente_verificacao",
      publish_info: false,
      show_price: false,
      commercially_available: false,
      whatsapp_orders: false,
    };
  }
  if (!existing && !can(actor, "products:price")) input = { ...input, price_cents: null };

  const res = saveProduct(actor, input, id);
  if (!res.ok) return { errors: res.errors };
  refreshPublic();
  redirect(`/admin/produtos/${res.id}?salvo=1`);
}

// ---------------- Categorias ----------------

const categorySchema = z.object({
  name: z.string().trim().min(2, "Informe o nome").max(100),
  description: z.string().trim().max(400),
  sort_order: z.coerce.number().int().min(0).max(999),
});

export async function saveCategoryAction(_: FormState, fd: FormData): Promise<FormState> {
  const actor = await requireActor("categories:edit");
  const parsed = categorySchema.safeParse({
    name: str(fd, "name"),
    description: str(fd, "description"),
    sort_order: str(fd, "sort_order") || "0",
  });
  if (!parsed.success) return { errors: parsed.error.issues.map((i) => i.message) };
  const upload = await saveImageUpload(fd.get("image_file") as File | null);
  if (upload.error) return { errors: [upload.error] };
  const db = getDb();
  const id = Number(str(fd, "id")) || null;
  const d = parsed.data;
  if (id) {
    const current = db.prepare("SELECT image_url FROM categories WHERE id = ?").get(id) as { image_url: string | null } | undefined;
    if (!current) return { errors: ["Categoria não encontrada."] };
    const image = bool(fd, "remove_image") ? null : upload.url ?? current.image_url;
    db.prepare("UPDATE categories SET name = ?, description = ?, sort_order = ?, image_url = ? WHERE id = ?").run(
      d.name,
      d.description,
      d.sort_order,
      image,
      id,
    );
    logAudit({ admin_id: actor.id, admin_email: actor.email, action: "update", entity: "category", entity_id: String(id), details: d });
  } else {
    let slug = slugify(d.name) || "categoria";
    while (db.prepare("SELECT 1 FROM categories WHERE slug = ?").get(slug)) slug += "-2";
    const r = db
      .prepare("INSERT INTO categories (slug, name, description, sort_order, image_url) VALUES (?, ?, ?, ?, ?)")
      .run(slug, d.name, d.description, d.sort_order, upload.url ?? null);
    logAudit({ admin_id: actor.id, admin_email: actor.email, action: "create", entity: "category", entity_id: String(r.lastInsertRowid), details: d });
  }
  refreshPublic();
  revalidatePath("/admin/categorias");
  return { ok: true, message: "Categoria salva." };
}

export async function deleteCategoryAction(fd: FormData) {
  const actor = await requireActor("categories:edit");
  const id = Number(str(fd, "id"));
  const db = getDb();
  const used = (db.prepare("SELECT COUNT(*) n FROM products WHERE category_id = ?").get(id) as { n: number }).n;
  if (used > 0) redirect("/admin/categorias?erro=em-uso");
  db.prepare("DELETE FROM categories WHERE id = ?").run(id);
  logAudit({ admin_id: actor.id, admin_email: actor.email, action: "delete", entity: "category", entity_id: String(id) });
  refreshPublic();
  redirect("/admin/categorias");
}

// ---------------- Conteúdo de saúde ----------------

const topicSchema = z.object({
  title: z.string().trim().min(2).max(200),
  active_ingredients: z.string().trim().max(300),
  summary: z.string().trim().max(2000),
  medical_indications: z.string().trim().max(4000),
  therapeutic_benefits: z.string().trim().max(4000),
  aesthetic_note: z.string().trim().max(4000),
  adverse_effects: z.string().trim().max(4000),
  serious_risks: z.string().trim().max(4000),
  contraindications: z.string().trim().max(4000),
  precautions: z.string().trim().max(4000),
  interactions: z.string().trim().max(4000),
  review_status: z.enum(["preliminar", "revisado"]),
  reviewed_at: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Data de revisão inválida"),
  reviewed_by: z.string().trim().max(160),
});

// Termos que indicam orientação de uso (proibida no conteúdo educativo).
const FORBIDDEN_GUIDANCE = /\b(\d+\s?(mg|ml|ui)\s*(\/|por)\s*(dia|semana))|\bciclo de\b|\bprotocolo de\b|\bdose (recomendada|ideal)\b/i;

export async function saveTopicAction(_: FormState, fd: FormData): Promise<FormState> {
  const actor = await requireActor("health:edit");
  const parsed = topicSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) };
  const d = parsed.data;
  const errors: string[] = [];
  const allText = Object.values(d).join(" ");
  if (FORBIDDEN_GUIDANCE.test(allText))
    errors.push("O conteúdo não pode conter dosagens, ciclos ou protocolos de uso.");
  if (d.review_status === "revisado" && (!d.reviewed_at || !d.reviewed_by))
    errors.push("Para marcar como revisado, informe a data e o responsável pela revisão.");
  const sources = sourcesFromText(str(fd, "sources"));
  if (d.review_status === "revisado" && sources.length === 0) errors.push("Informe ao menos uma fonte consultada.");
  const wantsPublish = bool(fd, "published");
  if (!can(actor, "health:publish") && wantsPublish !== (str(fd, "was_published") === "1"))
    errors.push("Apenas administradores podem publicar ou despublicar conteúdo.");
  if (errors.length) return { errors };

  const upload = await saveImageUpload(fd.get("image_file") as File | null);
  if (upload.error) return { errors: [upload.error] };

  const db = getDb();
  const id = Number(str(fd, "id")) || null;
  const row = { ...d, reviewed_at: d.reviewed_at || null, sources: JSON.stringify(sources), published: wantsPublish ? 1 : 0 };
  if (id) {
    const current = db.prepare("SELECT image_url FROM health_topics WHERE id = ?").get(id) as { image_url: string | null } | undefined;
    if (!current) return { errors: ["Conteúdo não encontrado."] };
    const image = bool(fd, "remove_image") ? null : upload.url ?? current.image_url;
    db.prepare(
      `UPDATE health_topics SET title=@title, active_ingredients=@active_ingredients, summary=@summary, medical_indications=@medical_indications,
       therapeutic_benefits=@therapeutic_benefits, aesthetic_note=@aesthetic_note, adverse_effects=@adverse_effects, serious_risks=@serious_risks,
       contraindications=@contraindications, precautions=@precautions, interactions=@interactions, sources=@sources, review_status=@review_status,
       reviewed_at=@reviewed_at, reviewed_by=@reviewed_by, published=@published, image_url=@image, updated_at=datetime('now') WHERE id=@id`,
    ).run({ ...row, image, id });
    logAudit({ admin_id: actor.id, admin_email: actor.email, action: "update", entity: "health_topic", entity_id: String(id), details: { title: d.title, published: row.published, review_status: d.review_status } });
    refreshPublic();
    redirect(`/admin/saude/${id}?salvo=1`);
  }
  let slug = slugify(d.title) || "conteudo";
  while (db.prepare("SELECT 1 FROM health_topics WHERE slug = ?").get(slug)) slug += "-2";
  const r = db
    .prepare(
      `INSERT INTO health_topics (slug, title, active_ingredients, summary, medical_indications, therapeutic_benefits, aesthetic_note,
       adverse_effects, serious_risks, contraindications, precautions, interactions, sources, review_status, reviewed_at, reviewed_by, published, image_url)
       VALUES (@slug, @title, @active_ingredients, @summary, @medical_indications, @therapeutic_benefits, @aesthetic_note, @adverse_effects,
       @serious_risks, @contraindications, @precautions, @interactions, @sources, @review_status, @reviewed_at, @reviewed_by, @published, @image)`,
    )
    .run({ ...row, slug, image: upload.url ?? null });
  logAudit({ admin_id: actor.id, admin_email: actor.email, action: "create", entity: "health_topic", entity_id: String(r.lastInsertRowid), details: { title: d.title } });
  refreshPublic();
  redirect(`/admin/saude/${r.lastInsertRowid}?salvo=1`);
}

// ---------------- Configurações do site ----------------

const IMAGE_KEYS = ["hero", "training", "recovery", "nutrition", "science", "about"] as const;

export async function saveSettingsAction(_: FormState, fd: FormData): Promise<FormState> {
  const actor = await requireActor("settings:edit");
  const current = getSettings();
  const updates: Record<string, string> = {};
  const errors: string[] = [];

  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    if (key.endsWith("_image_url")) continue;
    if (fd.has(key)) updates[key] = str(fd, key).trim().slice(0, 20000);
  }
  if ("whatsapp_number" in updates) {
    const digits = updates.whatsapp_number.replace(/\D/g, "");
    if (digits && (digits.length < 10 || digits.length > 13)) errors.push("Número de WhatsApp inválido. Use DDD + número, ex.: 11 98765-4321.");
    updates.whatsapp_number = digits;
  }
  if ("contact_email" in updates && updates.contact_email && !z.email().safeParse(updates.contact_email).success)
    errors.push("E-mail de contato inválido.");

  for (const k of IMAGE_KEYS) {
    const field = `${k}_image_url`;
    const upload = await saveImageUpload(fd.get(`${k}_image_file`) as File | null);
    if (upload.error) errors.push(`${k}: ${upload.error}`);
    else if (upload.url) updates[field] = upload.url;
    else if (bool(fd, `${k}_remove`)) updates[field] = "";
    else if (fd.has(field)) {
      const url = str(fd, field).trim();
      if (url && !url.startsWith("/uploads/") && !/^https:\/\//i.test(url)) errors.push(`Imagem ${k}: use uma URL https.`);
      else updates[field] = url;
    }
  }
  if (errors.length) return { errors };

  const db = getDb();
  const up = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value");
  const changed: string[] = [];
  db.transaction(() => {
    for (const [k, v] of Object.entries(updates)) {
      if (current[k] !== v) {
        up.run(k, v);
        changed.push(k);
      }
    }
  })();
  if (changed.length) logAudit({ admin_id: actor.id, admin_email: actor.email, action: "update", entity: "settings", details: { keys: changed } });
  refreshPublic();
  return { ok: true, message: changed.length ? "Configurações salvas." : "Nenhuma alteração." };
}

// ---------------- Mensagens ----------------

export async function toggleMessageAction(fd: FormData) {
  await requireActor("messages:view");
  getDb().prepare("UPDATE contact_messages SET handled = 1 - handled WHERE id = ?").run(Number(str(fd, "id")));
  revalidatePath("/admin/mensagens");
}

// ---------------- Usuários e conta ----------------

const userSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome").max(120),
  email: z.email("E-mail inválido").transform((v) => v.toLowerCase()),
  role: z.enum(ROLES),
  password: z.string().min(10, "A senha deve ter ao menos 10 caracteres.").max(200),
});

export async function createUserAction(_: FormState, fd: FormData): Promise<FormState> {
  const actor = await requireActor("users:manage");
  const parsed = userSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: parsed.error.issues.map((i) => i.message) };
  const d = parsed.data;
  const db = getDb();
  if (db.prepare("SELECT 1 FROM admins WHERE email = ?").get(d.email)) return { errors: ["Já existe um usuário com este e-mail."] };
  const r = db.prepare("INSERT INTO admins (email, name, password_hash, role) VALUES (?, ?, ?, ?)").run(d.email, d.name, hashPassword(d.password), d.role);
  logAudit({ admin_id: actor.id, admin_email: actor.email, action: "create", entity: "admin", entity_id: String(r.lastInsertRowid), details: { email: d.email, role: d.role } });
  revalidatePath("/admin/usuarios");
  return { ok: true, message: "Usuário criado." };
}

export async function updateUserAction(fd: FormData) {
  const actor = await requireActor("users:manage");
  const id = Number(str(fd, "id"));
  const role = z.enum(ROLES).safeParse(str(fd, "role"));
  const active = bool(fd, "active") ? 1 : 0;
  if (!role.success || id === actor.id) redirect("/admin/usuarios?erro=1");
  const db = getDb();
  db.prepare("UPDATE admins SET role = ?, active = ? WHERE id = ?").run(role.data, active, id);
  if (!active) db.prepare("DELETE FROM sessions WHERE admin_id = ?").run(id);
  logAudit({ admin_id: actor.id, admin_email: actor.email, action: "update", entity: "admin", entity_id: String(id), details: { role: role.data, active } });
  revalidatePath("/admin/usuarios");
}

export async function changePasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  const actor = await requireActor();
  const current = str(fd, "current");
  const next = str(fd, "next");
  if (next.length < 10) return { errors: ["A nova senha deve ter ao menos 10 caracteres."] };
  if (next !== str(fd, "confirm")) return { errors: ["A confirmação não confere."] };
  const db = getDb();
  const row = db.prepare("SELECT password_hash FROM admins WHERE id = ?").get(actor.id) as { password_hash: string };
  if (!verifyPassword(current, row.password_hash)) return { errors: ["Senha atual incorreta."] };
  db.prepare("UPDATE admins SET password_hash = ? WHERE id = ?").run(hashPassword(next), actor.id);
  logAudit({ admin_id: actor.id, admin_email: actor.email, action: "password_change", entity: "admin", entity_id: String(actor.id) });
  return { ok: true, message: "Senha alterada." };
}

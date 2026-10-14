import type Database from "better-sqlite3";
import crypto from "node:crypto";
import { z } from "zod";
import { REGULATORY_STATUSES, validateRegulatoryWrite, matchHardRules } from "./compliance";
import { getDb } from "./db";
import { logAudit, type ProductRow } from "./data";
import { slugify } from "./format";
import { can, type Actor } from "./permissions";

const optionalDate = z
  .string()
  .trim()
  .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Data inválida (use AAAA-MM-DD)")
  .transform((v) => (v === "" ? null : v));

export const productSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome comercial").max(160),
  active_ingredient: z.string().trim().max(200).default(""),
  manufacturer: z.string().trim().max(160).default(""),
  presentation: z.string().trim().max(120).default(""),
  description: z.string().trim().max(5000).default(""),
  image_url: z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === "" || v.startsWith("/uploads/") || /^https:\/\//i.test(v), "Use uma URL https ou envie um arquivo")
    .transform((v) => (v === "" ? null : v)),
  image_alt: z.string().trim().max(200).default(""),
  image_is_illustrative: z.boolean(),
  category_id: z.coerce.number().int().positive().nullable(),
  health_topic_id: z.coerce.number().int().positive().nullable(),
  price_cents: z.number().int().nonnegative().nullable(),
  availability: z.enum(["disponivel", "sob_consulta", "indisponivel"]),
  regulatory_status: z.enum(REGULATORY_STATUSES),
  regulatory_justification: z.string().trim().max(5000).default(""),
  regulatory_source: z.string().trim().max(2000).default(""),
  regulatory_checked_at: optionalDate,
  regulatory_reviewer: z.string().trim().max(160).default(""),
  anvisa_registration: z.string().trim().max(60).default(""),
  reference_sources: z.string().default("[]"),
  info_reviewed_at: optionalDate,
  publish_info: z.boolean(),
  show_price: z.boolean(),
  commercially_available: z.boolean(),
  whatsapp_orders: z.boolean(),
  featured: z.boolean(),
});

export type ProductInput = z.input<typeof productSchema>;

const PRICE_FIELDS = ["price_cents"] as const;
const REGULATORY_FIELDS = [
  "regulatory_status",
  "regulatory_justification",
  "regulatory_source",
  "regulatory_checked_at",
  "regulatory_reviewer",
  "anvisa_registration",
  "publish_info",
  "show_price",
  "commercially_available",
  "whatsapp_orders",
] as const;

export type SaveResult = { ok: true; id: string; slug: string } | { ok: false; errors: string[] };

function boolInt(v: boolean) {
  return v ? 1 : 0;
}

function uniqueSlug(db: Database.Database, base: string, excludeId?: string) {
  let slug = base || "produto";
  let i = 2;
  while (
    db.prepare("SELECT 1 FROM products WHERE slug = ? AND id IS NOT ?").get(slug, excludeId ?? null)
  ) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

/**
 * Cria ou atualiza um produto, aplicando validação, permissões e as regras
 * sanitárias no servidor. Nada é removido automaticamente.
 */
export function saveProduct(
  actor: Actor,
  input: ProductInput,
  id?: string,
  db: Database.Database = getDb(),
): SaveResult {
  if (!can(actor, "products:edit")) return { ok: false, errors: ["Sem permissão para editar produtos."] };

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: parsed.error.issues.map((i) => i.message) };
  const data = parsed.data;

  const existing = id
    ? (db.prepare("SELECT * FROM products WHERE id = ?").get(id) as ProductRow | undefined)
    : undefined;
  if (id && !existing) return { ok: false, errors: ["Produto não encontrado."] };

  // Permissões por grupo de campos
  const errors: string[] = [];
  const changed = (field: keyof typeof data) => {
    const before = existing ? (existing as unknown as Record<string, unknown>)[field] : undefined;
    const after = data[field];
    const norm = (v: unknown) => (typeof v === "boolean" ? (v ? 1 : 0) : v ?? null);
    return existing ? norm(before) !== norm(after) : after !== null && after !== false && after !== "";
  };
  if (!can(actor, "products:price") && PRICE_FIELDS.some((f) => changed(f))) {
    errors.push("Apenas administradores podem alterar valores.");
  }
  if (!can(actor, "products:regulatory") && REGULATORY_FIELDS.some((f) => changed(f))) {
    errors.push("Apenas administradores podem alterar a situação regulatória e os controles de publicação.");
  }

  // Regras sanitárias — não podem ser contornadas por troca manual de status.
  const complianceInput = {
    ...data,
    regulatory_checked_at: data.regulatory_checked_at,
  };
  errors.push(...validateRegulatoryWrite(complianceInput));
  if (data.regulatory_status === "comercializacao_bloqueada" && !data.regulatory_justification) {
    errors.push("Informe a justificativa do bloqueio.");
  }
  if (errors.length) return { ok: false, errors };

  const row = {
    ...data,
    image_is_illustrative: boolInt(data.image_is_illustrative),
    publish_info: boolInt(data.publish_info),
    show_price: boolInt(data.show_price),
    commercially_available: boolInt(data.commercially_available),
    whatsapp_orders: boolInt(data.whatsapp_orders),
    featured: boolInt(data.featured),
  };

  if (!existing) {
    const newId = crypto.randomUUID();
    const slug = uniqueSlug(db, slugify(`${data.name} ${data.presentation}`));
    db.prepare(
      `INSERT INTO products (id, slug, name, active_ingredient, manufacturer, presentation, description, image_url, image_alt,
        image_is_illustrative, category_id, health_topic_id, price_cents, availability, regulatory_status, regulatory_justification,
        regulatory_source, regulatory_checked_at, regulatory_reviewer, anvisa_registration, reference_sources, info_reviewed_at,
        publish_info, show_price, commercially_available, whatsapp_orders, featured)
       VALUES (@id, @slug, @name, @active_ingredient, @manufacturer, @presentation, @description, @image_url, @image_alt,
        @image_is_illustrative, @category_id, @health_topic_id, @price_cents, @availability, @regulatory_status, @regulatory_justification,
        @regulatory_source, @regulatory_checked_at, @regulatory_reviewer, @anvisa_registration, @reference_sources, @info_reviewed_at,
        @publish_info, @show_price, @commercially_available, @whatsapp_orders, @featured)`,
    ).run({ ...row, id: newId, slug });
    logAudit(
      {
        admin_id: actor.id,
        admin_email: actor.email,
        action: "create",
        entity: "product",
        entity_id: newId,
        details: { name: data.name, price_cents: data.price_cents, regulatory_status: data.regulatory_status, hard_rules: matchHardRules(data).map((r) => r.id) },
      },
      db,
    );
    return { ok: true, id: newId, slug };
  }

  const diff: Record<string, { de: unknown; para: unknown }> = {};
  for (const key of Object.keys(row) as (keyof typeof row)[]) {
    const before = (existing as unknown as Record<string, unknown>)[key] ?? null;
    const after = row[key] ?? null;
    if (before !== after) diff[key] = { de: before, para: after };
  }
  db.prepare(
    `UPDATE products SET name=@name, active_ingredient=@active_ingredient, manufacturer=@manufacturer, presentation=@presentation,
      description=@description, image_url=@image_url, image_alt=@image_alt, image_is_illustrative=@image_is_illustrative,
      category_id=@category_id, health_topic_id=@health_topic_id, price_cents=@price_cents, availability=@availability,
      regulatory_status=@regulatory_status, regulatory_justification=@regulatory_justification, regulatory_source=@regulatory_source,
      regulatory_checked_at=@regulatory_checked_at, regulatory_reviewer=@regulatory_reviewer, anvisa_registration=@anvisa_registration,
      reference_sources=@reference_sources, info_reviewed_at=@info_reviewed_at, publish_info=@publish_info, show_price=@show_price,
      commercially_available=@commercially_available, whatsapp_orders=@whatsapp_orders, featured=@featured, updated_at=datetime('now')
     WHERE id=@id`,
  ).run({ ...row, id: existing.id });

  if (Object.keys(diff).length) {
    const important = Object.keys(diff).some((k) =>
      ["price_cents", ...REGULATORY_FIELDS, "name", "presentation"].includes(k),
    );
    logAudit(
      {
        admin_id: actor.id,
        admin_email: actor.email,
        action: important ? "update_important" : "update",
        entity: "product",
        entity_id: existing.id,
        details: { name: data.name, changes: diff },
      },
      db,
    );
  }
  return { ok: true, id: existing.id, slug: existing.slug };
}

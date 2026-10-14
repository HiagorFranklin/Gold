import type Database from "better-sqlite3";
import { getDb } from "./db";
import { evaluateCompliance, type ComplianceResult, type RegulatoryStatus } from "./compliance";

export type Category = {
  id: number;
  slug: string;
  name: string;
  description: string;
  image_url: string | null;
  sort_order: number;
};

export type HealthTopic = {
  id: number;
  slug: string;
  title: string;
  active_ingredients: string;
  summary: string;
  medical_indications: string;
  therapeutic_benefits: string;
  aesthetic_note: string;
  adverse_effects: string;
  serious_risks: string;
  contraindications: string;
  precautions: string;
  interactions: string;
  sources: string;
  review_status: "preliminar" | "revisado";
  reviewed_at: string | null;
  reviewed_by: string | null;
  published: number;
  image_url: string | null;
  updated_at: string;
};

export type ProductRow = {
  id: string;
  slug: string;
  name: string;
  active_ingredient: string;
  manufacturer: string;
  presentation: string;
  description: string;
  image_url: string | null;
  image_alt: string;
  image_is_illustrative: number;
  category_id: number | null;
  health_topic_id: number | null;
  price_cents: number | null;
  availability: "disponivel" | "sob_consulta" | "indisponivel";
  regulatory_status: RegulatoryStatus;
  regulatory_justification: string;
  regulatory_source: string;
  regulatory_checked_at: string | null;
  regulatory_reviewer: string;
  anvisa_registration: string;
  reference_sources: string;
  info_reviewed_at: string | null;
  publish_info: number;
  show_price: number;
  commercially_available: number;
  whatsapp_orders: number;
  featured: number;
  created_at: string;
  updated_at: string;
  category_name?: string | null;
  category_slug?: string | null;
};

export type ProductWithCompliance = ProductRow & { compliance: ComplianceResult };

/** Versão segura para o público: campos comerciais só existem quando liberados. */
export type PublicProduct = {
  id: string;
  slug: string;
  name: string;
  active_ingredient: string;
  manufacturer: string;
  presentation: string;
  description: string;
  image_url: string | null;
  image_alt: string;
  image_is_illustrative: boolean;
  category_name: string | null;
  category_slug: string | null;
  health_topic_id: number | null;
  price_cents: number | null;
  availability: "disponivel" | "sob_consulta" | "indisponivel" | null;
  whatsapp_order: boolean;
  regulatory_label: string;
  anvisa_registration: string | null;
  regulatory_checked_at: string | null;
  reference_sources: string;
  info_reviewed_at: string | null;
  featured: boolean;
};

const PRODUCT_SELECT = `SELECT p.*, c.name AS category_name, c.slug AS category_slug
  FROM products p LEFT JOIN categories c ON c.id = p.category_id`;

export function withCompliance(p: ProductRow): ProductWithCompliance {
  return {
    ...p,
    compliance: evaluateCompliance({
      name: p.name,
      active_ingredient: p.active_ingredient,
      manufacturer: p.manufacturer,
      category_slug: p.category_slug,
      regulatory_status: p.regulatory_status,
      regulatory_source: p.regulatory_source,
      regulatory_checked_at: p.regulatory_checked_at,
      anvisa_registration: p.anvisa_registration,
      publish_info: !!p.publish_info,
      show_price: !!p.show_price,
      commercially_available: !!p.commercially_available,
      whatsapp_orders: !!p.whatsapp_orders,
      price_cents: p.price_cents,
    }),
  };
}

export function toPublic(p: ProductWithCompliance): PublicProduct | null {
  const e = p.compliance.effective;
  if (!e.publicListing) return null;
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    active_ingredient: p.active_ingredient,
    manufacturer: p.manufacturer,
    presentation: p.presentation,
    description: p.description,
    image_url: p.image_url,
    image_alt: p.image_alt || p.name,
    image_is_illustrative: !!p.image_is_illustrative,
    category_name: p.category_name ?? null,
    category_slug: p.category_slug ?? null,
    health_topic_id: p.health_topic_id,
    price_cents: e.price ? p.price_cents : null,
    availability: e.availability ? p.availability : null,
    whatsapp_order: e.whatsappOrder,
    regulatory_label:
      p.regulatory_status === "regularidade_confirmada" ? "Regularidade verificada" : "Divulgação restrita",
    anvisa_registration: p.regulatory_status === "regularidade_confirmada" ? p.anvisa_registration : null,
    regulatory_checked_at: p.regulatory_checked_at,
    reference_sources: p.reference_sources,
    info_reviewed_at: p.info_reviewed_at,
    featured: !!p.featured,
  };
}

// ---------- Leitura pública ----------

export function listPublicProducts(db: Database.Database = getDb()): PublicProduct[] {
  const rows = db.prepare(`${PRODUCT_SELECT} ORDER BY p.name COLLATE NOCASE`).all() as ProductRow[];
  return rows.map(withCompliance).map(toPublic).filter((p): p is PublicProduct => p !== null);
}

export function getPublicProduct(slug: string, db: Database.Database = getDb()): PublicProduct | null {
  const row = db.prepare(`${PRODUCT_SELECT} WHERE p.slug = ?`).get(slug) as ProductRow | undefined;
  if (!row) return null;
  return toPublic(withCompliance(row));
}

export function listCategories(db: Database.Database = getDb()): Category[] {
  return db.prepare("SELECT * FROM categories ORDER BY sort_order, name").all() as Category[];
}

export function listPublishedTopics(db: Database.Database = getDb()): HealthTopic[] {
  return db.prepare("SELECT * FROM health_topics WHERE published = 1 ORDER BY title").all() as HealthTopic[];
}

export function getPublishedTopic(slug: string, db: Database.Database = getDb()): HealthTopic | null {
  return (db.prepare("SELECT * FROM health_topics WHERE slug = ? AND published = 1").get(slug) as HealthTopic) ?? null;
}

export function getPublishedTopicById(id: number | null, db: Database.Database = getDb()): HealthTopic | null {
  if (!id) return null;
  return (db.prepare("SELECT * FROM health_topics WHERE id = ? AND published = 1").get(id) as HealthTopic) ?? null;
}

export function getSettings(db: Database.Database = getDb()): Record<string, string> {
  const rows = db.prepare("SELECT key, value FROM settings").all() as { key: string; value: string }[];
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

// ---------- Leitura administrativa ----------

export function listAdminProducts(db: Database.Database = getDb()): ProductWithCompliance[] {
  const rows = db.prepare(`${PRODUCT_SELECT} ORDER BY p.name COLLATE NOCASE, p.presentation`).all() as ProductRow[];
  return rows.map(withCompliance);
}

export function getAdminProduct(id: string, db: Database.Database = getDb()): ProductWithCompliance | null {
  const row = db.prepare(`${PRODUCT_SELECT} WHERE p.id = ?`).get(id) as ProductRow | undefined;
  return row ? withCompliance(row) : null;
}

export function listAllTopics(db: Database.Database = getDb()): HealthTopic[] {
  return db.prepare("SELECT * FROM health_topics ORDER BY title").all() as HealthTopic[];
}

export function getTopic(id: number, db: Database.Database = getDb()): HealthTopic | null {
  return (db.prepare("SELECT * FROM health_topics WHERE id = ?").get(id) as HealthTopic) ?? null;
}

export type AuditEntry = {
  id: number;
  admin_email: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  details: string;
  created_at: string;
};

export function listAudit(limit = 200, db: Database.Database = getDb()): AuditEntry[] {
  return db.prepare("SELECT * FROM audit_log ORDER BY id DESC LIMIT ?").all(limit) as AuditEntry[];
}

export function logAudit(
  entry: { admin_id?: number | null; admin_email?: string | null; action: string; entity: string; entity_id?: string | null; details?: unknown },
  db: Database.Database = getDb(),
) {
  db.prepare(
    "INSERT INTO audit_log (admin_id, admin_email, action, entity, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)",
  ).run(
    entry.admin_id ?? null,
    entry.admin_email ?? null,
    entry.action,
    entry.entity,
    entry.entity_id ?? null,
    JSON.stringify(entry.details ?? {}),
  );
}

export type ContactMessage = {
  id: number;
  name: string;
  contact: string;
  subject: string;
  message: string;
  handled: number;
  created_at: string;
};

export function listMessages(db: Database.Database = getDb()): ContactMessage[] {
  return db.prepare("SELECT * FROM contact_messages ORDER BY id DESC LIMIT 500").all() as ContactMessage[];
}

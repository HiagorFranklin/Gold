import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { runSeed } from "./seed";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS health_topics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  active_ingredients TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  medical_indications TEXT NOT NULL DEFAULT '',
  therapeutic_benefits TEXT NOT NULL DEFAULT '',
  aesthetic_note TEXT NOT NULL DEFAULT '',
  adverse_effects TEXT NOT NULL DEFAULT '',
  serious_risks TEXT NOT NULL DEFAULT '',
  contraindications TEXT NOT NULL DEFAULT '',
  precautions TEXT NOT NULL DEFAULT '',
  interactions TEXT NOT NULL DEFAULT '',
  sources TEXT NOT NULL DEFAULT '[]',
  review_status TEXT NOT NULL DEFAULT 'preliminar',
  reviewed_at TEXT,
  reviewed_by TEXT,
  published INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  active_ingredient TEXT NOT NULL DEFAULT '',
  manufacturer TEXT NOT NULL DEFAULT '',
  presentation TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  image_alt TEXT NOT NULL DEFAULT '',
  image_is_illustrative INTEGER NOT NULL DEFAULT 1,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  health_topic_id INTEGER REFERENCES health_topics(id) ON DELETE SET NULL,
  price_cents INTEGER,
  availability TEXT NOT NULL DEFAULT 'indisponivel',
  regulatory_status TEXT NOT NULL DEFAULT 'pendente_verificacao',
  regulatory_justification TEXT NOT NULL DEFAULT '',
  regulatory_source TEXT NOT NULL DEFAULT '',
  regulatory_checked_at TEXT,
  regulatory_reviewer TEXT NOT NULL DEFAULT '',
  anvisa_registration TEXT NOT NULL DEFAULT '',
  reference_sources TEXT NOT NULL DEFAULT '[]',
  info_reviewed_at TEXT,
  publish_info INTEGER NOT NULL DEFAULT 0,
  show_price INTEGER NOT NULL DEFAULT 0,
  commercially_available INTEGER NOT NULL DEFAULT 0,
  whatsapp_orders INTEGER NOT NULL DEFAULT 0,
  featured INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id INTEGER,
  admin_email TEXT,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  details TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  contact TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL,
  handled INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
`;

type GlobalDb = { __goldPharmaDb?: Database.Database };
const g = globalThis as unknown as GlobalDb;

export function openDatabase(file?: string): Database.Database {
  const dbFile = file ?? process.env.DATABASE_PATH ?? path.join(DATA_DIR, "goldpharma.db");
  if (dbFile !== ":memory:") fs.mkdirSync(path.dirname(dbFile), { recursive: true });
  const db = new Database(dbFile);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  runSeed(db);
  return db;
}

export function getDb(): Database.Database {
  if (!g.__goldPharmaDb) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    g.__goldPharmaDb = openDatabase();
  }
  return g.__goldPharmaDb;
}

import "server-only";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "./db";
import { can, type Actor, type Permission, type Role } from "./permissions";

export const SESSION_COOKIE = "gp_session";
const SESSION_DAYS = 7;

type AdminRow = { id: number; email: string; name: string; password_hash: string; role: Role; active: number };

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Limitação simples de tentativas de login (por e-mail + IP), em memória.
const attempts = new Map<string, { count: number; until: number }>();

export function isRateLimited(key: string): boolean {
  const a = attempts.get(key);
  return !!a && a.count >= 5 && a.until > Date.now();
}

function registerFailure(key: string) {
  const a = attempts.get(key);
  const now = Date.now();
  if (!a || a.until < now) attempts.set(key, { count: 1, until: now + 15 * 60_000 });
  else a.count += 1;
}

export async function login(email: string, password: string, ip: string): Promise<{ ok: boolean; error?: string }> {
  const key = `${email.toLowerCase()}|${ip}`;
  if (isRateLimited(key)) return { ok: false, error: "Muitas tentativas. Aguarde 15 minutos." };
  const db = getDb();
  const admin = db
    .prepare("SELECT * FROM admins WHERE email = ? AND active = 1")
    .get(email.trim().toLowerCase()) as AdminRow | undefined;
  // Compara sempre, para não revelar se o e-mail existe pelo tempo de resposta.
  const valid = await bcrypt.compare(password, admin?.password_hash ?? "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv");
  if (!admin || !valid) {
    registerFailure(key);
    return { ok: false, error: "E-mail ou senha inválidos." };
  }
  attempts.delete(key);
  const token = crypto.randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000);
  db.prepare("INSERT INTO sessions (token_hash, admin_id, expires_at) VALUES (?, ?, ?)").run(
    hashToken(token),
    admin.id,
    expires.toISOString(),
  );
  db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(new Date().toISOString());
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.INSECURE_COOKIES !== "1",
    path: "/",
    expires,
  });
  db.prepare("INSERT INTO audit_log (admin_id, admin_email, action, entity) VALUES (?, ?, 'login', 'session')").run(
    admin.id,
    admin.email,
  );
  return { ok: true };
}

export async function logout() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) getDb().prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
  jar.delete(SESSION_COOKIE);
}

export async function getActor(): Promise<Actor | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = getDb()
    .prepare(
      `SELECT a.id, a.email, a.name, a.role FROM sessions s JOIN admins a ON a.id = s.admin_id
       WHERE s.token_hash = ? AND s.expires_at > ? AND a.active = 1`,
    )
    .get(hashToken(token), new Date().toISOString()) as { id: number; email: string; name: string; role: Role } | undefined;
  return row ?? null;
}

/** Garante sessão válida (e permissão, se informada) ou redireciona. */
export async function requireActor(permission?: Permission): Promise<Actor> {
  const actor = await getActor();
  if (!actor) redirect("/admin/login");
  if (permission && !can(actor, permission)) redirect("/admin?erro=permissao");
  return actor;
}

export function hashPassword(password: string) {
  return bcrypt.hashSync(password, 12);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compareSync(password, hash);
}

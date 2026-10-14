import "server-only";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { UPLOAD_DIR } from "./db";

const MAX_BYTES = 5 * 1024 * 1024;

function detect(buf: Buffer): string | null {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return ".jpg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return ".png";
  if (buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP") return ".webp";
  if (buf.subarray(4, 12).toString() === "ftypavif") return ".avif";
  return null;
}

/** Salva uma imagem enviada pelo painel. Retorna a URL pública ou um erro. */
export async function saveImageUpload(file: File | null): Promise<{ url?: string; error?: string }> {
  if (!file || typeof file === "string" || file.size === 0) return {};
  if (file.size > MAX_BYTES) return { error: "Imagem acima de 5 MB." };
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = detect(buf);
  if (!ext) return { error: "Formato de imagem não suportado (use JPG, PNG, WebP ou AVIF)." };
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
  await fs.writeFile(path.join(UPLOAD_DIR, name), buf);
  return { url: `/uploads/${name}` };
}

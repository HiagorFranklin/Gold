export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function formatBRL(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Converte "R$ 1.234,56", "1234,56" ou "1234.56" em centavos. */
export function parseBRL(input: string | null | undefined): number | null {
  const raw = (input ?? "").replace(/[R$\s]/g, "").trim();
  if (!raw) return null;
  let normalized = raw;
  if (raw.includes(",")) normalized = raw.replace(/\./g, "").replace(",", ".");
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return NaN;
  return Math.round(value * 100);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "não registrada";
  const d = new Date(value.length <= 10 ? `${value}T12:00:00` : value.replace(" ", "T") + (value.includes("Z") ? "" : "Z"));
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value.replace(" ", "T") + (value.includes("Z") ? "" : "Z"));
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

export function whatsappDigits(number: string | null | undefined): string {
  return (number ?? "").replace(/\D/g, "");
}

/** Monta o link wa.me. Retorna null se o número não estiver configurado. */
export function whatsappLink(number: string | null | undefined, message: string): string | null {
  let digits = whatsappDigits(number);
  if (!digits) return null;
  if (!digits.startsWith("55") && (digits.length === 10 || digits.length === 11)) digits = `55${digits}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function parseSources(raw: string | null | undefined): { label: string; url?: string }[] {
  try {
    const parsed = JSON.parse(raw || "[]");
    if (Array.isArray(parsed)) return parsed.filter((s) => s && typeof s.label === "string");
  } catch {}
  return [];
}

/** Uma fonte por linha: "Título | https://url" ou só "Título". */
export function sourcesFromText(text: string): { label: string; url?: string }[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, url] = line.split("|").map((s) => s.trim());
      const safeUrl = url && /^https?:\/\//i.test(url) ? url : undefined;
      return safeUrl ? { label: label || safeUrl, url: safeUrl } : { label: label || line };
    });
}

export function sourcesToText(raw: string | null | undefined): string {
  return parseSources(raw)
    .map((s) => (s.url ? `${s.label} | ${s.url}` : s.label))
    .join("\n");
}

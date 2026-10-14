import { describe, expect, it } from "vitest";
import { parseBRL, whatsappLink, sourcesFromText } from "@/lib/format";

describe("format", () => {
  it("converte valores em reais", () => {
    expect(parseBRL("R$ 1.234,56")).toBe(123456);
    expect(parseBRL("165")).toBe(16500);
    expect(parseBRL("")).toBeNull();
    expect(Number.isNaN(parseBRL("abc"))).toBe(true);
  });
  it("monta o link do WhatsApp com DDI e mensagem codificada", () => {
    expect(whatsappLink("(11) 98765-4321", "Olá! Tudo bem?")).toBe(
      "https://wa.me/5511987654321?text=Ol%C3%A1!%20Tudo%20bem%3F",
    );
    expect(whatsappLink("", "x")).toBeNull();
  });
  it("aceita apenas URLs http(s) nas fontes", () => {
    expect(sourcesFromText("NHS | https://nhs.uk\nX | javascript:alert(1)")).toEqual([
      { label: "NHS", url: "https://nhs.uk" },
      { label: "X" },
    ]);
  });
});

describe("migração de configurações v2", async () => {
  const { openDatabase } = await import("@/lib/db");
  const { getSettings } = await import("@/lib/data");
  const { runSeed } = await import("@/lib/seed");
  it("banco novo já vem com WhatsApp e fotos", () => {
    const s = getSettings(openDatabase(":memory:"));
    expect(s.whatsapp_number).toBe("32984762222");
    expect(s.hero_image_url).toMatch(/^https:\/\/images\.unsplash\.com\//);
  });
  it("banco existente preenche só campos vazios", () => {
    const db = openDatabase(":memory:");
    db.prepare("UPDATE settings SET value = '1' WHERE key = 'seed_version'").run();
    db.prepare("UPDATE settings SET value = '11999990000' WHERE key = 'whatsapp_number'").run();
    db.prepare("UPDATE settings SET value = '' WHERE key = 'hero_image_url'").run();
    runSeed(db);
    const s = getSettings(db);
    expect(s.whatsapp_number).toBe("11999990000");
    expect(s.hero_image_url).toMatch(/unsplash/);
    expect(s.seed_version).toBe("3");
    expect(s.contact_email).toBe("juniorhp22@hotmail.com");
  });
});

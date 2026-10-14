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

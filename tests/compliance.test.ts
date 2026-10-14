import { describe, expect, it, beforeEach } from "vitest";
import type Database from "better-sqlite3";
import { openDatabase } from "@/lib/db";
import { evaluateCompliance, type ComplianceInput } from "@/lib/compliance";
import { listAdminProducts, listPublicProducts, getPublicProduct } from "@/lib/data";
import { saveProduct, type ProductInput } from "@/lib/product-service";
import type { Actor } from "@/lib/permissions";

const admin: Actor = { id: 1, email: "admin@test", role: "admin" };
const editor: Actor = { id: 2, email: "editor@test", role: "editor" };
const reader: Actor = { id: 3, email: "leitura@test", role: "leitura" };

const base: ComplianceInput = {
  name: "Whey Protein Concentrado",
  active_ingredient: "Proteína do soro do leite",
  manufacturer: "Fabricante Exemplo",
  regulatory_status: "pendente_verificacao",
  regulatory_source: "",
  regulatory_checked_at: "",
  anvisa_registration: "",
  publish_info: true,
  show_price: true,
  commercially_available: true,
  whatsapp_orders: true,
  price_cents: 12000,
};

const confirmed: ComplianceInput = {
  ...base,
  regulatory_status: "regularidade_confirmada",
  regulatory_source: "Consulta Anvisa",
  regulatory_checked_at: "2026-10-01",
  anvisa_registration: "6.1234.0001.001-1",
};

function regularInput(over: Partial<ProductInput> = {}): ProductInput {
  return {
    name: "Whey Protein Concentrado",
    active_ingredient: "Proteína do soro do leite",
    manufacturer: "Fabricante Exemplo",
    presentation: "900 g",
    description: "",
    image_url: "",
    image_alt: "",
    image_is_illustrative: true,
    category_id: null,
    health_topic_id: null,
    price_cents: 12000,
    availability: "disponivel",
    regulatory_status: "regularidade_confirmada",
    regulatory_justification: "",
    regulatory_source: "Consulta Anvisa",
    regulatory_checked_at: "2026-10-01",
    regulatory_reviewer: "Farmacêutico responsável",
    anvisa_registration: "6.1234.0001.001-1",
    reference_sources: "[]",
    info_reviewed_at: "",
    publish_info: true,
    show_price: true,
    commercially_available: true,
    whatsapp_orders: true,
    featured: false,
    ...over,
  };
}

describe("evaluateCompliance — estados regulatórios", () => {
  it.each(["pendente_verificacao", "em_analise", "comercializacao_bloqueada"] as const)(
    "%s não exibe nada ao público",
    (status) => {
      const r = evaluateCompliance({ ...confirmed, regulatory_status: status });
      expect(r.effective).toEqual({ publicListing: false, price: false, availability: false, whatsappOrder: false });
    },
  );

  it("divulgação restrita exibe só a ficha, sem preço nem pedido", () => {
    const r = evaluateCompliance({ ...confirmed, regulatory_status: "divulgacao_restrita" });
    expect(r.effective).toEqual({ publicListing: true, price: false, availability: false, whatsappOrder: false });
  });

  it("regularidade confirmada e documentada libera os controles solicitados", () => {
    const r = evaluateCompliance(confirmed);
    expect(r.effective).toEqual({ publicListing: true, price: true, availability: true, whatsappOrder: true });
  });

  it("regularidade confirmada sem documentação não libera nada", () => {
    const r = evaluateCompliance({ ...confirmed, anvisa_registration: "" });
    expect(r.effective.publicListing).toBe(false);
    expect(r.effective.price).toBe(false);
  });

  it("controles desligados pelo administrador continuam desligados", () => {
    const r = evaluateCompliance({ ...confirmed, show_price: false, whatsapp_orders: false });
    expect(r.effective.price).toBe(false);
    expect(r.effective.whatsappOrder).toBe(false);
    expect(r.effective.availability).toBe(true);
  });

  it("pedido por WhatsApp exige disponibilidade comercial", () => {
    const r = evaluateCompliance({ ...confirmed, commercially_available: false });
    expect(r.effective.whatsappOrder).toBe(false);
  });

  it("proibição vigente vence mesmo com status confirmado e documentado", () => {
    const r = evaluateCompliance({ ...confirmed, name: "Oxandrolona Landerlan", active_ingredient: "Oxandrolona", manufacturer: "Landerlan" });
    expect(r.hardBlocked).toBe(true);
    expect(r.effective).toEqual({ publicListing: false, price: false, availability: false, whatsappOrder: false });
  });

  it("detecta princípio ativo com acento ou grafia alternativa", () => {
    expect(evaluateCompliance({ ...confirmed, active_ingredient: "ESTANOZOLOL" }).hardBlocked).toBe(true);
    expect(evaluateCompliance({ ...confirmed, name: "Gonadotrofina coriônica" }).hardBlocked).toBe(true);
  });
});

describe("cadastro inicial e serviço de produtos", () => {
  let db: Database.Database;
  beforeEach(() => {
    db = openDatabase(":memory:");
  });

  it("cadastra os 17 produtos informados, todos bloqueados, com preços internos", () => {
    const products = listAdminProducts(db);
    expect(products).toHaveLength(17);
    for (const p of products) {
      expect(p.regulatory_status).toBe("comercializacao_bloqueada");
      expect(p.compliance.hardBlocked).toBe(true);
      expect(p.price_cents).toBeGreaterThan(0);
      expect(p.regulatory_justification.length).toBeGreaterThan(10);
    }
    const prices = products.map((p) => p.price_cents).sort((a, b) => a! - b!);
    expect(prices[0]).toBe(11000);
    expect(prices.at(-1)).toBe(35000);
  });

  it("nenhum produto bloqueado aparece na interface pública", () => {
    expect(listPublicProducts(db)).toHaveLength(0);
    const any = listAdminProducts(db)[0];
    expect(getPublicProduct(any.slug, db)).toBeNull();
  });

  it("troca manual de status não contorna a proibição", () => {
    const p = listAdminProducts(db).find((x) => x.name.startsWith("Oxandrolona"))!;
    const res = saveProduct(
      admin,
      regularInput({ name: p.name, active_ingredient: p.active_ingredient, manufacturer: p.manufacturer, presentation: p.presentation }),
      p.id,
      db,
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.join(" ")).toMatch(/proibição vigente/);
    expect(listPublicProducts(db)).toHaveLength(0);
  });

  it("produto regular aprovado aparece com preço e pedido; a tabela reflete a alteração de preço", () => {
    const res = saveProduct(admin, regularInput(), undefined, db);
    expect(res.ok).toBe(true);
    let pub = listPublicProducts(db);
    expect(pub).toHaveLength(1);
    expect(pub[0].price_cents).toBe(12000);
    expect(pub[0].whatsapp_order).toBe(true);

    if (!res.ok) return;
    const upd = saveProduct(admin, regularInput({ price_cents: 13990 }), res.id, db);
    expect(upd.ok).toBe(true);
    pub = listPublicProducts(db);
    expect(pub[0].price_cents).toBe(13990);
  });

  it("produto pendente fica só no cadastro interno", () => {
    const res = saveProduct(admin, regularInput({ regulatory_status: "pendente_verificacao" }), undefined, db);
    expect(res.ok).toBe(true);
    expect(listPublicProducts(db)).toHaveLength(0);
    expect(listAdminProducts(db)).toHaveLength(18);
  });

  it("editor não altera preço nem situação regulatória; leitura não edita", () => {
    const res = saveProduct(admin, regularInput(), undefined, db);
    if (!res.ok) throw new Error("falhou");
    const priceChange = saveProduct(editor, regularInput({ price_cents: 1 }), res.id, db);
    expect(priceChange.ok).toBe(false);
    const statusChange = saveProduct(editor, regularInput({ regulatory_status: "em_analise" }), res.id, db);
    expect(statusChange.ok).toBe(false);
    const descChange = saveProduct(editor, regularInput({ description: "Nova descrição" }), res.id, db);
    expect(descChange.ok).toBe(true);
    expect(saveProduct(reader, regularInput(), res.id, db).ok).toBe(false);
  });

  it("alterações importantes ficam no histórico de auditoria", () => {
    const res = saveProduct(admin, regularInput(), undefined, db);
    if (!res.ok) throw new Error("falhou");
    saveProduct(admin, regularInput({ price_cents: 15000 }), res.id, db);
    const rows = db.prepare("SELECT action, details FROM audit_log WHERE entity_id = ? ORDER BY id").all(res.id) as {
      action: string;
      details: string;
    }[];
    expect(rows.map((r) => r.action)).toEqual(["create", "update_important"]);
    expect(JSON.parse(rows[1].details).changes.price_cents).toEqual({ de: 12000, para: 15000 });
  });

  it("regularidade confirmada exige registro, fonte e data", () => {
    const res = saveProduct(admin, regularInput({ anvisa_registration: "", regulatory_checked_at: "" }), undefined, db);
    expect(res.ok).toBe(false);
  });
});

describe("catálogo público avaliado por produto", () => {
  it("exibe itens permitidos mesmo com itens bloqueados no banco", () => {
    const db = openDatabase(":memory:");
    // 17 itens bloqueados do cadastro inicial continuam no banco
    expect(listAdminProducts(db)).toHaveLength(17);
    const a = saveProduct(admin, regularInput({ name: "Creatina Monohidratada Exemplo", presentation: "300 g", price_cents: 8990 }), undefined, db);
    const b = saveProduct(
      admin,
      regularInput({ name: "Multivitamínico Exemplo", presentation: "60 cápsulas", regulatory_status: "divulgacao_restrita", show_price: false, commercially_available: false, whatsapp_orders: false }),
      undefined,
      db,
    );
    const c = saveProduct(admin, regularInput({ name: "Ômega 3 Exemplo", regulatory_status: "pendente_verificacao", publish_info: false, show_price: false, commercially_available: false, whatsapp_orders: false }), undefined, db);
    expect([a.ok, b.ok, c.ok]).toEqual([true, true, true]);

    const pub = listPublicProducts(db);
    expect(pub.map((p) => p.name).sort()).toEqual(["Creatina Monohidratada Exemplo", "Multivitamínico Exemplo"]);
    const creatina = pub.find((p) => p.name.startsWith("Creatina"))!;
    expect(creatina.price_cents).toBe(8990);
    const multi = pub.find((p) => p.name.startsWith("Multi"))!;
    expect(multi.price_cents).toBeNull();
    expect(multi.whatsapp_order).toBe(false);
    expect(pub.some((p) => /Lander/.test(p.name))).toBe(false);
  });
});

describe("consulta regulatória", async () => {
  const { displayGroup, publicVisibilitySummary } = await import("@/lib/compliance");
  it("classifica os quatro grupos e mantém os 17 itens como bloqueados", () => {
    const db = openDatabase(":memory:");
    saveProduct(admin, regularInput({ name: "Aprovado X" }), undefined, db);
    saveProduct(admin, regularInput({ name: "Restrito X", regulatory_status: "divulgacao_restrita", show_price: false, commercially_available: false, whatsapp_orders: false }), undefined, db);
    saveProduct(admin, regularInput({ name: "Pendente X", regulatory_status: "pendente_verificacao", publish_info: false, show_price: false, commercially_available: false, whatsapp_orders: false }), undefined, db);
    const groups = listAdminProducts(db).map((p) => [p.name, displayGroup(p.regulatory_status, p.compliance), publicVisibilitySummary(p.compliance)]);
    const by = (n: string) => groups.find((g) => g[0] === n)!;
    expect(by("Aprovado X").slice(1)).toEqual(["aprovado", "Ficha, preço e pedido via WhatsApp"]);
    expect(by("Restrito X").slice(1)).toEqual(["restrito", "Ficha informativa, não disponível para oferta"]);
    expect(by("Pendente X").slice(1)).toEqual(["pendente", "Oculto do site"]);
    const blocked = groups.filter((g) => g[1] === "bloqueado");
    expect(blocked).toHaveLength(17);
    expect(blocked.every((g) => g[2] === "Oculto do site")).toBe(true);
  });
});

/**
 * Regras de conformidade sanitária da Gold Pharma.
 *
 * Este módulo é a ÚNICA fonte de verdade sobre o que pode ser exibido ao
 * público. Toda consulta pública passa por `evaluateCompliance`, e o servidor
 * também o utiliza para rejeitar alterações administrativas que tentem
 * liberar recursos comerciais proibidos.
 *
 * As proibições "rígidas" (HARD_RULES) ficam no código de propósito: elas
 * decorrem de norma vigente e não podem ser removidas por uma simples troca
 * de status no painel. Para alterá-las é necessária uma mudança de código
 * revisada, acompanhada da documentação oficial que comprove a mudança.
 */

export const REGULATORY_STATUSES = [
  "pendente_verificacao",
  "em_analise",
  "regularidade_confirmada",
  "divulgacao_restrita",
  "comercializacao_bloqueada",
] as const;
export type RegulatoryStatus = (typeof REGULATORY_STATUSES)[number];

export const REGULATORY_STATUS_LABELS: Record<RegulatoryStatus, string> = {
  pendente_verificacao: "Pendente de verificação",
  em_analise: "Em análise documental",
  regularidade_confirmada: "Regularidade confirmada",
  divulgacao_restrita: "Divulgação restrita",
  comercializacao_bloqueada: "Comercialização bloqueada",
};

export const COMMERCIAL_BLOCK_NOTICE =
  "Exibição comercial bloqueada — verificar situação regulatória";

export type ComplianceInput = {
  name: string;
  active_ingredient: string;
  manufacturer: string;
  category_slug?: string | null;
  regulatory_status: RegulatoryStatus;
  regulatory_source?: string | null;
  regulatory_checked_at?: string | null;
  anvisa_registration?: string | null;
  // Controles solicitados pelo administrador (intenção)
  publish_info: boolean;
  show_price: boolean;
  commercially_available: boolean;
  whatsapp_orders: boolean;
  price_cents?: number | null;
};

export type HardRule = {
  id: string;
  title: string;
  reason: string;
  source: string;
  sourceUrl?: string;
  match: (p: Pick<ComplianceInput, "name" | "active_ingredient" | "manufacturer">) => boolean;
  /** Se true, nem a ficha informativa do produto (com marca) pode ser pública. */
  blocksPublicListing: boolean;
};

export function normalize(text: string | null | undefined): string {
  return (text ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function haystack(p: Pick<ComplianceInput, "name" | "active_ingredient" | "manufacturer">) {
  return normalize(`${p.name} ${p.active_ingredient} ${p.manufacturer}`);
}

const ANABOLIC_TERMS = [
  "testosterona",
  "durateston",
  "nandrolona",
  "drostanolona",
  "masteron",
  "trembolona",
  "boldenona",
  "estanozolol",
  "stanozolol",
  "metandrostenolona",
  "dianabol",
  "oxandrolona",
  "oximetolona",
  "hemogenin",
];

const NO_HUMAN_AUTHORIZATION_TERMS = ["trembolona", "boldenona", "clembuterol"];

const PRESCRIPTION_ADVERTISING_TERMS = ["hcg", "gonadotrofina", "clembuterol"];

const UNREGISTERED_MANUFACTURERS = ["landergold", "landerlan"];

const PORTARIA_344 =
  "https://bvsms.saude.gov.br/bvs/saudelegis/svs/1998/prt0344_12_05_1998_rep.html";

export const HARD_RULES: HardRule[] = [
  {
    id: "anabolizante-controlado",
    title: "Substância anabolizante controlada",
    reason:
      "Esteroides anabolizantes integram a lista C5 da Portaria SVS/MS nº 344/1998. A dispensação exige receita retida em farmácia; venda, oferta e propaganda ao público pela internet ou WhatsApp não são permitidas.",
    source: "Portaria SVS/MS nº 344/1998 (lista C5) e Lei nº 9.965/2000",
    sourceUrl: PORTARIA_344,
    match: (p) => ANABOLIC_TERMS.some((t) => haystack(p).includes(t)),
    blocksPublicListing: true,
  },
  {
    id: "sem-autorizacao-uso-humano",
    title: "Princípio ativo sem uso humano autorizado na apresentação informada",
    reason:
      "Trembolona e boldenona são de uso veterinário; o clembuterol não possui indicação aprovada para emagrecimento ou desempenho. Não podem ser ofertados para uso humano.",
    source: "Anvisa / MAPA — conferir consulta oficial e registrar a data",
    match: (p) => NO_HUMAN_AUTHORIZATION_TERMS.some((t) => haystack(p).includes(t)),
    blocksPublicListing: true,
  },
  {
    id: "venda-sob-prescricao",
    title: "Medicamento de venda sob prescrição",
    reason:
      "A propaganda de medicamentos de venda sob prescrição ao público em geral é vedada (RDC Anvisa nº 96/2008). Preço, oferta e pedido não podem ser publicados.",
    source: "RDC Anvisa nº 96/2008",
    match: (p) => PRESCRIPTION_ADVERTISING_TERMS.some((t) => haystack(p).includes(t)),
    blocksPublicListing: true,
  },
  {
    id: "fabricante-sem-registro",
    title: "Fabricante sem registro confirmado na Anvisa",
    reason:
      "Produtos de fabricante sem registro sanitário no Brasil são irregulares (Lei nº 6.360/1976). Procedência e autenticidade não podem ser presumidas.",
    source: "Lei nº 6.360/1976 — consultar consultas.anvisa.gov.br",
    sourceUrl: "https://consultas.anvisa.gov.br/",
    match: (p) => UNREGISTERED_MANUFACTURERS.some((m) => normalize(p.manufacturer).includes(m) || normalize(p.name).includes(m)),
    blocksPublicListing: true,
  },
];

export type ComplianceResult = {
  hardRules: HardRule[];
  hardBlocked: boolean;
  /** O que efetivamente pode ser exibido ao público. */
  effective: {
    publicListing: boolean;
    price: boolean;
    availability: boolean;
    whatsappOrder: boolean;
  };
  /** Motivos pelos quais algum controle solicitado foi negado. */
  denials: string[];
};

export function matchHardRules(p: Pick<ComplianceInput, "name" | "active_ingredient" | "manufacturer">): HardRule[] {
  return HARD_RULES.filter((r) => r.match(p));
}

/**
 * Calcula o que pode ser exibido publicamente. Os controles do administrador
 * apenas expressam intenção: um recurso só é liberado quando a situação
 * regulatória e as regras rígidas permitem.
 */
export function evaluateCompliance(p: ComplianceInput): ComplianceResult {
  const hardRules = matchHardRules(p);
  const hardBlocked = hardRules.length > 0;
  const denials: string[] = [];

  const confirmed = p.regulatory_status === "regularidade_confirmada";
  const documented = Boolean(
    p.regulatory_source?.trim() && p.regulatory_checked_at?.trim() && p.anvisa_registration?.trim(),
  );

  // Ficha pública (informativa)
  const listingStatusOk =
    p.regulatory_status === "regularidade_confirmada" || p.regulatory_status === "divulgacao_restrita";
  let publicListing = p.publish_info && listingStatusOk && !hardBlocked;
  if (p.publish_info && !publicListing) {
    if (hardBlocked) denials.push("Publicação negada: proibição sanitária vigente.");
    else denials.push("Publicação negada: exige 'Regularidade confirmada' ou 'Divulgação restrita'.");
  }
  if (publicListing && !documented && confirmed) {
    // regularidade confirmada sem documentação não é aceita
    publicListing = false;
    denials.push("Publicação negada: registre nº de registro Anvisa, fonte e data da verificação.");
  }

  const commercialOk = publicListing && confirmed && documented;
  const price = p.show_price && commercialOk && p.price_cents != null && p.price_cents > 0;
  if (p.show_price && !price) denials.push("Preço público negado: exige regularidade confirmada e documentada.");

  const availability = p.commercially_available && commercialOk;
  if (p.commercially_available && !availability)
    denials.push("Disponibilidade comercial negada: exige regularidade confirmada e documentada.");

  const whatsappOrder = p.whatsapp_orders && availability;
  if (p.whatsapp_orders && !whatsappOrder)
    denials.push("Pedido via WhatsApp negado: exige disponibilidade comercial liberada.");

  return {
    hardRules,
    hardBlocked,
    effective: { publicListing, price, availability, whatsappOrder },
    denials,
  };
}

/**
 * Validação de escrita: impede que o painel grave um estado que contradiga
 * uma proibição vigente. Retorna mensagens de erro (vazio = ok).
 */
export function validateRegulatoryWrite(p: ComplianceInput): string[] {
  const errors: string[] = [];
  const rules = matchHardRules(p);
  if (rules.length > 0) {
    if (p.regulatory_status === "regularidade_confirmada" || p.regulatory_status === "divulgacao_restrita") {
      errors.push(
        `Status "${REGULATORY_STATUS_LABELS[p.regulatory_status]}" não permitido: proibição vigente (${rules
          .map((r) => r.title)
          .join("; ")}).`,
      );
    }
    if (p.publish_info || p.show_price || p.commercially_available || p.whatsapp_orders) {
      errors.push("Recursos públicos/comerciais não podem ser ativados para um produto com proibição vigente.");
    }
  }
  if (p.regulatory_status === "regularidade_confirmada") {
    if (!p.anvisa_registration?.trim()) errors.push("Informe o nº de registro na Anvisa para confirmar a regularidade.");
    if (!p.regulatory_source?.trim()) errors.push("Informe a fonte oficial consultada.");
    if (!p.regulatory_checked_at?.trim()) errors.push("Informe a data da verificação.");
  }
  return errors;
}

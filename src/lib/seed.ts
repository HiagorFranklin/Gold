import type Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { matchHardRules } from "./compliance";
import { slugify } from "./format";

const GENERAL_SOURCES = [
  { label: "NHS — Anabolic steroid misuse", url: "https://www.nhs.uk/conditions/anabolic-steroid-misuse/" },
  { label: "MedlinePlus — Anabolic Steroids", url: "https://medlineplus.gov/anabolicsteroids.html" },
  {
    label: "Portaria SVS/MS nº 344/1998",
    url: "https://bvsms.saude.gov.br/bvs/saudelegis/svs/1998/prt0344_12_05_1998_rep.html",
  },
  { label: "Anvisa — Consulta de produtos registrados", url: "https://consultas.anvisa.gov.br/" },
];

const AESTHETIC_NOTE =
  "Efeitos procurados para fins estéticos ou de desempenho esportivo não são benefícios médicos reconhecidos e não devem ser confundidos com indicações terapêuticas.";

type TopicSeed = {
  slug: string;
  title: string;
  actives: string;
  benefits: string;
  adverse: string;
  serious?: string;
};

const TOPICS: TopicSeed[] = [
  {
    slug: "testosterona",
    title: "Testosterona (propionato, enantato e formulações combinadas)",
    actives: "testosterona, durateston",
    benefits:
      "Determinadas formulações podem ser utilizadas em reposição hormonal quando existe indicação clínica, com prescrição e acompanhamento médico.",
    adverse:
      "Acne, aumento do hematócrito, alterações de colesterol, retenção de líquidos, redução da fertilidade e possíveis complicações cardiovasculares.",
  },
  {
    slug: "drostanolona",
    title: "Drostanolona (Masteron)",
    actives: "drostanolona, masteron",
    benefits:
      "Não se presume indicação médica humana aprovada para a apresentação informada. Objetivos estéticos não são benefícios comprovados.",
    adverse: "Acne, queda de cabelo, alterações de colesterol, supressão hormonal e comprometimento da fertilidade.",
  },
  {
    slug: "nandrolona",
    title: "Nandrolona (decanoato e fenilpropionato)",
    actives: "nandrolona",
    benefits: "Eventuais usos terapêuticos dependem da formulação, da indicação documentada e da jurisdição.",
    adverse:
      "Alterações hormonais e reprodutivas, acne, retenção de líquidos e possíveis complicações cardiovasculares.",
  },
  {
    slug: "trembolona",
    title: "Trembolona (acetato e enantato)",
    actives: "trembolona",
    benefits:
      "Não há benefício médico estabelecido para humanos. Aumento de massa muscular não é uma indicação terapêutica.",
    adverse: "Supressão hormonal, infertilidade, alterações do sono e do humor e riscos cardiovasculares.",
    serious: "A segurança em humanos é insuficientemente estabelecida para esse uso.",
  },
  {
    slug: "boldenona",
    title: "Boldenona",
    actives: "boldenona",
    benefits: "Não se presume indicação terapêutica humana estabelecida para uso estético.",
    adverse:
      "Aumento do hematócrito, alterações de colesterol, supressão hormonal e possíveis complicações cardiovasculares.",
  },
  {
    slug: "estanozolol",
    title: "Estanozolol (Stanozolol)",
    actives: "estanozolol, stanozolol",
    benefits: "Não se atribui indicação aprovada à apresentação comercial sem confirmação documental.",
    adverse: "Lesão hepática, alterações de colesterol, acne, queda de cabelo e supressão hormonal.",
  },
  {
    slug: "metandrostenolona",
    title: "Metandrostenolona (Dianabol)",
    actives: "metandrostenolona, dianabol",
    benefits: "Objetivos estéticos não são benefícios médicos comprovados.",
    adverse:
      "Toxicidade hepática, hipertensão, retenção de líquidos, alterações do colesterol e supressão hormonal.",
  },
  {
    slug: "oxandrolona",
    title: "Oxandrolona",
    actives: "oxandrolona",
    benefits:
      "Há histórico de indicações clínicas específicas em determinadas jurisdições; é necessário verificar a situação regulatória da apresentação.",
    adverse:
      "Lesão hepática, alterações de colesterol, acne, alterações hormonais e comprometimento da fertilidade.",
  },
  {
    slug: "oximetolona",
    title: "Oximetolona (Hemogenin)",
    actives: "oximetolona, hemogenin",
    benefits: "Possui histórico de uso em determinadas doenças hematológicas, conforme indicação e jurisdição.",
    adverse: "Retenção de líquidos, hipertensão e alterações do colesterol.",
    serious: "Toxicidade hepática grave e icterícia.",
  },
  {
    slug: "clembuterol",
    title: "Clembuterol",
    actives: "clembuterol",
    benefits: "Emagrecimento e melhora de desempenho não são indicações aprovadas no Brasil.",
    adverse: "Taquicardia, tremores, ansiedade e queda do potássio.",
    serious: "Arritmias e complicações cardíacas potencialmente graves.",
  },
  {
    slug: "hcg",
    title: "Gonadotrofina coriônica humana (HCG)",
    actives: "hcg, gonadotrofina",
    benefits: "Possui usos médicos específicos, incluindo determinados tratamentos de fertilidade, sob prescrição.",
    adverse:
      "Dor de cabeça e reações no local da aplicação. Em determinados tratamentos de fertilidade, síndrome de hiperestimulação ovariana.",
  },
];

type ProductSeed = { name: string; active: string; presentation: string; price: number; category: string; topic: string };

const PRODUCTS: ProductSeed[] = [
  { name: "Propionato de Testosterona LanderGold", active: "Propionato de testosterona", presentation: "10 mL", price: 16500, category: "injetaveis", topic: "testosterona" },
  { name: "Enantato de Testosterona LanderGold", active: "Enantato de testosterona", presentation: "10 mL", price: 17500, category: "injetaveis", topic: "testosterona" },
  { name: "Propionato de Masteron LanderGold", active: "Propionato de drostanolona", presentation: "10 mL", price: 35000, category: "injetaveis", topic: "drostanolona" },
  { name: "Durateston LanderGold", active: "Ésteres de testosterona (formulação combinada)", presentation: "10 mL", price: 18000, category: "injetaveis", topic: "testosterona" },
  { name: "Decanoato de Nandrolona LanderGold", active: "Decanoato de nandrolona", presentation: "10 mL", price: 18000, category: "injetaveis", topic: "nandrolona" },
  { name: "Fenilpropionato de Nandrolona LanderGold", active: "Fenilpropionato de nandrolona", presentation: "10 mL", price: 18000, category: "injetaveis", topic: "nandrolona" },
  { name: "Acetato de Trembolona LanderGold", active: "Acetato de trembolona", presentation: "10 mL", price: 19000, category: "injetaveis", topic: "trembolona" },
  { name: "Enantato de Trembolona LanderGold", active: "Enantato de trembolona", presentation: "10 mL", price: 19000, category: "injetaveis", topic: "trembolona" },
  { name: "Boldenona Undecilato LanderGold", active: "Undecilenato de boldenona", presentation: "10 mL", price: 18000, category: "injetaveis", topic: "boldenona" },
  { name: "HCG LanderGold", active: "Gonadotrofina coriônica humana (HCG)", presentation: "5000 UI", price: 19500, category: "injetaveis", topic: "hcg" },
  { name: "Stanozolol Landerlan", active: "Estanozolol", presentation: "10 mg, 100 comprimidos", price: 11000, category: "orais", topic: "estanozolol" },
  { name: "Stanozolol Landerlan", active: "Estanozolol", presentation: "50 mg, 30 mL", price: 14000, category: "orais", topic: "estanozolol" },
  { name: "Dianabol (Metandrostenolona) Landerlan", active: "Metandrostenolona", presentation: "10 mg, 100 comprimidos", price: 11000, category: "orais", topic: "metandrostenolona" },
  { name: "Oxandrolona Landerlan", active: "Oxandrolona", presentation: "5 mg, 100 comprimidos", price: 22500, category: "orais", topic: "oxandrolona" },
  { name: "Oxandrolona Landerlan", active: "Oxandrolona", presentation: "10 mg, 50 comprimidos", price: 22500, category: "orais", topic: "oxandrolona" },
  { name: "Hemogenin (Oximetolona) Landerlan", active: "Oximetolona", presentation: "50 mg, 20 comprimidos", price: 11000, category: "orais", topic: "oximetolona" },
  { name: "Clembuterol Landerlan", active: "Clembuterol", presentation: "50 comprimidos", price: 11000, category: "orais", topic: "clembuterol" },
];

const CATEGORIES = [
  { slug: "injetaveis", name: "Injetáveis e apresentações líquidas", description: "Apresentações injetáveis e líquidas cadastradas.", sort: 1 },
  { slug: "orais", name: "Orais e outras apresentações", description: "Comprimidos, soluções orais e demais apresentações.", sort: 2 },
  { slug: "suplementacao", name: "Suplementação e nutrição", description: "Suplementos alimentares e produtos de nutrição esportiva.", sort: 3 },
  { slug: "bem-estar", name: "Saúde e bem-estar", description: "Produtos de cuidado, recuperação e qualidade de vida.", sort: 4 },
];

export const DEFAULT_SETTINGS: Record<string, string> = {
  site_name: "Gold Pharma",
  hero_title: "GOLD PHARMA",
  hero_subtitle: "Conhecimento, qualidade e informação para sua jornada.",
  hero_image_url: "",
  hero_image_alt: "Academia moderna com equipamentos de musculação em iluminação escura",
  training_image_url: "",
  training_image_alt: "Atleta em treino de força com barra",
  recovery_image_url: "",
  recovery_image_alt: "Momento de descanso e recuperação muscular",
  nutrition_image_url: "",
  nutrition_image_alt: "Alimentação equilibrada para rotina de treinos",
  science_image_url: "",
  science_image_alt: "Pesquisa laboratorial em ambiente farmacêutico",
  about_image_url: "",
  about_image_alt: "Ambiente institucional da Gold Pharma",
  whatsapp_number: "",
  whatsapp_message:
    "Olá! Acessei o site da Gold Pharma e gostaria de obter informações sobre o atendimento e o catálogo.",
  contact_email: "",
  contact_phone: "",
  address: "",
  business_hours: "Segunda a sexta, das 9h às 18h",
  company_legal_name: "",
  cnpj: "",
  technical_responsible: "",
  about_title: "Ciência, informação e responsabilidade",
  about_text:
    "A Gold Pharma nasceu para aproximar quem treina de informação séria sobre saúde, desempenho e bem-estar. Trabalhamos com curadoria criteriosa, fontes reconhecidas e respeito às normas sanitárias brasileiras.\n\nNosso compromisso é oferecer conteúdo claro e um atendimento transparente, sem promessas de resultados e sempre incentivando o acompanhamento de profissionais de saúde qualificados.",
  mission: "Levar informação confiável e atendimento responsável a quem cuida do próprio corpo.",
  values: "Transparência\nRigor científico\nConformidade sanitária\nRespeito ao cliente",
  privacy_policy:
    "MODELO — revisar com assessoria jurídica antes de publicar.\n\n1. Dados coletados\nColetamos apenas os dados que você informa voluntariamente no formulário de contato (nome, forma de contato e mensagem). Não solicitamos informações médicas.\n\n2. Finalidade\nOs dados são usados exclusivamente para responder ao seu contato.\n\n3. Compartilhamento\nNão vendemos nem compartilhamos dados pessoais com terceiros, exceto quando exigido por lei.\n\n4. Armazenamento e segurança\nOs dados são armazenados em ambiente protegido, com acesso restrito à equipe autorizada.\n\n5. Seus direitos (LGPD — Lei nº 13.709/2018)\nVocê pode solicitar acesso, correção ou exclusão dos seus dados pelos canais de contato.\n\n6. Cookies\nUtilizamos apenas cookies essenciais para o funcionamento do site e da área administrativa.",
  terms_of_use:
    "MODELO — revisar com assessoria jurídica antes de publicar.\n\n1. Natureza do conteúdo\nO conteúdo do site tem caráter exclusivamente informativo e educativo e não substitui consulta, diagnóstico ou prescrição de profissional de saúde.\n\n2. Produtos e preços\nA exibição de produtos, preços e disponibilidade está condicionada à situação regulatória de cada item. Produtos de venda controlada ou sob prescrição não são ofertados por este canal.\n\n3. Atendimento por WhatsApp\nO contato por WhatsApp é iniciado por você, que revisa e envia a mensagem manualmente.\n\n4. Responsabilidades\nO uso de qualquer medicamento deve ocorrer apenas com orientação médica.\n\n5. Alterações\nEstes termos podem ser atualizados a qualquer momento.",
  legal_info:
    "As informações deste site têm caráter educativo e não constituem indicação, prescrição ou propaganda de medicamentos.\n\nMedicamentos de venda sob prescrição e substâncias sujeitas a controle especial (Portaria SVS/MS nº 344/1998) não são ofertados, anunciados ou vendidos por este site ou pelo WhatsApp.\n\nA presença de um item no cadastro interno não confirma marca, procedência, composição ou registro sanitário.\n\nEm caso de dúvidas sobre medicamentos, procure um médico ou farmacêutico. Para notificar eventos adversos, utilize o sistema VigiMed da Anvisa.",
  footer_disclaimer:
    "Conteúdo informativo. Não substitui orientação médica. Não ofertamos medicamentos controlados ou de venda sob prescrição.",
};

function topicSources() {
  return JSON.stringify(GENERAL_SOURCES);
}

function randomId() {
  return crypto.randomUUID();
}

export function runSeed(db: Database.Database) {
  const seeded = db.prepare("SELECT value FROM settings WHERE key = 'seed_version'").get() as { value: string } | undefined;
  if (seeded) {
    // Garante novas chaves de configuração sem sobrescrever valores existentes.
    const ins = db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)");
    for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) ins.run(k, v);
    return;
  }

  const tx = db.transaction(() => {
    const insSetting = db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)");
    for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) insSetting.run(k, v);

    const insCat = db.prepare(
      "INSERT OR IGNORE INTO categories (slug, name, description, sort_order) VALUES (?, ?, ?, ?)",
    );
    for (const c of CATEGORIES) insCat.run(c.slug, c.name, c.description, c.sort);

    const insTopic = db.prepare(`INSERT OR IGNORE INTO health_topics
      (slug, title, active_ingredients, summary, therapeutic_benefits, aesthetic_note, adverse_effects, serious_risks, sources, review_status, published)
      VALUES (@slug, @title, @actives, @summary, @benefits, @aesthetic, @adverse, @serious, @sources, 'preliminar', 1)`);
    for (const t of TOPICS) {
      insTopic.run({
        slug: t.slug,
        title: t.title,
        actives: t.actives,
        summary:
          "Referência educativa preliminar. Não é bula, não confirma a autenticidade de nenhum produto e não substitui orientação médica.",
        benefits: t.benefits,
        aesthetic: AESTHETIC_NOTE,
        adverse: t.adverse,
        serious: t.serious ?? "",
        sources: topicSources(),
      });
    }

    const catId = (slug: string) =>
      (db.prepare("SELECT id FROM categories WHERE slug = ?").get(slug) as { id: number }).id;
    const topicId = (slug: string) =>
      (db.prepare("SELECT id FROM health_topics WHERE slug = ?").get(slug) as { id: number }).id;

    const insProduct = db.prepare(`INSERT INTO products
      (id, slug, name, active_ingredient, manufacturer, presentation, description, image_alt, category_id, health_topic_id,
       price_cents, availability, regulatory_status, regulatory_justification, regulatory_source, regulatory_reviewer)
      VALUES (@id, @slug, @name, @active, @manufacturer, @presentation, @description, @image_alt, @category_id, @health_topic_id,
       @price, 'indisponivel', 'comercializacao_bloqueada', @justification, @source, 'Regra automática do sistema')`);

    const usedSlugs = new Set<string>();
    for (const p of PRODUCTS) {
      const manufacturer = p.name.includes("LanderGold") ? "LanderGold (informado)" : "Landerlan (informado)";
      let slug = slugify(`${p.name} ${p.presentation}`);
      while (usedSlugs.has(slug)) slug += "-2";
      usedSlugs.add(slug);
      const rules = matchHardRules({ name: p.name, active_ingredient: p.active, manufacturer });
      insProduct.run({
        id: randomId(),
        slug,
        name: p.name,
        active: p.active,
        manufacturer,
        presentation: p.presentation,
        description:
          "Dados informados para o cadastro inicial. Autenticidade, composição, procedência e registro sanitário não confirmados.",
        image_alt: `Imagem ilustrativa — ${p.name}`,
        category_id: catId(p.category),
        health_topic_id: topicId(p.topic),
        price: p.price,
        justification: rules.map((r) => `${r.title}: ${r.reason}`).join("\n\n"),
        source: rules.map((r) => r.source + (r.sourceUrl ? ` — ${r.sourceUrl}` : "")).join("\n"),
      });
    }

    db.prepare(
      "INSERT INTO audit_log (admin_email, action, entity, details) VALUES ('sistema', 'seed', 'products', ?)",
    ).run(JSON.stringify({ products: PRODUCTS.length, status: "comercializacao_bloqueada" }));

    db.prepare("INSERT INTO settings (key, value) VALUES ('seed_version', '1')").run();
  });
  tx();

  ensureInitialAdmin(db);
}

function ensureInitialAdmin(db: Database.Database) {
  const count = (db.prepare("SELECT COUNT(*) AS n FROM admins").get() as { n: number }).n;
  if (count > 0) return;
  const email = (process.env.ADMIN_EMAIL || "admin@goldpharma.local").toLowerCase();
  let password = process.env.ADMIN_PASSWORD;
  let generated = false;
  if (!password) {
    password = crypto.randomBytes(12).toString("base64url");
    generated = true;
  }
  const hash = bcrypt.hashSync(password, 12);
  db.prepare("INSERT INTO admins (email, name, password_hash, role) VALUES (?, ?, ?, 'admin')").run(
    email,
    "Administrador",
    hash,
  );
  if (generated && db.name !== ":memory:") {
    const file = path.join(path.dirname(db.name), "ADMIN_INITIAL_PASSWORD.txt");
    fs.writeFileSync(
      file,
      `E-mail: ${email}\nSenha inicial: ${password}\n\nAltere a senha em /admin/conta e apague este arquivo.\n`,
      { mode: 0o600 },
    );
    console.log(`[gold-pharma] Administrador inicial criado. Credenciais em ${file}`);
  }
}

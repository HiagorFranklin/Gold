"use client";
/* eslint-disable @next/next/no-img-element */

import { useActionState, useMemo, useState } from "react";
import { saveProductAction, type FormState } from "@/app/admin/actions";
import {
  COMMERCIAL_BLOCK_NOTICE,
  REGULATORY_STATUSES,
  REGULATORY_STATUS_LABELS,
  evaluateCompliance,
  matchHardRules,
  type RegulatoryStatus,
} from "@/lib/compliance";
import { parseBRL } from "@/lib/format";
import { Notice } from "./ui";
import { submitWithoutReset } from "@/lib/submit";

export type ProductFormValues = {
  id?: string;
  name: string;
  active_ingredient: string;
  manufacturer: string;
  presentation: string;
  description: string;
  image_url: string;
  image_alt: string;
  image_is_illustrative: boolean;
  category_id: string;
  health_topic_id: string;
  price: string;
  availability: string;
  regulatory_status: RegulatoryStatus;
  regulatory_justification: string;
  regulatory_source: string;
  regulatory_checked_at: string;
  regulatory_reviewer: string;
  anvisa_registration: string;
  reference_sources: string;
  info_reviewed_at: string;
  publish_info: boolean;
  show_price: boolean;
  commercially_available: boolean;
  whatsapp_orders: boolean;
  featured: boolean;
};

type Props = {
  values: ProductFormValues;
  categories: { id: number; name: string }[];
  topics: { id: number; title: string }[];
  canPrice: boolean;
  canRegulatory: boolean;
  canEdit: boolean;
};

export function ProductForm({ values, categories, topics, canPrice, canRegulatory, canEdit }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveProductAction, null);
  const [v, setV] = useState(values);
  const set = <K extends keyof ProductFormValues>(k: K, val: ProductFormValues[K]) => setV((s) => ({ ...s, [k]: val }));

  const rules = useMemo(() => matchHardRules(v), [v]);
  const preview = useMemo(() => {
    const price = parseBRL(v.price);
    return evaluateCompliance({
      ...v,
      price_cents: Number.isNaN(price) ? null : price,
    });
  }, [v]);
  const hardBlocked = rules.length > 0;

  const text = (k: keyof ProductFormValues, label: string, opts: { required?: boolean; type?: string; disabled?: boolean; hint?: string; placeholder?: string } = {}) => (
    <div>
      <label htmlFor={k} className="label-gp">
        {label}
        {opts.required && <span className="text-gold"> *</span>}
      </label>
      <input
        id={k}
        name={k}
        type={opts.type ?? "text"}
        required={opts.required}
        disabled={opts.disabled || !canEdit}
        placeholder={opts.placeholder}
        value={String(v[k] ?? "")}
        onChange={(e) => set(k, e.target.value as never)}
        className="input-gp disabled:opacity-60"
        aria-describedby={opts.hint ? `${k}-hint` : undefined}
      />
      {opts.hint && (
        <p id={`${k}-hint`} className="mt-1 text-xs text-mist-2">
          {opts.hint}
        </p>
      )}
    </div>
  );

  const check = (k: keyof ProductFormValues, label: string, disabled = false, hint?: string) => (
    <label className={`flex items-start gap-3 rounded-xl border border-line p-3 text-sm ${disabled ? "opacity-50" : ""}`}>
      <input
        type="checkbox"
        name={k}
        checked={Boolean(v[k])}
        disabled={disabled || !canEdit}
        onChange={(e) => set(k, e.target.checked as never)}
        className="mt-0.5 h-4 w-4 accent-[#D4AF37]"
      />
      <span>
        {label}
        {hint && <span className="block text-xs text-mist-2">{hint}</span>}
      </span>
    </label>
  );

  return (
    <form onSubmit={(e) => submitWithoutReset(e, action)} className="space-y-6">
      {v.id && <input type="hidden" name="id" value={v.id} />}

      {state?.errors && (
        <Notice kind="error">
          <p className="font-semibold">Não foi possível salvar:</p>
          <ul className="mt-1 list-disc pl-5">
            {state.errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </Notice>
      )}

      {hardBlocked && (
        <div className="rounded-2xl border border-red-400/40 bg-red-400/[0.07] p-5">
          <p className="font-semibold text-red-300">⛔ {COMMERCIAL_BLOCK_NOTICE}</p>
          <p className="mt-1 text-xs text-red-200/80">
            Proibição vigente aplicada automaticamente pelo servidor. Alterar o status não libera a exibição comercial; a regra só muda
            mediante revisão técnica com documentação oficial válida.
          </p>
          <ul className="mt-3 space-y-2 text-sm text-white/85">
            {rules.map((r) => (
              <li key={r.id}>
                <span className="font-semibold">{r.title}.</span> {r.reason}{" "}
                <span className="text-mist">
                  Fonte: {r.sourceUrl ? <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">{r.source}</a> : r.source}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <section className="card-gp grid gap-5 p-6 md:grid-cols-2">
        <h2 className="font-display text-2xl md:col-span-2">Identificação</h2>
        {text("name", "Nome comercial", { required: true })}
        {text("presentation", "Apresentação", { placeholder: "Ex.: 10 mL, 100 comprimidos" })}
        {text("active_ingredient", "Princípio ativo")}
        {text("manufacturer", "Fabricante informado", { hint: "Informado no cadastro; não confirma procedência." })}
        <div>
          <label htmlFor="category_id" className="label-gp">Categoria</label>
          <select id="category_id" name="category_id" value={v.category_id} disabled={!canEdit} onChange={(e) => set("category_id", e.target.value)} className="input-gp">
            <option value="">Sem categoria</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="health_topic_id" className="label-gp">Conteúdo educativo vinculado</label>
          <select id="health_topic_id" name="health_topic_id" value={v.health_topic_id} disabled={!canEdit} onChange={(e) => set("health_topic_id", e.target.value)} className="input-gp">
            <option value="">Nenhum (exibe “Informação não confirmada”)</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label htmlFor="description" className="label-gp">Descrição</label>
          <textarea id="description" name="description" rows={4} disabled={!canEdit} value={v.description} onChange={(e) => set("description", e.target.value)} className="input-gp" />
        </div>
      </section>

      <section className="card-gp grid gap-5 p-6 md:grid-cols-[200px_1fr]">
        <h2 className="font-display text-2xl md:col-span-2">Imagem</h2>
        <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-dashed border-white/15 bg-ink">
          {v.image_url ? <img src={v.image_url} alt={v.image_alt} className="h-full w-full object-cover" /> : <span className="px-4 text-center text-xs text-mist-2">Sem imagem (espaço reservado)</span>}
        </div>
        <div className="space-y-4">
          <div>
            <label htmlFor="image_file" className="label-gp">Enviar imagem autorizada (JPG, PNG, WebP · até 5 MB)</label>
            <input id="image_file" name="image_file" type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={!canEdit} className="input-gp file:mr-3 file:rounded-full file:border-0 file:bg-gold file:px-3 file:py-1 file:text-xs file:font-semibold file:text-ink" />
          </div>
          {text("image_url", "Ou URL https da imagem")}
          {text("image_alt", "Texto alternativo", { hint: "Descreva a imagem para leitores de tela." })}
          <div className="grid gap-3 sm:grid-cols-2">
            {check("image_is_illustrative", "Imagem ilustrativa", false, "Exibe o aviso de que não é a embalagem real.")}
            {v.image_url && check("remove_image" as keyof ProductFormValues, "Remover imagem atual")}
          </div>
        </div>
      </section>

      <section className="card-gp grid gap-5 p-6 md:grid-cols-3">
        <h2 className="font-display text-2xl md:col-span-3">Valor e disponibilidade</h2>
        {text("price", "Valor de referência (R$)", {
          disabled: !canPrice,
          placeholder: "165,00",
          hint: canPrice ? "Armazenado internamente. Exibição pública depende da situação regulatória." : "Somente administradores alteram valores.",
        })}
        <div>
          <label htmlFor="availability" className="label-gp">Disponibilidade cadastrada</label>
          <select id="availability" name="availability" value={v.availability} disabled={!canEdit} onChange={(e) => set("availability", e.target.value)} className="input-gp">
            <option value="indisponivel">Indisponível</option>
            <option value="sob_consulta">Sob consulta</option>
            <option value="disponivel">Disponível</option>
          </select>
        </div>
        {text("info_reviewed_at", "Data de revisão das informações", { type: "date" })}
        <div className="md:col-span-3">
          <label htmlFor="reference_sources" className="label-gp">Fontes de referência</label>
          <textarea
            id="reference_sources"
            name="reference_sources"
            rows={3}
            disabled={!canEdit}
            value={v.reference_sources}
            onChange={(e) => set("reference_sources", e.target.value)}
            className="input-gp font-mono text-xs"
            placeholder={"Uma por linha: Título | https://endereco"}
          />
        </div>
      </section>

      <section className="card-gp grid gap-5 p-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <h2 className="font-display text-2xl">Situação regulatória</h2>
          {!canRegulatory && <p className="mt-1 text-xs text-amber-200">Somente administradores alteram a situação regulatória e os controles de publicação.</p>}
        </div>
        <div>
          <label htmlFor="regulatory_status" className="label-gp">Status</label>
          <select
            id="regulatory_status"
            name="regulatory_status"
            value={v.regulatory_status}
            disabled={!canRegulatory}
            onChange={(e) => set("regulatory_status", e.target.value as RegulatoryStatus)}
            className="input-gp"
          >
            {REGULATORY_STATUSES.map((s) => (
              <option key={s} value={s} disabled={hardBlocked && (s === "regularidade_confirmada" || s === "divulgacao_restrita")}>
                {REGULATORY_STATUS_LABELS[s]}
                {hardBlocked && (s === "regularidade_confirmada" || s === "divulgacao_restrita") ? " (bloqueado por proibição vigente)" : ""}
              </option>
            ))}
          </select>
        </div>
        {text("anvisa_registration", "Nº de registro na Anvisa", { disabled: !canRegulatory, hint: "Obrigatório para confirmar a regularidade." })}
        {text("regulatory_checked_at", "Data da verificação", { type: "date", disabled: !canRegulatory })}
        {text("regulatory_reviewer", "Responsável pela revisão", { disabled: !canRegulatory })}
        <div className="md:col-span-2">
          <label htmlFor="regulatory_source" className="label-gp">Fonte oficial consultada</label>
          <textarea id="regulatory_source" name="regulatory_source" rows={2} disabled={!canRegulatory} value={v.regulatory_source} onChange={(e) => set("regulatory_source", e.target.value)} className="input-gp" />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="regulatory_justification" className="label-gp">Justificativa</label>
          <textarea id="regulatory_justification" name="regulatory_justification" rows={4} disabled={!canRegulatory} value={v.regulatory_justification} onChange={(e) => set("regulatory_justification", e.target.value)} className="input-gp" />
        </div>
      </section>

      <section className="card-gp p-6">
        <h2 className="font-display text-2xl">Controles de publicação</h2>
        <p className="mt-1 text-sm text-mist">
          Cada controle expressa a intenção do administrador. O servidor só libera o recurso quando a situação regulatória permite.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {check("publish_info", "Publicar ficha informativa", !canRegulatory || hardBlocked, "Exige “Regularidade confirmada” ou “Divulgação restrita”.")}
          {check("show_price", "Exibir preço ao público", !canRegulatory || hardBlocked, "Exige regularidade confirmada e documentada.")}
          {check("commercially_available", "Disponibilidade comercial", !canRegulatory || hardBlocked, "Exige regularidade confirmada e documentada.")}
          {check("whatsapp_orders", "Permitir consulta/pedido via WhatsApp", !canRegulatory || hardBlocked, "Exige disponibilidade comercial liberada.")}
          {check("featured", "Destacar na página inicial", false, "Só aparece se a ficha estiver publicada.")}
        </div>
        <div className="mt-6 rounded-xl border border-line bg-ink/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-mist">Resultado público com os dados atuais</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {[
              ["Ficha pública", preview.effective.publicListing],
              ["Preço", preview.effective.price],
              ["Disponibilidade", preview.effective.availability],
              ["Pedido WhatsApp", preview.effective.whatsappOrder],
            ].map(([label, on]) => (
              <span key={String(label)} className={`rounded-full px-3 py-1 font-semibold ${on ? "bg-emerald-400/15 text-emerald-300" : "bg-white/5 text-mist-2"}`}>
                {label}: {on ? "liberado" : "bloqueado"}
              </span>
            ))}
          </div>
          {preview.denials.length > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-amber-100/90">
              {preview.denials.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {canEdit && (
        <div className="sticky bottom-4 z-10 flex justify-end">
          <button className="btn-gold shadow-card" disabled={pending}>
            {pending ? "Salvando…" : "Salvar produto"}
          </button>
        </div>
      )}
    </form>
  );
}

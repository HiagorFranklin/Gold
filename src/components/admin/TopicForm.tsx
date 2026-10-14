import type { HealthTopic } from "@/lib/data";
import { sourcesToText } from "@/lib/format";
import { saveTopicAction } from "@/app/admin/actions";
import { ActionForm } from "./ActionForm";

const FIELDS: [keyof HealthTopic, string, number][] = [
  ["summary", "Resumo / aviso inicial", 2],
  ["medical_indications", "Indicações médicas reconhecidas", 3],
  ["therapeutic_benefits", "Benefícios terapêuticos documentados", 3],
  ["aesthetic_note", "Efeitos procurados para estética ou desempenho (diferenciar de benefício médico)", 3],
  ["adverse_effects", "Efeitos adversos comuns", 3],
  ["serious_risks", "Riscos graves", 3],
  ["contraindications", "Contraindicações", 3],
  ["precautions", "Precauções", 3],
  ["interactions", "Interações relevantes", 3],
];

export function TopicForm({ topic, canPublish }: { topic: HealthTopic | null; canPublish: boolean }) {
  return (
    <ActionForm action={saveTopicAction} submitLabel="Salvar ficha">
      {topic && <input type="hidden" name="id" value={topic.id} />}
      <input type="hidden" name="was_published" value={topic?.published ? "1" : "0"} />
      <div className="card-gp grid gap-4 p-6 md:grid-cols-2">
        <div>
          <label htmlFor="title" className="label-gp">Título</label>
          <input id="title" name="title" required defaultValue={topic?.title} className="input-gp" />
        </div>
        <div>
          <label htmlFor="active_ingredients" className="label-gp">Princípios ativos (separados por vírgula)</label>
          <input id="active_ingredients" name="active_ingredients" defaultValue={topic?.active_ingredients} className="input-gp" />
        </div>
        {FIELDS.map(([k, label, rows]) => (
          <div key={k} className="md:col-span-2">
            <label htmlFor={k} className="label-gp">{label}</label>
            <textarea id={k} name={k} rows={rows} defaultValue={String(topic?.[k] ?? "")} className="input-gp" placeholder="Vazio = “Informação não confirmada”" />
          </div>
        ))}
        <div className="md:col-span-2">
          <label htmlFor="sources" className="label-gp">Fontes consultadas (uma por linha: Título | https://…)</label>
          <textarea id="sources" name="sources" rows={4} defaultValue={sourcesToText(topic?.sources)} className="input-gp font-mono text-xs" />
        </div>
      </div>
      <div className="card-gp grid gap-4 p-6 md:grid-cols-3">
        <div>
          <label htmlFor="review_status" className="label-gp">Estado da revisão</label>
          <select id="review_status" name="review_status" defaultValue={topic?.review_status ?? "preliminar"} className="input-gp">
            <option value="preliminar">Preliminar (revisão pendente)</option>
            <option value="revisado">Revisado por profissional</option>
          </select>
        </div>
        <div>
          <label htmlFor="reviewed_at" className="label-gp">Data da revisão</label>
          <input id="reviewed_at" name="reviewed_at" type="date" defaultValue={topic?.reviewed_at ?? ""} className="input-gp" />
        </div>
        <div>
          <label htmlFor="reviewed_by" className="label-gp">Revisado por</label>
          <input id="reviewed_by" name="reviewed_by" defaultValue={topic?.reviewed_by ?? ""} className="input-gp" placeholder="Nome e registro profissional" />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="image_file" className="label-gp">Imagem científica (opcional)</label>
          <input id="image_file" name="image_file" type="file" accept="image/jpeg,image/png,image/webp" className="input-gp" />
          {topic?.image_url && (
            <label className="mt-2 flex items-center gap-2 text-xs text-mist">
              <input type="checkbox" name="remove_image" className="accent-[#D4AF37]" /> Remover imagem atual
            </label>
          )}
        </div>
        <label className={`flex items-center gap-3 self-end rounded-xl border border-line p-3 text-sm ${canPublish ? "" : "opacity-50"}`}>
          <input type="checkbox" name="published" defaultChecked={!!topic?.published} disabled={!canPublish} className="h-4 w-4 accent-[#D4AF37]" />
          Publicado no site
          {!canPublish && topic?.published ? <input type="hidden" name="published" value="on" /> : null}
        </label>
      </div>
      <p className="text-xs text-mist-2">Não inclua dosagens, ciclos, combinações ou protocolos de uso. O servidor rejeita esse tipo de conteúdo.</p>
    </ActionForm>
  );
}

import type { HealthTopic } from "@/lib/data";
import { formatDate, parseSources } from "@/lib/format";

const NOT_CONFIRMED = "Informação não confirmada";

const SECTIONS: { key: keyof HealthTopic; title: string }[] = [
  { key: "medical_indications", title: "Indicações médicas reconhecidas" },
  { key: "therapeutic_benefits", title: "Benefícios terapêuticos documentados" },
  { key: "aesthetic_note", title: "Efeitos procurados para estética ou desempenho" },
  { key: "adverse_effects", title: "Efeitos adversos comuns" },
  { key: "serious_risks", title: "Riscos graves" },
  { key: "contraindications", title: "Contraindicações" },
  { key: "precautions", title: "Precauções" },
  { key: "interactions", title: "Interações relevantes" },
];

export function ReviewBadge({ topic }: { topic: Pick<HealthTopic, "review_status" | "reviewed_at"> }) {
  return topic.review_status === "revisado" ? (
    <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
      Revisado em {formatDate(topic.reviewed_at)}
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-200">
      Conteúdo preliminar · revisão profissional pendente
    </span>
  );
}

export function HealthInfo({ topic, headingLevel = 2 }: { topic: HealthTopic | null; headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? "h2" : "h3";
  const Sub = headingLevel === 2 ? "h3" : "h4";
  if (!topic) {
    return (
      <section aria-labelledby="info-saude" className="card-gp p-6 md:p-8">
        <H id="info-saude" className="font-display text-3xl font-semibold">
          Informações de Saúde
        </H>
        <p className="mt-4 text-mist">{NOT_CONFIRMED}.</p>
      </section>
    );
  }
  const sources = parseSources(topic.sources);
  return (
    <section aria-labelledby="info-saude" className="card-gp p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <H id="info-saude" className="font-display text-3xl font-semibold">
          Informações de Saúde
        </H>
        <ReviewBadge topic={topic} />
      </div>
      {topic.summary && <p className="mt-4 text-sm leading-relaxed text-mist">{topic.summary}</p>}
      <dl className="mt-8 grid gap-x-10 gap-y-7 md:grid-cols-2">
        {SECTIONS.map((s) => {
          const value = String(topic[s.key] ?? "").trim();
          return (
            <div key={s.key} className="border-l border-gold/30 pl-5">
              <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">{s.title}</dt>
              <dd className={`mt-2 whitespace-pre-line text-sm leading-relaxed ${value ? "text-white/85" : "italic text-mist-2"}`}>
                {value || NOT_CONFIRMED}
              </dd>
            </div>
          );
        })}
      </dl>
      <div className="mt-10 grid gap-6 border-t border-line pt-6 md:grid-cols-[2fr_1fr]">
        <div>
          <Sub className="text-xs font-semibold uppercase tracking-[0.16em] text-mist">Fontes consultadas</Sub>
          {sources.length ? (
            <ul className="mt-3 space-y-1.5 text-sm">
              {sources.map((s, i) => (
                <li key={i}>
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-gold/90 underline-offset-4 hover:underline">
                      {s.label}
                    </a>
                  ) : (
                    <span className="text-mist">{s.label}</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm italic text-mist-2">{NOT_CONFIRMED}</p>
          )}
        </div>
        <div>
          <Sub className="text-xs font-semibold uppercase tracking-[0.16em] text-mist">Última revisão</Sub>
          <p className="mt-3 text-sm text-white/85">{formatDate(topic.reviewed_at)}</p>
        </div>
      </div>
      <p className="mt-8 rounded-xl border border-line bg-ink/60 p-4 text-xs leading-relaxed text-mist">
        Conteúdo exclusivamente educativo. Não recomendamos ciclos, dosagens, combinações ou protocolos. O uso de qualquer
        medicamento deve ocorrer somente com prescrição e acompanhamento médico. Em caso de efeito adverso, procure
        atendimento de saúde.
      </p>
    </section>
  );
}

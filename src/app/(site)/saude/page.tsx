import type { Metadata } from "next";
import Link from "next/link";
import { listPublishedTopics } from "@/lib/data";
import { getSiteContext } from "@/lib/site";
import { PageHero, SectionHeading } from "@/components/site/PageHero";
import { SceneImage } from "@/components/site/SceneImage";
import { ReviewBadge } from "@/components/site/HealthInfo";

export const metadata: Metadata = {
  title: "Informações de saúde",
  description: "Conteúdo educativo sobre saúde hormonal: indicações reconhecidas, efeitos adversos, riscos e fontes.",
};

const BASICS = [
  {
    title: "O sistema endócrino",
    text: "Glândulas como hipófise, tireoide, suprarrenais e gônadas produzem hormônios que regulam metabolismo, crescimento, fertilidade, humor e composição corporal.",
  },
  {
    title: "Eixo hormonal e supressão",
    text: "O organismo controla a própria produção hormonal por retroalimentação. Hormônios externos podem suprimir essa produção, com impacto sobre a fertilidade e a recuperação do eixo.",
  },
  {
    title: "Indicação médica × uso estético",
    text: "Indicações terapêuticas são reconhecidas para condições clínicas específicas, com diagnóstico e acompanhamento. Ganho estético ou de desempenho não é indicação médica.",
  },
  {
    title: "Monitoramento e segurança",
    text: "Tratamentos hormonais prescritos exigem acompanhamento com exames periódicos. Sinais como dor no peito, falta de ar, icterícia ou alterações de humor exigem atendimento imediato.",
  },
];

export default function HealthPage() {
  const { settings } = getSiteContext();
  const topics = listPublishedTopics();
  return (
    <>
      <PageHero
        eyebrow="Saúde hormonal"
        title="Informação antes de qualquer decisão"
        intro="Conteúdo educativo sobre princípios ativos, benefícios terapêuticos reconhecidos, efeitos adversos e riscos. Não recomendamos ciclos, dosagens ou protocolos."
        variant="endocrine"
        image={settings.science_image_url}
        imageAlt={settings.science_image_alt}
      />

      <section className="container-gp grid gap-6 py-16 md:grid-cols-2 lg:grid-cols-4">
        {BASICS.map((b) => (
          <article key={b.title} className="card-gp p-6">
            <div className="h-px w-10 bg-gold" />
            <h2 className="mt-5 font-display text-2xl font-semibold">{b.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-mist">{b.text}</p>
          </article>
        ))}
      </section>

      <section className="container-gp py-10">
        <SectionHeading
          eyebrow="Fichas educativas"
          title="Princípios ativos"
          intro="Cada ficha diferencia indicações médicas de efeitos procurados para estética e indica as fontes e a data de revisão. Quando faltam evidências, exibimos “Informação não confirmada”."
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((t, i) => (
            <Link key={t.id} href={`/saude/${t.slug}`} className="card-gp card-gp-hover group flex flex-col overflow-hidden">
              <SceneImage
                src={t.image_url}
                alt={`Ilustração científica — ${t.title}`}
                variant={i % 2 ? "endocrine" : "science"}
                overlay="bottom"
                className="aspect-[16/9]"
              />
              <div className="flex flex-1 flex-col p-6">
                <h3 className="font-display text-2xl font-semibold leading-tight">{t.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-mist">{t.adverse_effects}</p>
                <div className="mt-auto flex items-center justify-between pt-5">
                  <ReviewBadge topic={t} />
                  <span className="text-xs font-semibold text-gold transition group-hover:translate-x-1">Ler →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        {topics.length === 0 && <p className="mt-10 text-mist">Nenhuma ficha publicada no momento.</p>}
      </section>
    </>
  );
}

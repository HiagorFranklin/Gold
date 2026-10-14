import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedTopic } from "@/lib/data";
import { HealthInfo } from "@/components/site/HealthInfo";
import { SceneImage } from "@/components/site/SceneImage";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const t = getPublishedTopic(slug);
  return t ? { title: t.title, description: `Informações educativas sobre ${t.title}: efeitos adversos, riscos e fontes.` } : { title: "Conteúdo não encontrado" };
}

export default async function TopicPage({ params }: Params) {
  const { slug } = await params;
  const topic = getPublishedTopic(slug);
  if (!topic) notFound();
  return (
    <div className="container-gp pb-10 pt-32">
      <nav aria-label="Trilha" className="text-xs text-mist">
        <Link href="/saude" className="hover:text-gold">
          Saúde
        </Link>
        <span className="mx-2 text-mist-2">/</span>
        <span className="text-white/80">{topic.title}</span>
      </nav>
      <div className="mt-8 grid items-end gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="eyebrow">Ficha educativa</p>
          <h1 className="heading-display mt-3 text-5xl md:text-6xl">{topic.title}</h1>
        </div>
        <SceneImage src={topic.image_url} alt={`Ilustração científica — ${topic.title}`} variant="science" className="aspect-[16/9] rounded-2xl border border-line" />
      </div>
      <div className="mt-12">
        <HealthInfo topic={topic} />
      </div>
    </div>
  );
}

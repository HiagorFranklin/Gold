import Link from "next/link";
import { listCategories, listPublicProducts, listPublishedTopics } from "@/lib/data";
import { getSiteContext } from "@/lib/site";
import { SceneImage } from "@/components/site/SceneImage";
import { SectionHeading } from "@/components/site/PageHero";
import { ProductCard } from "@/components/site/ProductCard";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { ArrowIcon, BookIcon, FlaskIcon, HeartPulseIcon, ShieldIcon } from "@/components/site/icons";

export default function HomePage() {
  const { settings, whatsappHref } = getSiteContext();
  const products = listPublicProducts();
  const featured = products.filter((p) => p.featured).slice(0, 4);
  const categories = listCategories();
  const topics = listPublishedTopics();
  const countByCategory = (slug: string) => products.filter((p) => p.category_slug === slug).length;

  return (
    <>
      {/* Banner principal */}
      <section className="relative isolate flex min-h-[92svh] items-end overflow-hidden md:items-center">
        <SceneImage
          src={settings.hero_image_url}
          alt={settings.hero_image_alt}
          variant="gym"
          overlay="strong"
          priority
          zoom={false}
          className="animate-slow-zoom absolute inset-0 -z-10"
        />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-ink to-transparent" />
        <div className="container-gp pb-20 pt-32 md:pb-0">
          <p className="eyebrow animate-fade-up">Ciência · Treino · Saúde</p>
          <h1 className="heading-display animate-fade-up delay-1 mt-5 text-6xl tracking-[0.06em] sm:text-7xl md:text-8xl lg:text-9xl">
            <span className="gold-text">{settings.hero_title}</span>
          </h1>
          <p className="animate-fade-up delay-2 mt-6 max-w-xl text-lg leading-relaxed text-white/80 md:text-xl">
            {settings.hero_subtitle}
          </p>
          <div className="animate-fade-up delay-3 mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/catalogo" className="btn-gold">
              Explorar catálogo <ArrowIcon />
            </Link>
            <Link href="/sobre" className="btn-ghost">
              Conhecer a Gold Pharma
            </Link>
            <WhatsAppButton href={whatsappHref} variant="outline" />
          </div>
        </div>
      </section>

      {/* Pilares */}
      <section className="border-y border-line bg-graphite/40">
        <div className="container-gp grid gap-px sm:grid-cols-3">
          {[
            { icon: <FlaskIcon />, title: "Base científica", text: "Conteúdo apoiado em fontes reconhecidas." },
            { icon: <ShieldIcon />, title: "Conformidade sanitária", text: "Publicação condicionada à regularidade." },
            { icon: <BookIcon />, title: "Informação clara", text: "Riscos e limites explicados sem exageros." },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-4 py-7 sm:px-6">
              <span className="mt-0.5 text-gold">{item.icon}</span>
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="mt-1 text-sm text-mist">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Produtos em destaque — somente quando a divulgação for permitida */}
      {featured.length > 0 && (
        <section className="container-gp py-24">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <SectionHeading eyebrow="Destaques" title="Produtos em destaque" />
            <Link href="/catalogo" className="btn-outline self-start md:self-auto">
              Ver catálogo completo
            </Link>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Categorias */}
      <section className="container-gp py-24">
        <SectionHeading
          eyebrow="Catálogo"
          title="Categorias"
          intro="Navegue pelas linhas do catálogo. A exibição de cada item depende da verificação da sua situação regulatória."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c, i) => {
            const n = countByCategory(c.slug);
            return (
              <Link
                key={c.id}
                href={`/catalogo?categoria=${c.slug}`}
                className="card-gp card-gp-hover group relative flex min-h-56 flex-col justify-end overflow-hidden p-6"
              >
                <SceneImage
                  src={c.image_url}
                  alt={c.name}
                  variant={(["lab", "science", "nutrition", "recovery"] as const)[i % 4]}
                  overlay="bottom"
                  className="absolute inset-0 -z-0 opacity-70"
                />
                <div className="relative">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-gold/80">
                    {n > 0 ? `${n} ${n === 1 ? "item" : "itens"}` : "Em atualização"}
                  </p>
                  <h3 className="mt-2 font-display text-2xl font-semibold leading-tight">{c.name}</h3>
                  <p className="mt-2 text-sm text-mist">{c.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Treinamento e musculação */}
      <section className="relative overflow-hidden py-24">
        <div className="container-gp">
          <SectionHeading
            eyebrow="Treinamento"
            title="Força se constrói com método"
            intro="Resultados sustentáveis dependem de treino bem planejado, alimentação adequada, descanso e acompanhamento profissional. Não existem atalhos seguros."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                img: settings.training_image_url,
                alt: settings.training_image_alt,
                variant: "gym" as const,
                title: "Treino de força",
                text: "Progressão gradual de cargas, técnica correta e orientação de profissional de educação física.",
              },
              {
                img: settings.recovery_image_url,
                alt: settings.recovery_image_alt,
                variant: "recovery" as const,
                title: "Recuperação e descanso",
                text: "Sono de qualidade e pausas entre sessões fazem parte do treino e reduzem o risco de lesões.",
              },
              {
                img: settings.nutrition_image_url,
                alt: settings.nutrition_image_alt,
                variant: "nutrition" as const,
                title: "Nutrição e hábitos",
                text: "Alimentação equilibrada, hidratação e acompanhamento nutricional sustentam a rotina de treinos.",
              },
            ].map((card) => (
              <article key={card.title} className="card-gp group overflow-hidden">
                <SceneImage src={card.img} alt={card.alt} variant={card.variant} overlay="bottom" className="aspect-[4/5]" />
                <div className="-mt-28 relative p-6">
                  <h3 className="font-display text-3xl font-semibold">{card.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-mist">{card.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Saúde hormonal */}
      <section className="border-y border-line bg-graphite/40 py-24">
        <div className="container-gp grid items-center gap-12 lg:grid-cols-2">
          <SceneImage
            src={settings.science_image_url}
            alt={settings.science_image_alt}
            variant="science"
            overlay="soft"
            className="aspect-[4/3] rounded-2xl border border-line"
          />
          <div>
            <SectionHeading
              eyebrow="Saúde hormonal"
              title="Entenda o sistema endócrino antes de qualquer decisão"
              intro="Hormônios regulam metabolismo, fertilidade, humor e composição corporal. Alterações provocadas sem indicação médica podem causar efeitos sérios e, às vezes, irreversíveis."
            />
            <ul className="mt-8 space-y-4">
              {[
                "Diferença entre indicação médica reconhecida e uso estético",
                "Efeitos adversos, riscos graves e contraindicações por princípio ativo",
                "Fontes consultadas e data de revisão em cada ficha",
              ].map((t) => (
                <li key={t} className="flex gap-3 text-sm text-white/85">
                  <HeartPulseIcon className="h-5 w-5 shrink-0 text-gold" />
                  {t}
                </li>
              ))}
            </ul>
            <Link href="/saude" className="btn-outline mt-10">
              Acessar conteúdo educativo ({topics.length} {topics.length === 1 ? "ficha" : "fichas"})
            </Link>
          </div>
        </div>
      </section>

      {/* Institucional */}
      <section className="container-gp grid items-center gap-12 py-24 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <SectionHeading eyebrow="A Gold Pharma" title={settings.about_title} />
          <div className="prose-gp mt-6">
            {settings.about_text.split("\n\n").slice(0, 2).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <Link href="/sobre" className="btn-ghost mt-4">
            Conhecer a Gold Pharma
          </Link>
        </div>
        <SceneImage
          src={settings.about_image_url}
          alt={settings.about_image_alt}
          variant="brand"
          overlay="soft"
          className="aspect-square rounded-2xl border border-line lg:aspect-[4/5]"
        />
      </section>

      {/* Contato */}
      <section className="container-gp">
        <div className="relative overflow-hidden rounded-3xl border border-gold/25 bg-gradient-to-br from-graphite via-ink to-graphite p-10 md:p-16">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold/15 blur-3xl" />
          <div className="relative grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-center">
            <div>
              <p className="eyebrow">Atendimento</p>
              <h2 className="heading-display mt-3 text-4xl md:text-5xl">Fale com a Gold Pharma</h2>
              <p className="mt-4 max-w-xl text-mist">
                Tire dúvidas sobre o atendimento e o catálogo. Você revisa a mensagem antes de enviar. Não compartilhe
                informações médicas sensíveis pelo chat.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <WhatsAppButton href={whatsappHref} />
              <Link href="/contato" className="btn-ghost">
                Outras formas de contato
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

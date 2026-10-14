import { SceneImage, type SceneVariant } from "./SceneImage";

export function PageHero({
  eyebrow,
  title,
  intro,
  variant,
  image,
  imageAlt,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  variant: SceneVariant;
  image?: string | null;
  imageAlt: string;
}) {
  return (
    <section className="relative isolate overflow-hidden border-b border-line">
      <SceneImage src={image} alt={imageAlt} variant={variant} overlay="strong" className="absolute inset-0 -z-10" zoom={false} />
      <div className="container-gp pb-16 pt-40 md:pb-20 md:pt-48">
        <p className="eyebrow animate-fade-up">{eyebrow}</p>
        <h1 className="heading-display animate-fade-up delay-1 mt-4 max-w-3xl text-5xl md:text-6xl">{title}</h1>
        {intro && <p className="animate-fade-up delay-2 mt-5 max-w-2xl text-base leading-relaxed text-mist md:text-lg">{intro}</p>}
      </div>
    </section>
  );
}

export function SectionHeading({ eyebrow, title, intro, align = "left" }: { eyebrow: string; title: string; intro?: string; align?: "left" | "center" }) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="heading-display mt-3 text-4xl md:text-5xl">{title}</h2>
      {intro && <p className="mt-4 leading-relaxed text-mist">{intro}</p>}
    </div>
  );
}

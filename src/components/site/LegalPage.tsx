import { getSiteContext } from "@/lib/site";

export function LegalPage({ settingKey, title }: { settingKey: string; title: string }) {
  const { settings } = getSiteContext();
  const blocks = (settings[settingKey] ?? "").split("\n\n").filter(Boolean);
  return (
    <div className="container-gp max-w-3xl pb-10 pt-36">
      <p className="eyebrow">Institucional</p>
      <h1 className="heading-display mt-3 text-5xl">{title}</h1>
      <div className="mt-10 space-y-6">
        {blocks.map((b, i) => {
          const [first, ...rest] = b.split("\n");
          const isHeading = rest.length > 0 && first.length < 80;
          return (
            <div key={i}>
              {isHeading ? (
                <>
                  <h2 className="font-display text-2xl font-semibold text-white">{first}</h2>
                  <p className="mt-2 whitespace-pre-line leading-relaxed text-mist">{rest.join("\n")}</p>
                </>
              ) : (
                <p className="whitespace-pre-line leading-relaxed text-mist">{b}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

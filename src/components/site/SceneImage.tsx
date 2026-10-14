/* eslint-disable @next/next/no-img-element */
export type SceneVariant = "gym" | "science" | "recovery" | "nutrition" | "endocrine" | "lab" | "brand" | "product";

type Props = {
  src?: string | null;
  alt: string;
  variant: SceneVariant;
  className?: string;
  overlay?: "none" | "soft" | "strong" | "bottom";
  priority?: boolean;
  zoom?: boolean;
};

const OVERLAYS = {
  none: "",
  soft: "bg-ink/30",
  strong: "bg-gradient-to-r from-ink via-ink/80 to-ink/20",
  bottom: "bg-gradient-to-t from-ink via-ink/40 to-transparent",
};

/**
 * Imagem com tratamento cinematográfico. Quando nenhuma fotografia
 * autorizada foi cadastrada no painel, exibe uma composição gráfica
 * própria (espaço reservado), sem simular fotografia real.
 */
export function SceneImage({ src, alt, variant, className = "", overlay = "soft", priority, zoom = true }: Props) {
  return (
    <div className={`relative overflow-hidden bg-graphite ${zoom ? "group/scene" : ""} ${className}`}>
      {src ? (
        <img
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          className={`absolute inset-0 h-full w-full object-cover transition duration-[1400ms] ease-out ${
            zoom ? "group-hover/scene:scale-[1.04] group-hover:scale-[1.04]" : ""
          }`}
        />
      ) : (
        <div role="img" aria-label={alt} className="absolute inset-0">
          <SceneArt variant={variant} />
        </div>
      )}
      {overlay !== "none" && <div className={`pointer-events-none absolute inset-0 ${OVERLAYS[overlay]}`} />}
    </div>
  );
}

function SceneArt({ variant }: { variant: SceneVariant }) {
  return (
    <div className="grain absolute inset-0 overflow-hidden bg-[radial-gradient(120%_90%_at_70%_10%,#2a2412_0%,#141414_45%,#0a0a0a_100%)]">
      <div className="animate-beam absolute -top-1/3 right-[12%] h-[160%] w-[38%] rotate-[18deg] bg-gradient-to-b from-gold/25 via-gold/5 to-transparent blur-2xl" />
      <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
      <svg
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`g-${variant}`} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#F3DC8A" stopOpacity=".9" />
            <stop offset="1" stopColor="#9C7F22" stopOpacity=".5" />
          </linearGradient>
        </defs>
        <g fill="none" stroke={`url(#g-${variant})`} strokeWidth="1.2" opacity=".75">
          {ART[variant]}
        </g>
      </svg>
    </div>
  );
}

function hexagon(cx: number, cy: number, r: number) {
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i + Math.PI / 6;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  });
  return <polygon points={pts.join(" ")} />;
}

const steroidCore = (x: number, y: number, r: number) => (
  <g>
    {hexagon(x, y, r)}
    {hexagon(x + r * 1.732, y, r)}
    {hexagon(x + r * 2.598, y - r * 1.5, r)}
    <polygon
      points={`${x + r * 3.464},${y} ${x + r * 4.33},${y - r * 0.5} ${x + r * 4.6},${y + r * 0.45} ${x + r * 3.9},${y + r * 1.1} ${x + r * 3.464},${y + r}`}
    />
    <circle cx={x - r * 0.866} cy={y + r * 1.4} r="3" fill="#D4AF37" stroke="none" />
    <circle cx={x + r * 4.6} cy={y - r * 1.2} r="3" fill="#D4AF37" stroke="none" />
  </g>
);

const ART: Record<SceneVariant, React.ReactNode> = {
  gym: (
    <g>
      <line x1="40" y1="190" x2="360" y2="190" strokeWidth="3" />
      {[70, 86, 100].map((x, i) => (
        <rect key={x} x={x} y={190 - (60 - i * 12)} width="10" height={(60 - i * 12) * 2} rx="3" />
      ))}
      {[290, 304, 320].map((x, i) => (
        <rect key={x} x={x} y={190 - (36 + i * 12)} width="10" height={(36 + i * 12) * 2} rx="3" />
      ))}
      <line x1="0" y1="262" x2="400" y2="262" opacity=".4" />
      <line x1="0" y1="276" x2="400" y2="276" opacity=".2" />
    </g>
  ),
  science: <g transform="translate(110 150)">{steroidCore(0, 0, 34)}</g>,
  endocrine: (
    <g>
      {[
        [200, 60],
        [170, 120],
        [230, 120],
        [200, 175],
        [150, 220],
        [250, 220],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === 0 ? 14 : 9} />
      ))}
      <path d="M200 74 170 111M200 74 230 111M170 129 200 166M230 129 200 166M200 184 150 211M200 184 250 211" opacity=".6" />
      <circle cx="200" cy="150" r="118" opacity=".18" />
    </g>
  ),
  lab: (
    <g>
      <path d="M170 60h60M180 60v70l-45 90a12 12 0 0 0 11 17h108a12 12 0 0 0 11-17l-45-90V60" />
      <path d="M150 200h100" opacity=".6" />
      <circle cx="190" cy="215" r="5" />
      <circle cx="215" cy="225" r="3" />
      <g transform="translate(270 70) scale(.5)">{steroidCore(0, 0, 30)}</g>
    </g>
  ),
  recovery: (
    <g>
      <path d="M20 170h90l20-45 30 95 25-70 18 20h177" strokeWidth="1.6" />
      <circle cx="300" cy="100" r="40" opacity=".5" />
      <circle cx="300" cy="100" r="62" opacity=".25" />
    </g>
  ),
  nutrition: (
    <g>
      <circle cx="200" cy="155" r="80" />
      <circle cx="200" cy="155" r="58" opacity=".5" />
      <path d="M200 97c18 18 18 40 0 58-18-18-18-40 0-58Z" />
      <path d="M200 155v40" />
      <line x1="95" y1="90" x2="95" y2="230" />
      <line x1="305" y1="90" x2="305" y2="230" />
      <path d="M298 90v30a7 7 0 0 0 14 0V90" />
    </g>
  ),
  brand: (
    <g>
      {hexagon(200, 150, 90)}
      {hexagon(200, 150, 70)}
      <circle cx="200" cy="150" r="120" opacity=".15" />
    </g>
  ),
  product: (
    <g>
      {hexagon(200, 150, 70)}
      <text
        x="200"
        y="162"
        textAnchor="middle"
        fontSize="34"
        fontFamily="var(--font-cormorant), serif"
        fill="#D4AF37"
        stroke="none"
        opacity=".8"
      >
        GP
      </text>
    </g>
  ),
};

import Link from "next/link";

export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="gp-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F3DC8A" />
          <stop offset="0.5" stopColor="#D4AF37" />
          <stop offset="1" stopColor="#9C7F22" />
        </linearGradient>
      </defs>
      <path d="M24 2.5 42.6 13.25v21.5L24 45.5 5.4 34.75v-21.5Z" fill="none" stroke="url(#gp-gold)" strokeWidth="1.6" />
      <path d="M24 8.5 37.4 16.25v15.5L24 39.5 10.6 31.75v-15.5Z" fill="none" stroke="url(#gp-gold)" strokeOpacity=".35" strokeWidth=".8" />
      <text
        x="24"
        y="29.5"
        textAnchor="middle"
        fontFamily="var(--font-cormorant), serif"
        fontWeight="700"
        fontSize="15"
        letterSpacing=".5"
        fill="url(#gp-gold)"
      >
        GP
      </text>
    </svg>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group flex items-center gap-3" aria-label="Gold Pharma — página inicial">
      <LogoMark className="h-10 w-10 transition duration-500 group-hover:rotate-[30deg]" />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-xl font-bold tracking-[0.22em] text-white">GOLD</span>
          <span className="mt-0.5 text-[10px] font-semibold tracking-[0.55em] text-gold">PHARMA</span>
        </span>
      )}
    </Link>
  );
}

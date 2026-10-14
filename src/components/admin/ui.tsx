import { COMMERCIAL_BLOCK_NOTICE, REGULATORY_STATUS_LABELS, type RegulatoryStatus } from "@/lib/compliance";

const STATUS_STYLE: Record<RegulatoryStatus, string> = {
  pendente_verificacao: "border-amber-300/30 bg-amber-300/10 text-amber-200",
  em_analise: "border-sky-300/30 bg-sky-300/10 text-sky-200",
  regularidade_confirmada: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  divulgacao_restrita: "border-violet-300/30 bg-violet-300/10 text-violet-200",
  comercializacao_bloqueada: "border-red-400/30 bg-red-400/10 text-red-300",
};

export function StatusBadge({ status }: { status: RegulatoryStatus }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[status]}`}>
      {REGULATORY_STATUS_LABELS[status]}
    </span>
  );
}

export function BlockNotice({ className = "" }: { className?: string }) {
  return (
    <p className={`inline-flex items-center gap-1.5 text-[11px] font-semibold text-red-300 ${className}`}>
      <span aria-hidden="true">⛔</span> {COMMERCIAL_BLOCK_NOTICE}
    </p>
  );
}

export function Flag({ on, label }: { on: boolean; label: string }) {
  return (
    <span
      title={label}
      className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold ${on ? "bg-emerald-400/15 text-emerald-300" : "bg-white/5 text-mist-2"}`}
    >
      {label}
    </span>
  );
}

export function PageTitle({ title, intro, children }: { title: string; intro?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <h1 className="heading-display text-4xl">{title}</h1>
        {intro && <p className="mt-2 max-w-2xl text-sm text-mist">{intro}</p>}
      </div>
      {children}
    </div>
  );
}

export function Notice({ kind = "info", children }: { kind?: "info" | "error" | "success" | "warn"; children: React.ReactNode }) {
  const cls = {
    info: "border-sky-300/25 bg-sky-300/5 text-sky-100",
    error: "border-red-400/30 bg-red-400/10 text-red-200",
    success: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
    warn: "border-amber-300/30 bg-amber-300/10 text-amber-100",
  }[kind];
  return (
    <div role={kind === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm ${cls}`}>
      {children}
    </div>
  );
}

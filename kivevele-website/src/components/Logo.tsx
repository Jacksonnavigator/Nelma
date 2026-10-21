export default function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <svg viewBox="0 0 64 64" className="h-11 w-11 shrink-0" aria-hidden="true">
        <rect width="64" height="64" rx="16" fill={dark ? "#071E24" : "rgba(255,255,255,.08)"} stroke="rgba(255,255,255,.18)" />
        <circle cx="32" cy="37" r="11" fill="#F7931E" />
        <path d="M10 47a22 22 0 0 1 44 0" fill="none" stroke="#3FB8AF" strokeWidth="4" strokeLinecap="round" />
      </svg>
      <span className="leading-tight">
        <span className={`block font-display text-lg font-semibold ${dark ? "text-ink" : "text-white"}`}>Prof. Thomas Kivevele</span>
        <span className={`block text-xs font-medium ${dark ? "text-slate-600" : "text-white/65"}`}>Sustainable Energy Engineering</span>
      </span>
    </span>
  );
}

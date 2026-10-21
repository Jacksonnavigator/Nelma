import { useEffect, useRef, useState, type ReactNode, type ElementType } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Plus } from "lucide-react";

export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: ElementType;
}) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref} className={`reveal ${visible ? "is-visible" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = "left",
  light = false,
}: {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  align?: "left" | "center";
  light?: boolean;
}) {
  return (
    <Reveal className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <p className={`eyebrow ${light ? "eyebrow-light" : ""}`}>{eyebrow}</p>
      <h2 className={`display-lg mt-4 ${light ? "text-cream" : "text-ink"}`}>{title}</h2>
      {intro && <p className={`mt-5 text-lg leading-relaxed ${light ? "text-cream/75" : "text-muted"}`}>{intro}</p>}
    </Reveal>
  );
}

export function TextLink({ to, children, light = false }: { to: string; children: ReactNode; light?: boolean }) {
  return (
    <Link
      to={to}
      className={`group inline-flex items-center gap-2 text-sm font-semibold tracking-wide ${light ? "text-gold" : "text-terracotta"}`}
    >
      <span className="link-underline">{children}</span>
      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item) => (
        <details key={item.q} className="group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-display text-xl text-ink [&::-webkit-details-marker]:hidden">
            {item.q}
            <Plus className="size-5 shrink-0 text-terracotta transition-transform duration-300 group-open:rotate-45" />
          </summary>
          <p className="mt-3 max-w-3xl leading-relaxed text-muted">{item.a}</p>
        </details>
      ))}
    </div>
  );
}

/** The plane-and-swoosh from the logo, drawn as a dashed flight path. */
export function FlightPath({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 1200 260" fill="none" className={className} aria-hidden="true">
      <path
        className="draw"
        d="M10 230 C 260 250, 420 60, 640 120 S 980 210, 1130 40"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <g transform="translate(1108 12) scale(2)">
        <path
          d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

import type { ReactNode } from "react";

type Props = { kicker: string; title: string; children?: ReactNode; center?: boolean; light?: boolean };

export default function SectionHeading({ kicker, title, children, center = false, light = false }: Props) {
  return (
    <div className={`${center ? "mx-auto text-center" : ""} max-w-3xl`}>
      <p className={`kicker ${light ? "text-solar-400" : ""} ${center ? "justify-center" : ""}`}>{kicker}</p>
      <h2 className={`h-section mt-4 ${light ? "text-white" : ""}`}>{title}</h2>
      {children && <p className={`lead mt-5 ${light ? "text-white/75" : ""}`}>{children}</p>}
    </div>
  );
}

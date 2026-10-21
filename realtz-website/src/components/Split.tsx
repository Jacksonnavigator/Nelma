import type { ReactNode } from "react";
import { Photo } from "./Photo";
import { Reveal } from "./ui";
import { Paras, Rich } from "../content/rich";

/** A photo beside a block of text; `flip` puts the photo on the right. */
export function Split({
  photo,
  eyebrow,
  title,
  text,
  children,
  flip = false,
  tall = false,
}: {
  photo: string;
  eyebrow?: string;
  title: string;
  text?: string;
  children?: ReactNode;
  flip?: boolean;
  tall?: boolean;
}) {
  return (
    <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
      <Reveal className={flip ? "md:order-2" : ""}>
        <Photo photo={photo} className={`${tall ? "aspect-[4/5]" : "aspect-[5/4]"} rounded-[2rem] shadow-2xl shadow-earth/15`} />
      </Reveal>
      <Reveal delay={120}>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="display-md mt-3"><Rich text={title} accent="text-terracotta" /></h2>
        <div className="prose-travel mt-6">
          <Paras text={text} />
          {children}
        </div>
      </Reveal>
    </div>
  );
}

export function Pills({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((t, i) => (
        <span key={i} className="rounded-full border border-line bg-paper px-4 py-2 text-sm text-earth">{t}</span>
      ))}
    </div>
  );
}

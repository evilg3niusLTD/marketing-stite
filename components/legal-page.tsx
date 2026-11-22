import type { ReactNode } from "react";
import { LEGAL_UPDATED } from "@/lib/site";

export function LegalPage({
  kicker,
  title,
  lede,
  children,
}: {
  kicker: string;
  title: string;
  lede: string;
  children: ReactNode;
}) {
  return (
    <article className="page-hero wrap legal">
      <p className="kicker">{kicker}</p>
      <h1>{title}</h1>
      <p className="lede">{lede}</p>
      <p className="legal-meta">Last updated {LEGAL_UPDATED}.</p>
      {children}
    </article>
  );
}

"use client";
import { useI18n } from "@/lib/i18n";
import { getLegalDoc, type LegalKind } from "@/lib/legalTexts";

type Block = { type: "p"; text: string } | { type: "ul"; items: string[] };

/** Превращает абзацы раздела в блоки: подряд идущие строки «• …» собираются в один маркированный список. */
function toBlocks(paragraphs: string[]): Block[] {
  const blocks: Block[] = [];
  for (const p of paragraphs) {
    if (p.startsWith("• ")) {
      const last = blocks[blocks.length - 1];
      if (last && last.type === "ul") last.items.push(p.slice(2));
      else blocks.push({ type: "ul", items: [p.slice(2)] });
    } else {
      blocks.push({ type: "p", text: p });
    }
  }
  return blocks;
}

export default function LegalDocument({ kind }: { kind: LegalKind }) {
  const { lang, t } = useI18n();
  const doc = getLegalDoc(kind, lang);
  return (
    <article className="space-y-5 text-sm leading-relaxed text-slate-700">
      <header>
        <h1 className="text-xl font-bold text-slate-900">{doc.title}</h1>
        <p className="text-xs text-slate-500">{t("legal.updated", { date: doc.date })}</p>
      </header>
      {doc.sections.map((s) => (
        <section key={s.title} className="space-y-2">
          <h2 className="font-semibold text-slate-900">{s.title}</h2>
          {toBlocks(s.paragraphs).map((b, i) =>
            b.type === "p" ? (
              <p key={i}>{b.text}</p>
            ) : (
              <ul key={i} className="list-disc space-y-1 pl-5">
                {b.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            )
          )}
        </section>
      ))}
    </article>
  );
}

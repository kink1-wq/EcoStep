"use client";
import Icon from "@/components/Icon";
import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "@/components/MotionLink";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useI18n, type Lang } from "@/lib/i18n";
import type { Report } from "@/lib/types";

export default function AppealPage() {
  return (
    <Suspense fallback={null}>
      <AppealInner />
    </Suspense>
  );
}

function AppealInner() {
  const id = useSearchParams().get("id");
  const { t, lang, category } = useI18n();
  const [report, setReport] = useState<Report | null>(null);
  const [gone, setGone] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [textLang, setTextLang] = useState<Lang>(lang);
  const [copied, setCopied] = useState(false);

  // язык текста обращения по умолчанию совпадает с языком интерфейса, но его можно выбрать отдельно
  useEffect(() => setTextLang(lang), [lang]);

  useEffect(() => {
    if (!id) return setGone(true);
    api<Report>(`/api/reports/${id}`).then(setReport).catch(() => setGone(true));
  }, [id]);

  // Адрес по координатам (бесплатный сервис OpenStreetMap Nominatim); если не получилось — в тексте будут только координаты
  useEffect(() => {
    if (!report) return;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 7000);
    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&accept-language=${textLang === "kk" ? "kk,ru" : "ru"}&lat=${report.latitude}&lon=${report.longitude}`,
      { signal: ctrl.signal }
    )
      .then((r) => r.json())
      .then((j) => setAddress(typeof j?.display_name === "string" ? j.display_name : ""))
      .catch(() => setAddress(""))
      .finally(() => clearTimeout(timer));
    return () => {
      ctrl.abort();
      clearTimeout(timer);
    };
  }, [report, textLang]);

  const text = useMemo(() => {
    if (!report) return "";
    const kk = textLang === "kk";
    const cat = kk ? (category(report.category) || "ластану") : report.category ?? "загрязнение";
    const description = (kk && report.description_kk ? report.description_kk : report.description) ?? "—";
    const coords = `${report.latitude.toFixed(6)}, ${report.longitude.toFixed(6)}`;
    const osm = `https://www.openstreetmap.org/?mlat=${report.latitude}&mlon=${report.longitude}#map=18/${report.latitude}/${report.longitude}`;
    const when = new Date(report.created_at).toLocaleDateString(kk ? "kk-KZ" : "ru-RU");
    const site = typeof window !== "undefined" ? window.location.origin : "";
    const place = address || (kk ? "мекенжай анықталмады, координаттарды қараңыз" : "адрес не определён, см. координаты");
    const votes = report.support_count;

    return kk
      ? [
          "Қала аумағындағы ластануды жою бойынша шаралар қабылдауыңызды сұраймын.",
          "",
          `Санаты: ${cat}`,
          `Сипаттамасы: ${description}`,
          `Мекенжайы: ${place}`,
          `Координаттар: ${coords}`,
          `Картада: ${osm}`,
          `Тіркелген күні: ${when}`,
          `Фотоқұжат: ${report.photo_url}`,
          `Ақпаратты EcoStep платформасы растады${votes > 0 ? `, мәселені тағы ${votes} тұрғын растады` : ""}: ${site}`,
          "",
          "Өтінішті қарап, қабылданған шаралар туралы хабарлауыңызды сұраймын.",
        ].join("\n")
      : [
          "Прошу принять меры по устранению загрязнения городской территории.",
          "",
          `Категория: ${cat}`,
          `Описание: ${description}`,
          `Адрес: ${place}`,
          `Координаты: ${coords}`,
          `На карте: ${osm}`,
          `Дата фиксации: ${when}`,
          `Фотофиксация: ${report.photo_url}`,
          `Информация подтверждена платформой EcoStep${votes > 0 ? `; о проблеме также подтвердили жителей: ${votes}` : ""}: ${site}`,
          "",
          "Прошу рассмотреть обращение и сообщить о принятых мерах.",
        ].join("\n");
  }, [report, address, textLang, category]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // запасной способ для старых WebView без доступа к буферу обмена
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (gone) return <p className="mx-auto mt-16 max-w-md text-center text-slate-500">{t("appeal.gone")}</p>;
  if (!report) return <p className="p-8 text-center text-slate-500">{t("appeal.loading")}</p>;

  return (
    <div className="safe-bottom mx-auto max-w-2xl space-y-4 p-4">
      <Link href="/map" className="text-sm text-emerald-700 hover:underline">{t("appeal.back")}</Link>
      <h1 className="text-xl font-bold"><Icon name="file" className="heading-icon"/> {t("appeal.title")}</h1>
      <p className="text-sm text-slate-600">{t("appeal.intro")}</p>

      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-600">{t("appeal.lang")}:</span>
        <div className="flex overflow-hidden rounded-lg border">
          {(["ru", "kk"] as Lang[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setTextLang(l)}
              className={`px-3 py-1.5 text-xs font-bold ${textLang === l ? "bg-emerald-600 text-white" : "bg-white text-slate-600"}`}
            >
              {l === "ru" ? "RU" : "ҚАЗ"}
            </button>
          ))}
        </div>
      </div>

      <textarea readOnly value={text} rows={14} className="w-full rounded-xl border bg-white p-3 text-sm leading-relaxed" />

      <div className="flex flex-wrap gap-2">
        <button onClick={copy} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
          <Icon name={copied ? "check" : "copy"} className="inline-icon"/> {copied ? t("appeal.copied") : t("appeal.copy")}
        </button>
        <a href={report.photo_url} target="_blank" rel="noreferrer" className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          <Icon name="image" className="inline-icon"/> {t("appeal.photo")}
        </a>
        <a href="https://eotinish.kz" target="_blank" rel="noreferrer" className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          {t("appeal.eotinish")} <Icon name="external" className="inline-icon"/>
        </a>
      </div>
    </div>
  );
}

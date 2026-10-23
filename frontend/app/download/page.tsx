"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Capacitor } from "@capacitor/core";
import { useI18n } from "@/lib/i18n";

interface ApkInfo {
  file: string;
  sizeBytes: number;
  sha256: string;
  builtAt: string;
}

export default function DownloadPage() {
  const { t, date } = useI18n();
  const [info, setInfo] = useState<ApkInfo | null | undefined>(undefined); // undefined — загрузка, null — файла нет
  const [native, setNative] = useState(false);

  useEffect(() => {
    setNative(Capacitor.isNativePlatform());
    fetch("/downloads/apk-info.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setInfo(j && typeof j.sha256 === "string" ? j : null))
      .catch(() => setInfo(null));
  }, []);

  if (native)
    return <p className="mx-auto mt-16 max-w-md px-4 text-center text-slate-600">{t("download.inApp")}</p>;

  const steps = ["download.s1", "download.s2", "download.s3", "download.s4"] as const;

  return (
    <div className="safe-bottom mx-auto max-w-xl space-y-5 p-4">
      <div className="space-y-3 rounded-2xl border bg-white p-5 text-center shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="EcoStep" width={96} height={96} className="mx-auto h-24 w-24" />
        <h1 className="text-xl font-bold">{t("download.title")}</h1>
        <p className="text-sm text-slate-600">{t("download.intro")}</p>

        {info === undefined ? (
          <p className="text-sm text-slate-400">…</p>
        ) : info ? (
          <>
            <a
              href={`/downloads/${info.file}?v=${info.sha256.slice(0, 8)}`}
              download={info.file}
              className="inline-block w-full rounded-xl bg-emerald-600 px-6 py-3.5 text-lg font-semibold !text-white shadow hover:bg-emerald-700 active:bg-emerald-800 sm:w-auto"
            >
              {t("download.button")}
            </a>
            <dl className="mx-auto max-w-sm space-y-1 text-left text-xs text-slate-500">
              <div className="flex justify-between gap-3">
                <dt>{t("download.size")}</dt>
                <dd>{t("download.mb", { n: (info.sizeBytes / 1048576).toFixed(1) })}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>{t("download.built")}</dt>
                <dd>{date(info.builtAt)}</dd>
              </div>
              <div>
                <dt>{t("download.sha")}</dt>
                <dd className="mt-0.5 break-all font-mono text-[10px] text-slate-600">{info.sha256}</dd>
              </div>
            </dl>
          </>
        ) : (
          <p className="text-sm text-red-600">{t("download.unavailable")}</p>
        )}
      </div>

      <section className="space-y-2 rounded-2xl border bg-white p-5">
        <h2 className="font-semibold">{t("download.stepsTitle")}</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700">
          {steps.map((k) => (
            <li key={k}>{t(k)}</li>
          ))}
        </ol>
        <p className="pt-2 text-xs text-slate-500">{t("download.note")}</p>
        <p className="text-xs text-slate-500">{t("download.update")}</p>
      </section>

      <p className="text-center text-sm">
        <Link href="/" className="text-emerald-700 hover:underline">
          {t("legal.back")}
        </Link>
      </p>
    </div>
  );
}

"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { takePhoto } from "@/lib/native";
import { useSession } from "@/lib/useSession";
import type { Report } from "@/lib/types";

export default function CleanupPage() {
  return (
    <Suspense fallback={null}>
      <CleanupInner />
    </Suspense>
  );
}

function CleanupInner() {
  const id = useSearchParams().get("id");
  const router = useRouter();
  const { session, loading } = useSession();
  const [report, setReport] = useState<Report | null>(null);
  const [loadError, setLoadError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!loading && !session) router.replace("/login");
  }, [loading, session, router]);

  useEffect(() => {
    if (!id) {
      setLoadError("Не указана точка на карте — откройте эту страницу по ссылке «Сообщить, что убрано» из попапа на карте.");
      return;
    }
    api<Report>(`/api/reports/${id}`).catch(() => null).then((r) => {
      if (r) setReport(r);
      else setLoadError("Эта точка уже не на карте — возможно, её уже убрали.");
    });
  }, [id]);

  async function pickPhoto() {
    try {
      const f = await takePhoto();
      setFile(f);
      setPreview(URL.createObjectURL(f));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось получить фото");
    }
  }

  async function submit() {
    if (!file || !id) return;
    setBusy(true); setError("");
    try {
      const form = new FormData();
      form.append("photo", file);
      await api(`/api/reports/${id}/cleanup`, { method: "POST", body: form }, true);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось отправить");
    } finally {
      setBusy(false);
    }
  }

  if (loadError)
    return <p className="mx-auto mt-16 max-w-md text-center text-slate-500">{loadError}</p>;

  if (done)
    return (
      <div className="mx-auto mt-16 max-w-md space-y-4 rounded-2xl border bg-white p-6 text-center">
        <p className="text-4xl">🧹✅</p>
        <h1 className="text-xl font-bold">Фото отправлено</h1>
        <p className="text-slate-600">ИИ сравнивает его с исходной заявкой. Если место действительно убрано, точка исчезнет с карты.</p>
        <Link href="/" className="inline-block rounded-lg bg-emerald-600 px-5 py-2 font-semibold text-white">На карту</Link>
      </div>
    );

  return (
    <div className="safe-bottom mx-auto max-w-md space-y-4 p-4">
      <h1 className="text-xl font-bold">Подтвердить уборку</h1>

      {report && (
        <div className="flex gap-3 rounded-xl border bg-white p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={report.photo_url} alt="" className="h-20 w-20 rounded-lg object-cover" />
          <div className="text-sm">
            <b>{report.category ?? "Загрязнение"}</b>
            <p className="text-slate-600">{report.description}</p>
          </div>
        </div>
      )}

      <p className="text-sm text-slate-500">Сфотографируйте это же место сейчас — ИИ сравнит фото с исходной заявкой.</p>

      <button
        type="button"
        onClick={pickPhoto}
        className="grid h-56 w-full place-items-center overflow-hidden rounded-2xl border-2 border-dashed bg-white text-slate-500"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Фото" className="h-full w-full object-cover" />
        ) : (
          <span>📷 Сделать фото</span>
        )}
      </button>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button onClick={submit} disabled={!file || busy}
        className="w-full rounded-lg bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
        {busy ? "Отправка…" : "Отправить на проверку"}
      </button>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useSession } from "@/lib/useSession";
import { getCurrentPosition, takePhoto } from "@/lib/native";

/** Уменьшаем фото до 1600px: быстрее загрузка и дешевле анализ ИИ. */
async function compress(file: File, maxSide = 1600): Promise<File> {
  try {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * k);
    c.height = Math.round(bmp.height * k);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.85));
    return blob ? new File([blob], "photo.jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file;
  }
}

export default function ReportPage() {
  const router = useRouter();
  const { session, loading } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!loading && !session) router.replace("/login");
  }, [loading, session, router]);

  useEffect(() => {
    getCurrentPosition()
      .then(setCoords)
      .catch(() => setGeoError("Не удалось определить геопозицию. Разрешите доступ к местоположению."));
  }, []);

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
    if (!file || !coords) return;
    setBusy(true); setError("");
    try {
      const form = new FormData();
      form.append("photo", await compress(file));
      form.append("latitude", String(coords.lat));
      form.append("longitude", String(coords.lng));
      if (comment.trim()) form.append("comment", comment.trim());
      await api("/api/reports", { method: "POST", body: form }, true);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось отправить");
    } finally {
      setBusy(false);
    }
  }

  if (done)
    return (
      <div className="mx-auto mt-16 max-w-md space-y-4 rounded-2xl border bg-white p-6 text-center">
        <p className="text-4xl">✅</p>
        <h1 className="text-xl font-bold">Заявка отправлена</h1>
        <p className="text-slate-600">ИИ анализирует фото. Статус можно посмотреть в личном кабинете.</p>
        <Link href="/cabinet" className="inline-block rounded-lg bg-emerald-600 px-5 py-2 font-semibold text-white">Мои заявки</Link>
      </div>
    );

  return (
    <div className="safe-bottom mx-auto max-w-md space-y-4 p-4">
      <h1 className="text-xl font-bold">Сообщить о проблеме</h1>

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

      <p className="text-sm">
        {coords ? <span className="text-emerald-700">📍 Геопозиция определена ({coords.lat.toFixed(5)}, {coords.lng.toFixed(5)})</span>
          : geoError ? <span className="text-red-600">{geoError}</span>
          : <span className="text-slate-500">Определяем геопозицию…</span>}
      </p>

      <textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={500} rows={3}
        placeholder="Комментарий (необязательно)" className="w-full rounded-lg border p-3" />

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button onClick={submit} disabled={!file || !coords || busy}
        className="w-full rounded-lg bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
        {busy ? "Отправка…" : "Отправить на проверку"}
      </button>
    </div>
  );
}

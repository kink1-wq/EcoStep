"use client";
import { useCallback, useEffect, useState } from "react";
import Icon from "@/components/Icon";
import Link from "@/components/MotionLink";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useSession } from "@/lib/useSession";
import { useI18n } from "@/lib/i18n";
import { getCurrentPosition } from "@/lib/native";
import PhotoPicker from "@/components/PhotoPicker";
import LocationPicker from "@/components/LocationPickerLoader";
import type { FocusTarget, LatLng, Report } from "@/lib/types";

const DUPLICATE_RADIUS_M = 30;

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
  const { t, err, category, desc } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [focus, setFocus] = useState<FocusTarget | null>(null);
  const [source, setSource] = useState<"gps" | "manual" | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoFailed, setGeoFailed] = useState(false);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  // точки, уже отмеченные рядом (чтобы не создавать дубликаты) и голоса «Тоже вижу»
  const [nearby, setNearby] = useState<Report[]>([]);
  const [voted, setVoted] = useState<Record<string, number>>({});
  const [voteError, setVoteError] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && !session) router.replace("/login");
  }, [loading, session, router]);

  const locate = useCallback(async () => {
    setLocating(true);
    setGeoFailed(false);
    try {
      const p = await getCurrentPosition();
      setCoords(p);
      setSource("gps");
      setFocus((f) => ({ ...p, n: (f?.n ?? 0) + 1 }));
    } catch {
      setGeoFailed(true);
    } finally {
      setLocating(false);
    }
  }, []);

  useEffect(() => {
    locate();
  }, [locate]);

  // Пользователь перетащил метку или нажал на карту
  const pickManually = useCallback((p: LatLng) => {
    setCoords(p);
    setSource("manual");
  }, []);

  // Ищем уже отмеченные точки рядом с выбранным местом (с небольшой задержкой, пока метку перетаскивают)
  useEffect(() => {
    if (!coords) {
      setNearby([]);
      return;
    }
    const timer = setTimeout(() => {
      api<Report[]>(`/api/reports/nearby?lat=${coords.lat}&lng=${coords.lng}&radius=${DUPLICATE_RADIUS_M}`)
        .then(setNearby)
        .catch(() => setNearby([]));
    }, 500);
    return () => clearTimeout(timer);
  }, [coords]);

  async function vote(id: string) {
    setVoteError((e) => ({ ...e, [id]: "" }));
    try {
      const res = await api<{ count: number }>(`/api/reports/${id}/support`, { method: "POST" }, true);
      setVoted((v) => ({ ...v, [id]: res.count }));
    } catch (e) {
      setVoteError((m) => ({ ...m, [id]: err(e instanceof Error ? e.message : "") }));
    }
  }

  async function submit() {
    if (!file || !coords) return;
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.append("photo", await compress(file));
      form.append("latitude", String(coords.lat));
      form.append("longitude", String(coords.lng));
      if (comment.trim()) form.append("comment", comment.trim());
      await api("/api/reports", { method: "POST", body: form }, true);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? err(e.message) : t("report.failed"));
    } finally {
      setBusy(false);
    }
  }

  if (done)
    return (
      <div className="mx-auto mt-16 max-w-md space-y-4 rounded-2xl border bg-white p-6 text-center">
        <div className="success-seal"><Icon name="check"/></div>
        <h1 className="text-xl font-bold">{t("report.doneTitle")}</h1>
        <p className="text-slate-600">{t("report.doneText")}</p>
        <Link href="/cabinet" className="inline-block rounded-lg bg-emerald-600 px-5 py-2 font-semibold !text-white">
          {t("nav.mine")}
        </Link>
      </div>
    );

  return (
    <div className="safe-bottom form-page mx-auto space-y-4 p-4">
      <div className="page-intro"><div className="eyebrow">{t("brand.firstStep")}</div><h1>{t("report.title")}</h1><p>{t("brand.reportIntro")}</p></div><div className="eyebrow">{t("brand.photoStep")}</div>

      <PhotoPicker file={file} onChange={setFile} onError={setError} disabled={busy}/>

      <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900"><Icon name="shield" className="inline-icon"/> {t("report.privacy")}</p>

      <div className="eyebrow">{t("brand.placeStep")}</div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold">{t("report.place")}</h2>
          <button
            type="button"
            onClick={locate}
            disabled={locating}
            className="shrink-0 rounded-lg border bg-white px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
          >
            {locating ? t("report.locating") : t("report.myPlace")}
          </button>
        </div>

        <div className="h-64 overflow-hidden rounded-2xl border bg-slate-100">
          <LocationPicker value={coords} focus={focus} onChange={pickManually} />
        </div>

        <p className="text-sm">
          {coords ? (
            <span className="text-emerald-700">
              <Icon name="pin" className="inline-icon"/> {source === "manual" ? t("report.placeManual") : t("report.placeAuto")} ({coords.lat.toFixed(5)},{" "}
              {coords.lng.toFixed(5)})
            </span>
          ) : geoFailed ? (
            <span className="text-red-600">{t("report.placeFail")}</span>
          ) : (
            <span className="text-slate-500">{t("report.placeWait")}</span>
          )}
        </p>
        <p className="text-xs text-slate-500">{t("report.placeHint")}</p>
      </div>

      {nearby.length > 0 && (
        <div className="space-y-2 rounded-2xl border border-amber-300 bg-amber-50 p-3">
          <h2 className="font-semibold text-amber-900"><Icon name="alert" className="inline-icon"/> {t("report.nearTitle")}</h2>
          <p className="text-sm text-amber-900">{t("report.nearText", { r: DUPLICATE_RADIUS_M })}</p>
          {nearby.map((r) => (
            <div key={r.id} className="flex gap-3 rounded-xl bg-white p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.photo_url} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <b className="block truncate text-sm">{category(r.category)}</b>
                <p className="line-clamp-2 text-xs text-slate-600">{desc(r)}</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <small className="text-slate-500"><Icon name="eye" className="inline-icon"/> {voted[r.id] ?? r.support_count}</small>
                  {r.id in voted ? (
                    <span className="text-xs font-medium text-emerald-700">{t("map.supportThanks")}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => vote(r.id)}
                      className="rounded-lg border border-emerald-600 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                    >
                      {t("map.support")}
                    </button>
                  )}
                </div>
                {voteError[r.id] && <p className="mt-1 text-xs text-red-600">{voteError[r.id]}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <label htmlFor="report-comment" className="eyebrow">{t("brand.commentStep")} · {t("brand.optional")}</label>
      <textarea
        id="report-comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={500}
        rows={3}
        placeholder={t("report.comment")}
        className="w-full rounded-lg border p-3"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        onClick={submit}
        disabled={!file || !coords || busy}
        className="w-full rounded-lg bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {busy ? t("report.sending") : t("report.send")}
      </button>
    </div>
  );
}

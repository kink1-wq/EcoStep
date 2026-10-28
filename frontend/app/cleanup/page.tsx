"use client";
import { Suspense, useCallback, useEffect, useState } from "react";
import Icon from "@/components/Icon";
import Link from "@/components/MotionLink";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { getCurrentPosition, takePhoto } from "@/lib/native";
import { useSession } from "@/lib/useSession";
import { useI18n } from "@/lib/i18n";
import type { LatLng, Report } from "@/lib/types";

/** Подтверждать уборку можно, находясь не дальше этого расстояния от точки (сервер проверяет то же самое). */
const MAX_DISTANCE_M = 1000;

/** Расстояние между двумя точками на земле, в метрах (формула гаверсинуса). */
function haversine(a: LatLng, lat: number, lng: number): number {
  const R = 6371000;
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(lat - a.lat);
  const dLng = rad(lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

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
  const { session, loading, isAdmin } = useSession();
  const { t, err, category, desc, distance: fmtDistance } = useI18n();
  const [report, setReport] = useState<Report | null>(null);
  const [loadError, setLoadError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  // где находится пользователь сейчас
  const [me, setMe] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoFailed, setGeoFailed] = useState(false);

  useEffect(() => {
    if (!loading && !session) router.replace("/login");
  }, [loading, session, router]);

  useEffect(() => {
    if (!id) {
      setLoadError(t("cleanup.noPoint"));
      return;
    }
    api<Report>(`/api/reports/${id}`)
      .catch(() => null)
      .then((r) => {
        if (r) setReport(r);
        else setLoadError(t("cleanup.gone"));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const locate = useCallback(async () => {
    setLocating(true);
    setGeoFailed(false);
    try {
      setMe(await getCurrentPosition());
    } catch {
      setGeoFailed(true);
    } finally {
      setLocating(false);
    }
  }, []);

  useEffect(() => {
    locate();
  }, [locate]);

  const dist = me && report ? haversine(me, report.latitude, report.longitude) : null;
  const tooFar = dist !== null && dist > MAX_DISTANCE_M && !isAdmin; // администратору расстояние не важно
  const noLocation = !isAdmin && dist === null;

  async function pickPhoto() {
    try {
      const f = await takePhoto();
      setFile(f);
      setPreview(URL.createObjectURL(f));
    } catch (e) {
      setError(e instanceof Error ? err(e.message) : t("report.photoFailed"));
    }
  }

  async function submit() {
    if (!file || !id) return;
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.append("photo", file);
      if (me) {
        form.append("latitude", String(me.lat));
        form.append("longitude", String(me.lng));
      }
      await api(`/api/reports/${id}/cleanup`, { method: "POST", body: form }, true);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? err(e.message) : t("report.failed"));
    } finally {
      setBusy(false);
    }
  }

  if (loadError) return <p className="mx-auto mt-16 max-w-md text-center text-slate-500">{loadError}</p>;

  if (done)
    return (
      <div className="mx-auto mt-16 max-w-md space-y-4 rounded-2xl border bg-white p-6 text-center">
        <div className="success-seal"><Icon name="check"/></div>
        <h1 className="text-xl font-bold">{t("cleanup.doneTitle")}</h1>
        <p className="text-slate-600">{t("cleanup.doneText")}</p>
        <div className="flex justify-center gap-2">
          <Link href="/cabinet" className="inline-block rounded-lg bg-emerald-600 px-5 py-2 font-semibold !text-white">
            {t("nav.mine")}
          </Link>
          <Link href="/map" className="inline-block rounded-lg bg-slate-200 px-5 py-2 font-semibold !text-slate-700">
            {t("cleanup.toMap")}
          </Link>
        </div>
      </div>
    );

  return (
    <div className="safe-bottom form-page mx-auto space-y-4 p-4">
      <div className="page-intro"><div className="eyebrow">{t("brand.step3")}</div><h1>{t("cleanup.title")}</h1></div>

      {report && (
        <div className="flex gap-3 rounded-xl border bg-white p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={report.photo_url} alt="" className="h-20 w-20 shrink-0 rounded-lg object-cover" />
          <div className="min-w-0 text-sm">
            <b>{category(report.category) || t("cabinet.pointDefault")}</b>
            <p className="line-clamp-3 text-slate-600">{desc(report)}</p>
          </div>
        </div>
      )}

      <p className="text-sm text-slate-500">{t("cleanup.hint")}</p>

      {/* где вы находитесь относительно точки */}
      <div
        className={`rounded-lg px-3 py-2 text-sm ${
          tooFar ? "bg-red-50 text-red-700" : dist !== null ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"
        }`}
      >
        {locating && dist === null
          ? t("cleanup.geoWait")
          : tooFar
            ? t("cleanup.geoFar", { d: fmtDistance(dist!), max: fmtDistance(MAX_DISTANCE_M) })
            : dist !== null
              ? t("cleanup.geoOk", { d: fmtDistance(dist) })
              : geoFailed && !isAdmin
                ? t("cleanup.geoFail")
                : t("cleanup.geoWait")}
        {(geoFailed || tooFar) && !locating && (
          <button type="button" onClick={locate} className="ml-2 font-semibold underline">
            {t("cleanup.refresh")}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={pickPhoto}
        className="upload-zone grid h-56 w-full place-items-center overflow-hidden rounded-2xl border-2 border-dashed bg-white text-slate-500"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={t("report.photoAlt")} className="h-full w-full object-cover" />
        ) : (
          <span className="upload-prompt"><Icon name="camera"/><strong>{t("brand.upload")}</strong><span>JPEG · PNG · WebP</span></span>
        )}
      </button>

      <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900"><Icon name="shield" className="inline-icon"/> {t("report.privacy")}</p>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        onClick={submit}
        disabled={!file || busy || tooFar || noLocation}
        className="w-full rounded-lg bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {busy ? t("report.sending") : t("cleanup.send")}
      </button>
    </div>
  );
}

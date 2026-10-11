"use client";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { getCurrentPosition } from "@/lib/native";
import { useSession } from "@/lib/useSession";
import type { Report } from "@/lib/types";

const CENTER: [number, number] = [
  Number(process.env.NEXT_PUBLIC_MAP_LAT ?? 51.1605),
  Number(process.env.NEXT_PUBLIC_MAP_LNG ?? 71.4704),
];

const COLORS: Record<string, string> = {
  "бытовой мусор": "#ea580c",
  "стихийная свалка": "#dc2626",
  "строительный мусор": "#a16207",
  "загрязнение воды": "#2563eb",
  "пятна/разлив": "#7c3aed",
};

// Причины жалобы: администратору уходит русский текст, пользователь видит свой язык
const FLAG_REASONS = [
  { key: "map.reason.nothing", ru: "Загрязнения нет" },
  { key: "map.reason.fake", ru: "Ложная заявка" },
  { key: "map.reason.privacy", ru: "На фото лица или номера" },
  { key: "map.reason.other", ru: "Другое" },
] as const;

function Controller({ onBounds }: { onBounds: (q: string) => void }) {
  const map = useMap();
  const emit = useCallback(() => {
    const b = map.getBounds();
    onBounds(
      `min_lat=${b.getSouth()}&max_lat=${b.getNorth()}&min_lon=${b.getWest()}&max_lon=${b.getEast()}`
    );
  }, [map, onBounds]);

  useMapEvents({ moveend: emit });
  useEffect(() => {
    emit();
    // Центрируем карту на пользователе, если он разрешил геопозицию
    getCurrentPosition()
      .then((p) => map.setView([p.lat, p.lng], 14))
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

/** Содержимое всплывающего окна точки: описание и действия (уборка, «Тоже вижу», жалоба, обращение). */
function PointPopup({
  r, loggedIn, isAdmin, removing, onRemove,
}: {
  r: Report;
  loggedIn: boolean;
  isAdmin: boolean;
  removing: boolean;
  onRemove: () => void;
}) {
  const { t, err, category, desc, date } = useI18n();
  const [count, setCount] = useState(r.support_count);
  const [supported, setSupported] = useState(false);
  const [flagOpen, setFlagOpen] = useState(false);
  const [flagged, setFlagged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function support() {
    if (!loggedIn) return setMsg({ text: t("map.needLogin"), ok: false });
    setBusy(true);
    setMsg(null);
    try {
      const res = await api<{ count: number }>(`/api/reports/${r.id}/support`, { method: "POST" }, true);
      setCount(res.count);
      setSupported(true);
      setMsg({ text: t("map.supportThanks"), ok: true });
    } catch (e) {
      setMsg({ text: err(e instanceof Error ? e.message : ""), ok: false });
    } finally {
      setBusy(false);
    }
  }

  async function flag(reasonRu: string) {
    if (!loggedIn) return setMsg({ text: t("map.needLogin"), ok: false });
    setBusy(true);
    setMsg(null);
    try {
      await api(
        `/api/reports/${r.id}/flag`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: reasonRu }) },
        true
      );
      setFlagged(true);
      setFlagOpen(false);
      setMsg({ text: t("map.flagSent"), ok: true });
    } catch (e) {
      setMsg({ text: err(e instanceof Error ? e.message : ""), ok: false });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={r.photo_url} alt="" className="mb-2 h-32 w-full rounded object-cover" />
      <b>{category(r.category) || t("cabinet.pointDefault")}</b>
      <p className="my-1">{desc(r)}</p>
      <small className="text-slate-500">{date(r.created_at)}</small>
      {count > 0 && <p className="my-1 text-xs font-medium text-emerald-700">👁 {t("map.supportCount", { n: count })}</p>}

      <div className="mt-2 flex flex-col gap-1.5">
        <Link
          href={`/cleanup?id=${r.id}`}
          className="ecostep-btn rounded-lg bg-emerald-600 py-1.5 text-center text-sm font-semibold !text-white hover:bg-emerald-700"
        >
          {t("map.cleaned")}
        </Link>

        <button
          type="button"
          onClick={support}
          disabled={busy || supported}
          className="rounded-lg border border-emerald-600 py-1.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
        >
          {supported ? t("map.supportThanks") : t("map.support")}
        </button>

        <div className="flex gap-1.5">
          <Link
            href={`/appeal?id=${r.id}`}
            className="flex-1 rounded-lg border py-1.5 text-center text-xs font-medium !text-slate-700 hover:bg-slate-50"
          >
            {t("map.appeal")}
          </Link>
          <button
            type="button"
            onClick={() => setFlagOpen((o) => !o)}
            disabled={flagged}
            className="flex-1 rounded-lg border py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {t("map.flag")}
          </button>
        </div>

        {flagOpen && !flagged && (
          <div className="space-y-1 rounded-lg bg-slate-50 p-2">
            <p className="text-xs text-slate-600">{t("map.flagWhy")}</p>
            {FLAG_REASONS.map((reason) => (
              <button
                key={reason.key}
                type="button"
                disabled={busy}
                onClick={() => flag(reason.ru)}
                className="block w-full rounded-md border bg-white px-2 py-1.5 text-left text-xs hover:bg-slate-100 disabled:opacity-50"
              >
                {t(reason.key)}
              </button>
            ))}
          </div>
        )}

        {msg && <p className={`text-xs ${msg.ok ? "text-emerald-700" : "text-red-600"}`}>{msg.text}</p>}

        {isAdmin && (
          <button
            onClick={onRemove}
            disabled={removing}
            className="rounded-lg bg-red-600 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {removing ? t("map.deleting") : t("map.delete")}
          </button>
        )}
      </div>
    </>
  );
}

export default function Map() {
  const { session, isAdmin } = useSession();
  const { t, err, category: catLabel } = useI18n();
  const [query, setQuery] = useState("");
  const [reports, setReports] = useState<Report[]>([]);
  const [category, setCategory] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!query) return;
    api<Report[]>(`/api/reports?${query}`).then(setReports).catch(() => {});
  }, [query]);

  const categories = useMemo(
    () => Array.from(new Set(reports.map((r) => r.category).filter(Boolean))) as string[],
    [reports]
  );
  const visible = category ? reports.filter((r) => r.category === category) : reports;

  async function removeReport(id: string) {
    if (!confirm(t("map.deleteConfirm"))) return;
    setBusyId(id);
    setError("");
    try {
      await api(`/api/admin/reports/${id}`, { method: "DELETE" }, true);
      setReports((rs) => rs.filter((r) => r.id !== id));
    } catch (e) {
      setError(e instanceof Error ? err(e.message) : t("map.deleteFail"));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="relative h-full">
      <MapContainer center={CENTER} zoom={12} scrollWheelZoom>
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Controller onBounds={setQuery} />
        {visible.map((r) => {
          const color = COLORS[r.category ?? ""] ?? "#475569";
          return (
            <Fragment key={r.id}>
              {/* Внешний ореол — делает точки заметными и различимыми издалека на карте */}
              <CircleMarker
                center={[r.latitude, r.longitude]}
                radius={20}
                pathOptions={{ className: "ecostep-halo", color: "transparent", fillColor: color, fillOpacity: 0.18 }}
                interactive={false}
              />
              <CircleMarker
                center={[r.latitude, r.longitude]}
                radius={13}
                pathOptions={{ className: "ecostep-marker", color: "#ffffff", weight: 3, fillOpacity: 1, fillColor: color }}
              >
                <Popup minWidth={240} maxWidth={280}>
                  <PointPopup
                    r={r}
                    loggedIn={!!session}
                    isAdmin={isAdmin}
                    removing={busyId === r.id}
                    onRemove={() => removeReport(r.id)}
                  />
                </Popup>
              </CircleMarker>
            </Fragment>
          );
        })}
      </MapContainer>

      {categories.length > 0 && (
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="absolute left-3 top-3 z-[1000] rounded-lg border bg-white px-3 py-2 text-sm shadow"
        >
          <option value="">{t("map.allCategories")}</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {catLabel(c)}
            </option>
          ))}
        </select>
      )}

      {error && (
        <p className="absolute bottom-3 left-1/2 z-[1000] -translate-x-1/2 rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white shadow">
          {error}
        </p>
      )}
    </div>
  );
}

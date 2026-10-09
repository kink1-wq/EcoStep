"use client";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { api } from "@/lib/api";
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

export default function Map() {
  const { isAdmin } = useSession();
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
    if (!confirm("Удалить точку с карты без возможности восстановить?")) return;
    setBusyId(id); setError("");
    try {
      await api(`/api/admin/reports/${id}`, { method: "DELETE" }, true);
      setReports((rs) => rs.filter((r) => r.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось удалить");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="relative h-full">
      <MapContainer center={CENTER} zoom={12} scrollWheelZoom>
        <TileLayer
          attribution="&copy; участники OpenStreetMap"
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
                <Popup minWidth={230}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.photo_url} alt="" className="mb-2 h-32 w-full rounded object-cover" />
                  <b>{r.category ?? "Загрязнение"}</b>
                  <p className="my-1">{r.description}</p>
                  <small className="text-slate-500">{new Date(r.created_at).toLocaleDateString("ru-RU")}</small>
                  <div className="mt-2 flex flex-col gap-1.5">
                    <Link
                      href={`/cleanup?id=${r.id}`}
                      className="rounded-lg bg-emerald-600 py-1.5 text-center text-sm font-semibold !text-white hover:bg-emerald-700 ecostep-btn"
                    >
                      🧹 Сообщить, что убрано
                    </Link>
                    {isAdmin && (
                      <button
                        onClick={() => removeReport(r.id)}
                        disabled={busyId === r.id}
                        className="rounded-lg bg-red-600 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {busyId === r.id ? "Удаление…" : "🗑 Удалить точку"}
                      </button>
                    )}
                  </div>
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
          <option value="">Все категории</option>
          {categories.map((c) => <option key={c}>{c}</option>)}
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

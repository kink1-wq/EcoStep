"use client";
import dynamic from "next/dynamic";

// Leaflet работает только в браузере
const Map = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-slate-500">Загрузка карты…</div>,
});

export default function MapView() {
  return <Map />;
}

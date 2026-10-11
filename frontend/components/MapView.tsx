"use client";
import dynamic from "next/dynamic";
import { useI18n } from "@/lib/i18n";

function MapLoading() {
  const { t } = useI18n();
  return <div className="grid h-full place-items-center text-slate-500">{t("map.loading")}</div>;
}

// Leaflet работает только в браузере
const Map = dynamic(() => import("./Map"), { ssr: false, loading: () => <MapLoading /> });

export default function MapView() {
  return <Map />;
}

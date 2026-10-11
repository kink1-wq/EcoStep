"use client";
import Link from "next/link";
import MapView from "@/components/MapView";
import { useI18n } from "@/lib/i18n";

export default function Home() {
  const { t } = useI18n();
  return (
    <div className="relative h-full">
      <MapView />
      <Link
        href="/report"
        className="absolute left-1/2 z-[1000] -translate-x-1/2 whitespace-nowrap rounded-full bg-emerald-600 px-6 py-3 font-semibold !text-white shadow-lg active:bg-emerald-800 hover:bg-emerald-700"
        style={{ bottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}
      >
        {t("home.report")}
      </Link>
    </div>
  );
}

import Link from "next/link";
import MapView from "@/components/MapView";

export default function Home() {
  return (
    <div className="relative h-full">
      <MapView />
      <Link
        href="/report"
        className="absolute left-1/2 z-[1000] -translate-x-1/2 rounded-full bg-emerald-600 px-6 py-3 font-semibold text-white shadow-lg active:bg-emerald-800 hover:bg-emerald-700"
        style={{ bottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}
      >
        📷 Сообщить о проблеме
      </Link>
    </div>
  );
}

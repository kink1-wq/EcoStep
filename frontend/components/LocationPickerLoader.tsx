"use client";
import dynamic from "next/dynamic";

// Leaflet работает только в браузере — на сервере (при сборке) его не грузим
const LocationPicker = dynamic(() => import("./LocationPicker"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-slate-500">Загрузка карты…</div>,
});

export default LocationPicker;

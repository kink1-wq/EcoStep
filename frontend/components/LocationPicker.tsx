"use client";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { FocusTarget, LatLng } from "@/lib/types";

const DEFAULT_CENTER: [number, number] = [
  Number(process.env.NEXT_PUBLIC_MAP_LAT ?? 51.1605),
  Number(process.env.NEXT_PUBLIC_MAP_LNG ?? 71.4704),
];

// Своя иконка-метка (SVG), чтобы не зависеть от картинок Leaflet, которые часто «теряются» при сборке
const pinIcon = L.divIcon({
  className: "ecostep-pin",
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="52" viewBox="0 0 36 46">
    <path d="M18 2C9.7 2 3 8.6 3 16.8c0 10.6 15 26.7 15 26.7s15-16.1 15-26.7C33 8.6 26.3 2 18 2z"
      fill="#059669" stroke="#ffffff" stroke-width="2.5"/>
    <circle cx="18" cy="17" r="6" fill="#ffffff"/>
  </svg>`,
  iconSize: [40, 52],
  iconAnchor: [20, 50], // острие метки — ровно в выбранной точке
});

/** Нажатие на карту переносит метку; колесо мыши зуммирует карту только после нажатия на неё. */
function MapInteractions({ onPick }: { onPick: (p: LatLng) => void }) {
  const map = useMap();
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
      map.scrollWheelZoom.enable();
    },
    mouseout() {
      map.scrollWheelZoom.disable();
    },
  });
  return null;
}

/** Переводит карту к новой точке, когда родитель просит (определилась геопозиция, «Моё место»). */
function Recenter({ target }: { target: FocusTarget | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.setView([target.lat, target.lng], Math.max(map.getZoom(), 16));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.n]);
  return null;
}

export default function LocationPicker({
  value,
  focus,
  onChange,
}: {
  value: LatLng | null;
  focus: FocusTarget | null;
  onChange: (p: LatLng) => void;
}) {
  const center: [number, number] = value ? [value.lat, value.lng] : DEFAULT_CENTER;

  const markerHandlers = useMemo(
    () => ({
      dragend(e: L.LeafletEvent) {
        const ll = (e.target as L.Marker).getLatLng();
        onChange({ lat: ll.lat, lng: ll.lng });
      },
    }),
    [onChange]
  );

  return (
    <MapContainer center={center} zoom={value ? 16 : 13} scrollWheelZoom={false}>
      <TileLayer
        attribution="&copy; участники OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapInteractions onPick={onChange} />
      <Recenter target={focus} />
      {value && (
        <Marker position={[value.lat, value.lng]} draggable icon={pinIcon} eventHandlers={markerHandlers} />
      )}
    </MapContainer>
  );
}

"use client";
import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";

export const isNative = () => Capacitor.isNativePlatform();

type Position = { lat: number; lng: number };

async function nativePosition(): Promise<Position> {
  const perm = await Geolocation.requestPermissions();
  if (perm.location !== "granted" && perm.coarseLocation !== "granted") {
    throw new Error("Доступ к геопозиции не разрешён");
  }
  try {
    // Сначала точное определение по GPS; в помещении оно часто не успевает…
    const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 12000 });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch {
    // …тогда довольствуемся приблизительным местом по сети (Wi-Fi и вышки)
    const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  }
}

export async function getCurrentPosition(): Promise<Position> {
  if (isNative()) return nativePosition();
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Геолокация недоступна"));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (e) => reject(new Error(e.message)),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
    );
  });
}

/**
 * Следит за положением пользователя и вызывает onPos при каждом обновлении.
 * Возвращает функцию, которая останавливает слежение (вызывайте её, когда карта закрывается — это экономит батарею).
 */
export async function watchPosition(onPos: (p: Position) => void, onError?: () => void): Promise<() => void> {
  if (isNative()) {
    const perm = await Geolocation.requestPermissions().catch(() => null);
    if (!perm || (perm.location !== "granted" && perm.coarseLocation !== "granted")) {
      onError?.();
      return () => {};
    }
    const id = await Geolocation.watchPosition({ enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 }, (pos) => {
      if (pos) onPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      else onError?.();
    });
    return () => {
      Geolocation.clearWatch({ id });
    };
  }
  if (!navigator.geolocation) {
    onError?.();
    return () => {};
  }
  const id = navigator.geolocation.watchPosition(
    (p) => onPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
    () => onError?.(),
    { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
  );
  return () => navigator.geolocation.clearWatch(id);
}

export type PhotoSource = "camera" | "gallery";

/** Native gallery uses Android's system photo picker without broad storage access. */
export async function takePhoto(source: PhotoSource = "camera"): Promise<File | null> {
  if (isNative()) {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: source === "gallery" ? CameraSource.Photos : CameraSource.Camera,
        quality: 85,
        correctOrientation: true,
      });
      if (!photo.webPath) throw new Error("Не удалось получить фото");
      const res = await fetch(photo.webPath);
      if (!res.ok) throw new Error("Не удалось получить фото");
      const blob = await res.blob();
      return new File([blob], `photo.${photo.format || "jpeg"}`, { type: blob.type || "image/jpeg" });
    } catch (error) {
      if (error instanceof Error && /cancel(?:led|ed|ation)?/i.test(error.message)) return null;
      throw error;
    }
  }
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    // Omitting capture is essential: on mobile browsers it allows gallery selection.
    if (source === "camera") input.setAttribute("capture", "environment");
    input.hidden = true;
    const finish = (file: File | null) => {
      input.remove();
      resolve(file);
    };
    input.onchange = () => finish(input.files?.[0] ?? null);
    input.addEventListener("cancel", () => finish(null), { once: true });
    document.body.appendChild(input);
    input.click();
  });
}

"use client";
import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";

export const isNative = () => Capacitor.isNativePlatform();

export async function getCurrentPosition(): Promise<{ lat: number; lng: number }> {
  if (isNative()) {
    const perm = await Geolocation.requestPermissions();
    if (perm.location !== "granted" && perm.coarseLocation !== "granted") {
      throw new Error("Доступ к геопозиции не разрешён");
    }
    const pos = await Geolocation.getCurrentPosition();
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  }
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Геолокация недоступна"));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (e) => reject(new Error(e.message))
    );
  });
}

/** Возвращает File с фото: с камеры телефона в приложении, из выбора файла в браузере. */
export async function takePhoto(): Promise<File> {
  if (isNative()) {
    const photo = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 85,
    });
    const res = await fetch(photo.webPath!);
    const blob = await res.blob();
    return new File([blob], "photo.jpg", { type: blob.type || "image/jpeg" });
  }
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";
    input.onchange = () => {
      const f = input.files?.[0];
      f ? resolve(f) : reject(new Error("Файл не выбран"));
    };
    input.click();
  });
}

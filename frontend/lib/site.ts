import { Capacitor } from "@capacitor/core";

/**
 * Публичный адрес сайта — на него ведёт ссылка из письма с подтверждением регистрации.
 * Берётся из NEXT_PUBLIC_SITE_URL; если не задан, в браузере используется текущий адрес сайта.
 * В мобильном приложении собственный адрес (https://localhost) не подходит, поэтому там NEXT_PUBLIC_SITE_URL обязателен.
 */
export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  if (configured) return configured;
  if (Capacitor.isNativePlatform() || typeof window === "undefined") return "";
  return window.location.origin;
}

import { supabase } from "./supabase";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/** Единая точка обращения к FastAPI. Секретных ключей здесь нет — только JWT пользователя. */
export async function api<T>(path: string, init: RequestInit = {}, auth = false): Promise<T> {
  const headers = new Headers(init.headers);
  if (auth) {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new Error("Нужно войти в аккаунт");
    headers.set("Authorization", `Bearer ${data.session.access_token}`);
  }
  const res = await fetch(BASE + path, { ...init, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(typeof body?.detail === "string" ? body.detail : `Ошибка ${res.status}`);
  }
  if (res.status === 204) return undefined as T; // например, успешное удаление — тела нет
  return res.json();
}

/** Скачивает файл с защищённого эндпоинта (например, CSV для администратора): кладёт токен в заголовок и сохраняет файл. */
export async function downloadFile(path: string, filename: string): Promise<void> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error("Нужно войти в аккаунт");
  const res = await fetch(BASE + path, { headers: { Authorization: `Bearer ${data.session.access_token}` } });
  if (!res.ok) throw new Error(`Ошибка ${res.status}`);
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

"use client";
import { useCallback, useEffect, useState } from "react";
import { api, downloadFile } from "@/lib/api";
import { useSession } from "@/lib/useSession";
import type { AdminReport, BlockedUser, CleanupAdmin, FlaggedReport } from "@/lib/types";

type Tab = "reports" | "cleanups" | "flags" | "blocked";

const osmLink = (lat: number, lng: number) =>
  `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;

export default function AdminPage() {
  const { loading, isAdmin } = useSession();
  const [tab, setTab] = useState<Tab>("reports");
  const [items, setItems] = useState<AdminReport[]>([]);
  const [cleanups, setCleanups] = useState<CleanupAdmin[]>([]);
  const [flags, setFlags] = useState<FlaggedReport[]>([]);
  const [blocked, setBlocked] = useState<BlockedUser[]>([]);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const fail = (e: unknown) => setError(e instanceof Error ? e.message : "Ошибка");

  const loadAll = useCallback(() => {
    api<AdminReport[]>("/api/admin/reports?status=needs_review", {}, true).then(setItems).catch(fail);
    api<CleanupAdmin[]>("/api/admin/cleanups?status=needs_review", {}, true).then(setCleanups).catch(fail);
    api<FlaggedReport[]>("/api/admin/flags", {}, true).then(setFlags).catch(fail);
    api<BlockedUser[]>("/api/admin/blocked", {}, true).then(setBlocked).catch(fail);
  }, []);

  useEffect(() => {
    if (isAdmin) loadAll();
  }, [isAdmin, loadAll]);

  const post = (path: string, body?: unknown) =>
    api(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body ?? {}) }, true);

  async function decide(id: string, approve: boolean) {
    try {
      await post(`/api/admin/reports/${id}/decision`, { approve });
      setItems((xs) => xs.filter((x) => x.id !== id));
    } catch (e) { fail(e); }
  }

  async function resolveManually(id: string, fromFlags = false) {
    if (!confirm("Снять эту точку с карты без фото-подтверждения?")) return;
    try {
      await api(`/api/admin/reports/${id}/resolve`, { method: "POST" }, true);
      setItems((xs) => xs.filter((x) => x.id !== id));
      if (fromFlags) setFlags((xs) => xs.filter((x) => x.id !== id));
    } catch (e) { fail(e); }
  }

  async function deleteReport(id: string) {
    if (!confirm("Удалить заявку и её фото безвозвратно?")) return;
    try {
      await api(`/api/admin/reports/${id}`, { method: "DELETE" }, true);
      setItems((xs) => xs.filter((x) => x.id !== id));
      setFlags((xs) => xs.filter((x) => x.id !== id));
    } catch (e) { fail(e); }
  }

  async function decideCleanup(id: string, approve: boolean) {
    try {
      await post(`/api/admin/cleanups/${id}/decision`, { approve });
      setCleanups((xs) => xs.filter((x) => x.id !== id));
    } catch (e) { fail(e); }
  }

  async function dismissFlags(id: string) {
    try {
      await post(`/api/admin/reports/${id}/dismiss-flags`);
      setFlags((xs) => xs.filter((x) => x.id !== id));
    } catch (e) { fail(e); }
  }

  async function blockAuthor(userId: string) {
    const reason = window.prompt("Причина блокировки автора (необязательно):");
    if (reason === null) return; // нажали «Отмена»
    try {
      await post(`/api/admin/users/${userId}/block`, { reason: reason.trim() || null });
      setInfo("Автор заблокирован: он больше не сможет отправлять заявки, голоса и жалобы.");
      api<BlockedUser[]>("/api/admin/blocked", {}, true).then(setBlocked).catch(fail);
    } catch (e) { fail(e); }
  }

  async function unblock(userId: string) {
    try {
      await api(`/api/admin/users/${userId}/block`, { method: "DELETE" }, true);
      setBlocked((xs) => xs.filter((x) => x.user_id !== userId));
    } catch (e) { fail(e); }
  }

  async function exportCsv(scope: "active" | "resolved" | "all") {
    try {
      await downloadFile(`/api/admin/export.csv?scope=${scope}`, `ecostep-${scope}.csv`);
    } catch (e) { fail(e); }
  }

  if (loading) return null;
  if (!isAdmin) return <p className="p-8 text-center text-slate-500">Доступ только для администраторов.</p>;

  const tabBtn = (id: Tab, label: string, n: number) => (
    <button
      key={id}
      onClick={() => setTab(id)}
      className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${tab === id ? "bg-emerald-600 text-white" : "bg-white text-slate-600"}`}
    >
      {label} ({n})
    </button>
  );
  const btn = "rounded-lg px-4 py-1.5 font-semibold text-white";

  const AuthorLine = ({ r }: { r: AdminReport }) => (
    <p className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
      Автор: {r.user_id.slice(0, 8)}…
      <button onClick={() => blockAuthor(r.user_id)} className="text-red-600 hover:underline">🚫 Заблокировать автора</button>
    </p>
  );

  return (
    <div className="safe-bottom mx-auto max-w-3xl space-y-3 p-4">
      <div className="flex flex-wrap gap-2">
        {tabBtn("reports", "Сомнительные заявки", items.length)}
        {tabBtn("cleanups", "Заявки на уборку", cleanups.length)}
        {tabBtn("flags", "Жалобы", flags.length)}
        {tabBtn("blocked", "Заблокированные", blocked.length)}
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-white p-2 text-sm">
        <span className="text-slate-500">Выгрузка CSV для ответственных служб:</span>
        <button onClick={() => exportCsv("active")} className="rounded-lg border px-3 py-1 hover:bg-slate-50">Точки на карте</button>
        <button onClick={() => exportCsv("resolved")} className="rounded-lg border px-3 py-1 hover:bg-slate-50">Убранные</button>
        <button onClick={() => exportCsv("all")} className="rounded-lg border px-3 py-1 hover:bg-slate-50">Все заявки</button>
      </div>

      {error && <p className="text-red-600">{error}</p>}
      {info && <p className="text-emerald-700">{info}</p>}

      {tab === "reports" && (
        <>
          {items.length === 0 && <p className="text-slate-500">Очередь пуста 🎉</p>}
          {items.map((r) => (
            <div key={r.id} className="flex flex-col gap-3 rounded-xl border bg-white p-3 sm:flex-row">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.photo_url} alt="" className="h-40 w-full rounded-lg object-cover sm:w-52" />
              <div className="flex-1 space-y-1 text-sm">
                <p><b>{r.category ?? "—"}</b> · уверенность ИИ: {r.ai_confidence != null ? Math.round(r.ai_confidence * 100) + "%" : "—"}</p>
                <p>{r.description ?? "ИИ не смог описать"}</p>
                {r.user_comment && <p className="text-slate-500">Комментарий: {r.user_comment}</p>}
                <p className="text-slate-400">{r.moderation_note}</p>
                {r.flag_count > 0 && <p className="text-red-600">⚑ Жалоб: {r.flag_count}</p>}
                <a className="text-emerald-700 underline" target="_blank" rel="noreferrer" href={osmLink(r.latitude, r.longitude)}>
                  Открыть место на карте
                </a>
                <AuthorLine r={r} />
                <div className="flex flex-wrap gap-2 pt-2">
                  <button onClick={() => decide(r.id, true)} className={`${btn} bg-emerald-600`}>Опубликовать</button>
                  <button onClick={() => decide(r.id, false)} className={`${btn} bg-red-600`}>Отклонить</button>
                  <button onClick={() => resolveManually(r.id)} className="rounded-lg bg-slate-200 px-4 py-1.5 font-semibold text-slate-700">Снять с карты</button>
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {tab === "cleanups" && (
        <>
          {cleanups.length === 0 && <p className="text-slate-500">Очередь пуста 🎉</p>}
          {cleanups.map((c) => (
            <div key={c.id} className="space-y-2 rounded-xl border bg-white p-3">
              <p className="text-sm"><b>{c.report_category ?? "Загрязнение"}</b> — {c.report_description}</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="mb-1 text-xs text-slate-500">Было</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.report_photo_url} alt="" className="h-32 w-full rounded-lg object-cover" />
                </div>
                <div>
                  <p className="mb-1 text-xs text-slate-500">Стало (новое фото)</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.photo_url} alt="" className="h-32 w-full rounded-lg object-cover" />
                </div>
              </div>
              <p className="text-sm text-slate-600">Уверенность ИИ: {c.ai_confidence != null ? Math.round(c.ai_confidence * 100) + "%" : "—"}</p>
              <p className="text-sm text-slate-400">{c.moderation_note}</p>
              <a className="text-sm text-emerald-700 underline" target="_blank" rel="noreferrer" href={osmLink(c.report_latitude, c.report_longitude)}>
                Открыть место на карте
              </a>
              <p className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                Автор заявки на уборку: {c.user_id.slice(0, 8)}…
                <button onClick={() => blockAuthor(c.user_id)} className="text-red-600 hover:underline">🚫 Заблокировать</button>
              </p>
              <div className="flex gap-2 pt-1">
                <button onClick={() => decideCleanup(c.id, true)} className={`${btn} bg-emerald-600`}>Подтвердить, убрано</button>
                <button onClick={() => decideCleanup(c.id, false)} className={`${btn} bg-red-600`}>Отклонить</button>
              </div>
            </div>
          ))}
        </>
      )}

      {tab === "flags" && (
        <>
          <p className="text-xs text-slate-500">
            3 жалобы от разных пользователей автоматически скрывают точку с публичной карты до вашего решения.
          </p>
          {flags.length === 0 && <p className="text-slate-500">Жалоб нет 🎉</p>}
          {flags.map((r) => (
            <div key={r.id} className="flex flex-col gap-3 rounded-xl border bg-white p-3 sm:flex-row">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.photo_url} alt="" className="h-40 w-full rounded-lg object-cover sm:w-52" />
              <div className="flex-1 space-y-1 text-sm">
                <p><b>{r.category ?? "—"}</b> · статус: {r.status}</p>
                <p>{r.description}</p>
                <p className="text-red-600">⚑ Жалоб: {r.flag_count}{r.flag_count >= 3 ? " — точка скрыта с карты" : ""}</p>
                {r.flag_reasons.length > 0 && <p className="text-slate-500">Причины: {r.flag_reasons.join("; ")}</p>}
                <a className="text-emerald-700 underline" target="_blank" rel="noreferrer" href={osmLink(r.latitude, r.longitude)}>
                  Открыть место на карте
                </a>
                <AuthorLine r={r} />
                <div className="flex flex-wrap gap-2 pt-2">
                  <button onClick={() => dismissFlags(r.id)} className={`${btn} bg-emerald-600`}>Жалобы необоснованны</button>
                  <button onClick={() => resolveManually(r.id, true)} className="rounded-lg bg-slate-200 px-4 py-1.5 font-semibold text-slate-700">Снять с карты</button>
                  <button onClick={() => deleteReport(r.id)} className={`${btn} bg-red-600`}>Удалить</button>
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {tab === "blocked" && (
        <>
          {blocked.length === 0 && <p className="text-slate-500">Заблокированных пользователей нет.</p>}
          {blocked.map((b) => (
            <div key={b.user_id} className="flex items-center justify-between gap-3 rounded-xl border bg-white p-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-mono text-xs">{b.user_id}</p>
                <p className="text-slate-500">{b.reason || "без указания причины"}</p>
                <p className="text-xs text-slate-400">{new Date(b.created_at).toLocaleString("ru-RU")}</p>
              </div>
              <button onClick={() => unblock(b.user_id)} className="shrink-0 rounded-lg border px-3 py-1.5 font-medium hover:bg-slate-50">
                Разблокировать
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useSession } from "@/lib/useSession";
import type { AdminReport, CleanupAdmin } from "@/lib/types";

export default function AdminPage() {
  const { loading, isAdmin } = useSession();
  const [tab, setTab] = useState<"reports" | "cleanups">("reports");
  const [items, setItems] = useState<AdminReport[]>([]);
  const [cleanups, setCleanups] = useState<CleanupAdmin[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAdmin) return;
    api<AdminReport[]>("/api/admin/reports?status=needs_review", {}, true).then(setItems).catch((e) => setError(e.message));
    api<CleanupAdmin[]>("/api/admin/cleanups?status=needs_review", {}, true).then(setCleanups).catch((e) => setError(e.message));
  }, [isAdmin]);

  async function decide(id: string, approve: boolean) {
    try {
      await api(`/api/admin/reports/${id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approve }),
      }, true);
      setItems((xs) => xs.filter((x) => x.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    }
  }

  async function resolveManually(id: string) {
    if (!confirm("Снять эту точку с карты без фото-подтверждения?")) return;
    try {
      await api(`/api/admin/reports/${id}/resolve`, { method: "POST" }, true);
      setItems((xs) => xs.filter((x) => x.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    }
  }

  async function decideCleanup(id: string, approve: boolean) {
    try {
      await api(`/api/admin/cleanups/${id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approve }),
      }, true);
      setCleanups((xs) => xs.filter((x) => x.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    }
  }

  if (loading) return null;
  if (!isAdmin) return <p className="p-8 text-center text-slate-500">Доступ только для администраторов.</p>;

  return (
    <div className="safe-bottom mx-auto max-w-3xl space-y-3 p-4">
      <div className="flex gap-2">
        <button onClick={() => setTab("reports")}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${tab === "reports" ? "bg-emerald-600 text-white" : "bg-white text-slate-600"}`}>
          Сомнительные заявки ({items.length})
        </button>
        <button onClick={() => setTab("cleanups")}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${tab === "cleanups" ? "bg-emerald-600 text-white" : "bg-white text-slate-600"}`}>
          Заявки на уборку ({cleanups.length})
        </button>
      </div>
      {error && <p className="text-red-600">{error}</p>}

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
                <a className="text-emerald-700 underline" target="_blank" rel="noreferrer"
                  href={`https://www.openstreetmap.org/?mlat=${r.latitude}&mlon=${r.longitude}#map=17/${r.latitude}/${r.longitude}`}>
                  Открыть место на карте
                </a>
                <div className="flex flex-wrap gap-2 pt-2">
                  <button onClick={() => decide(r.id, true)} className="rounded-lg bg-emerald-600 px-4 py-1.5 font-semibold text-white">Опубликовать</button>
                  <button onClick={() => decide(r.id, false)} className="rounded-lg bg-red-600 px-4 py-1.5 font-semibold text-white">Отклонить</button>
                  <button onClick={() => resolveManually(r.id)} className="rounded-lg bg-slate-200 px-4 py-1.5 font-semibold text-slate-700">
                    Снять с карты
                  </button>
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
              <p className="text-sm text-slate-600">
                Уверенность ИИ: {c.ai_confidence != null ? Math.round(c.ai_confidence * 100) + "%" : "—"}
              </p>
              <p className="text-sm text-slate-400">{c.moderation_note}</p>
              <a className="text-sm text-emerald-700 underline" target="_blank" rel="noreferrer"
                href={`https://www.openstreetmap.org/?mlat=${c.report_latitude}&mlon=${c.report_longitude}#map=17/${c.report_latitude}/${c.report_longitude}`}>
                Открыть место на карте
              </a>
              <div className="flex gap-2 pt-1">
                <button onClick={() => decideCleanup(c.id, true)} className="rounded-lg bg-emerald-600 px-4 py-1.5 font-semibold text-white">
                  Подтвердить, убрано
                </button>
                <button onClick={() => decideCleanup(c.id, false)} className="rounded-lg bg-red-600 px-4 py-1.5 font-semibold text-white">
                  Отклонить
                </button>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

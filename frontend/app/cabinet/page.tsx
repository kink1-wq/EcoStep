"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useSession } from "@/lib/useSession";
import type { Report } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";

export default function CabinetPage() {
  const router = useRouter();
  const { session, loading } = useSession();
  const [items, setItems] = useState<Report[] | null>(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  const load = useCallback(() => {
    api<Report[]>("/api/reports/mine", {}, true).then(setItems).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!session) return router.replace("/login");
    load();
  }, [loading, session, router, load]);

  // Пока ИИ анализирует заявки — обновляем список
  useEffect(() => {
    if (!items?.some((r) => r.status === "pending")) return;
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [items, load]);

  async function removeOne(id: string) {
    if (!confirm("Удалить эту заявку из истории? Действие необратимо.")) return;
    setBusyId(id); setError("");
    try {
      await api(`/api/reports/${id}`, { method: "DELETE" }, true);
      setItems((xs) => xs?.filter((x) => x.id !== id) ?? xs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось удалить");
    } finally {
      setBusyId(null);
    }
  }

  async function clearAll() {
    if (!items?.length) return;
    if (!confirm("Очистить всю историю заявок? Действие необратимо и уберёт ваши точки с карты.")) return;
    setClearing(true); setError("");
    try {
      await api("/api/reports/mine", { method: "DELETE" }, true);
      setItems([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось очистить историю");
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="safe-bottom mx-auto max-w-2xl space-y-3 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Мои заявки</h1>
        {!!items?.length && (
          <button
            onClick={clearAll}
            disabled={clearing}
            className="rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-300 disabled:opacity-50"
          >
            {clearing ? "Очистка…" : "Очистить всё"}
          </button>
        )}
      </div>
      {error && <p className="text-red-600">{error}</p>}
      {items?.length === 0 && <p className="text-slate-500">Пока пусто. Сообщите о первой проблеме!</p>}
      {items?.map((r) => (
        <div key={r.id} className="flex gap-3 rounded-xl border bg-white p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={r.photo_url} alt="" className="h-20 w-20 rounded-lg object-cover" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <b className="truncate">{r.category ?? "Анализ…"}</b>
              <StatusBadge status={r.status} />
            </div>
            <p className="line-clamp-2 text-sm text-slate-600">{r.description}</p>
            <div className="flex items-center justify-between">
              <small className="text-slate-400">{new Date(r.created_at).toLocaleString("ru-RU")}</small>
              <button
                onClick={() => removeOne(r.id)}
                disabled={busyId === r.id}
                className="text-xs text-red-600 hover:underline disabled:opacity-50"
              >
                {busyId === r.id ? "Удаление…" : "Удалить"}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

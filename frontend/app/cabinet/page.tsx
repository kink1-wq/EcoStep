"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useSession } from "@/lib/useSession";
import type { MyCleanup, Report } from "@/lib/types";
import StatusBadge, { CleanupStatusBadge } from "@/components/StatusBadge";

type Item =
  | { kind: "report"; at: number; data: Report }
  | { kind: "cleanup"; at: number; data: MyCleanup };

export default function CabinetPage() {
  const router = useRouter();
  const { session, loading } = useSession();
  const [reports, setReports] = useState<Report[] | null>(null);
  const [cleanups, setCleanups] = useState<MyCleanup[]>([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  const load = useCallback(() => {
    // Если сервер ещё не обновлён и не знает про заявки на уборку — просто показываем остальное
    const loadCleanups = api<MyCleanup[]>("/api/cleanups/mine", {}, true).catch(() => [] as MyCleanup[]);
    Promise.all([api<Report[]>("/api/reports/mine", {}, true), loadCleanups])
      .then(([r, c]) => {
        setReports(r);
        setCleanups(c);
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!session) return router.replace("/login");
    load();
  }, [loading, session, router, load]);

  // Общая лента: заявки о загрязнении и заявки на уборку — от новых к старым
  const items = useMemo<Item[]>(() => {
    const all: Item[] = [
      ...(reports ?? []).map((data) => ({ kind: "report" as const, at: Date.parse(data.created_at), data })),
      ...cleanups.map((data) => ({ kind: "cleanup" as const, at: Date.parse(data.created_at), data })),
    ];
    return all.sort((a, b) => b.at - a.at);
  }, [reports, cleanups]);

  // Пока ИИ анализирует заявки — обновляем список
  const hasPending = (reports ?? []).some((r) => r.status === "pending") || cleanups.some((c) => c.status === "pending");
  useEffect(() => {
    if (!hasPending) return;
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [hasPending, load]);

  async function removeReport(id: string) {
    if (!confirm("Удалить эту заявку из истории? Действие необратимо.")) return;
    setBusyId(id); setError("");
    try {
      await api(`/api/reports/${id}`, { method: "DELETE" }, true);
      setReports((xs) => xs?.filter((x) => x.id !== id) ?? xs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось удалить");
    } finally {
      setBusyId(null);
    }
  }

  async function removeCleanup(id: string) {
    if (!confirm("Удалить эту заявку на уборку из истории?")) return;
    setBusyId(id); setError("");
    try {
      await api(`/api/cleanups/${id}`, { method: "DELETE" }, true);
      setCleanups((xs) => xs.filter((x) => x.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось удалить");
    } finally {
      setBusyId(null);
    }
  }

  async function clearAll() {
    if (!items.length) return;
    if (!confirm("Очистить всю историю? Действие необратимо: ваши заявки пропадут вместе с точками на карте, а заявки на уборку — из списка.")) return;
    setClearing(true); setError("");
    try {
      await api("/api/reports/mine", { method: "DELETE" }, true);
      await api("/api/cleanups/mine", { method: "DELETE" }, true);
      setReports([]);
      setCleanups([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось очистить историю");
      load();
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="safe-bottom mx-auto max-w-2xl space-y-3 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Мои заявки</h1>
        {items.length > 0 && (
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
      {reports !== null && items.length === 0 && (
        <p className="text-slate-500">Пока пусто. Сообщите о первой проблеме!</p>
      )}

      {items.map((item) =>
        item.kind === "report" ? (
          <div key={`r-${item.data.id}`} className="flex gap-3 rounded-xl border bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.data.photo_url} alt="" className="h-20 w-20 shrink-0 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <b className="truncate">{item.data.category ?? "Анализ…"}</b>
                <StatusBadge status={item.data.status} />
              </div>
              <p className="line-clamp-2 text-sm text-slate-600">{item.data.description}</p>
              <div className="flex items-center justify-between">
                <small className="text-slate-400">{new Date(item.data.created_at).toLocaleString("ru-RU")}</small>
                <button
                  onClick={() => removeReport(item.data.id)}
                  disabled={busyId === item.data.id}
                  className="text-xs text-red-600 hover:underline disabled:opacity-50"
                >
                  {busyId === item.data.id ? "Удаление…" : "Удалить"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div key={`c-${item.data.id}`} className="flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50/40 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.data.photo_url} alt="" className="h-20 w-20 shrink-0 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <b className="truncate">🧹 Заявка на уборку</b>
                <CleanupStatusBadge status={item.data.status} />
              </div>
              <p className="line-clamp-2 text-sm text-slate-600">
                Точка: {item.data.report_category ?? "загрязнение"}
                {item.data.report_description ? ` — ${item.data.report_description}` : ""}
              </p>
              <div className="flex items-center justify-between">
                <small className="text-slate-400">{new Date(item.data.created_at).toLocaleString("ru-RU")}</small>
                <button
                  onClick={() => removeCleanup(item.data.id)}
                  disabled={busyId === item.data.id}
                  className="text-xs text-red-600 hover:underline disabled:opacity-50"
                >
                  {busyId === item.data.id ? "Удаление…" : "Удалить"}
                </button>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}

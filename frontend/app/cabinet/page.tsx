"use client";
import Link from "@/components/MotionLink";
import { StepArt } from "@/components/Brand";
import Icon from "@/components/Icon";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useSession } from "@/lib/useSession";
import { useI18n } from "@/lib/i18n";
import type { MyCleanup, Report } from "@/lib/types";
import StatusBadge, { CleanupStatusBadge } from "@/components/StatusBadge";

type Item =
  | { kind: "report"; at: number; data: Report }
  | { kind: "cleanup"; at: number; data: MyCleanup };

export default function CabinetPage() {
  const router = useRouter();
  const { session, loading } = useSession();
  const { t, err, category, desc, date } = useI18n();
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
      .catch((e) => setError(err(e.message)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [hasPending, load]);

  async function removeReport(id: string) {
    if (!confirm(t("cabinet.confirmReport"))) return;
    setBusyId(id);
    setError("");
    try {
      await api(`/api/reports/${id}`, { method: "DELETE" }, true);
      setReports((xs) => xs?.filter((x) => x.id !== id) ?? xs);
    } catch (e) {
      setError(e instanceof Error ? err(e.message) : t("cabinet.deleteFail"));
    } finally {
      setBusyId(null);
    }
  }

  async function removeCleanup(id: string) {
    if (!confirm(t("cabinet.confirmCleanup"))) return;
    setBusyId(id);
    setError("");
    try {
      await api(`/api/cleanups/${id}`, { method: "DELETE" }, true);
      setCleanups((xs) => xs.filter((x) => x.id !== id));
    } catch (e) {
      setError(e instanceof Error ? err(e.message) : t("cabinet.deleteFail"));
    } finally {
      setBusyId(null);
    }
  }

  async function clearAll() {
    if (!items.length) return;
    if (!confirm(t("cabinet.confirmAll"))) return;
    setClearing(true);
    setError("");
    try {
      await api("/api/reports/mine", { method: "DELETE" }, true);
      await api("/api/cleanups/mine", { method: "DELETE" }, true);
      setReports([]);
      setCleanups([]);
    } catch (e) {
      setError(e instanceof Error ? err(e.message) : t("cabinet.clearFail"));
      load();
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="safe-bottom mx-auto max-w-2xl space-y-3 p-4">
      <div className="flex items-center justify-between">
        <div className="page-intro"><div className="eyebrow">ECOSTEP / {t("brand.impact")}</div><h1>{t("cabinet.title")}</h1><p>{t("brand.cabinetIntro")}</p></div>
        {items.length > 0 && (
          <button
            onClick={clearAll}
            disabled={clearing}
            className="rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-300 disabled:opacity-50"
          >
            {clearing ? t("cabinet.clearing") : t("cabinet.clear")}
          </button>
        )}
      </div>
      {error && <p className="text-red-600">{error}</p>}
      {reports !== null && items.length === 0 && <div className="empty-state"><StepArt step={3}/><h2>{t("brand.emptyTitle")}</h2><p>{t("brand.emptyText")}</p><Link href="/report" className="button button-primary"><Icon name="plus"/>{t("brand.firstStep")}</Link></div>}
      {reports === null && !error && <p role="status" className="text-sm text-slate-500">{t("brand.loading")}</p>}

      {items.map((item) =>
        item.kind === "report" ? (
          <div key={`r-${item.data.id}`} className="flex gap-3 rounded-xl border bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.data.photo_url} alt="" className="h-20 w-20 shrink-0 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <b className="truncate">{category(item.data.category) || t("cabinet.analyzing")}</b>
                <StatusBadge status={item.data.status} />
              </div>
              <p className="line-clamp-2 text-sm text-slate-600">{desc(item.data)}</p>
              {item.data.support_count > 0 && (
                <p className="text-xs text-emerald-700"><Icon name="eye" className="inline-icon"/> {t("map.supportCount", { n: item.data.support_count })}</p>
              )}
              <div className="flex items-center justify-between">
                <small className="text-slate-400">{date(item.data.created_at, true)}</small>
                <button
                  onClick={() => removeReport(item.data.id)}
                  disabled={busyId === item.data.id}
                  className="text-xs text-red-600 hover:underline disabled:opacity-50"
                >
                  {busyId === item.data.id ? t("cabinet.deleting") : t("cabinet.delete")}
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
                <b className="truncate">{t("cabinet.cleanupTitle")}</b>
                <CleanupStatusBadge status={item.data.status} />
              </div>
              <p className="line-clamp-2 text-sm text-slate-600">
                {t("cabinet.point", { c: category(item.data.report_category) || t("cabinet.pointDefault") })}
                {(() => {
                  const d = desc({ description: item.data.report_description, description_kk: item.data.report_description_kk });
                  return d ? ` — ${d}` : "";
                })()}
              </p>
              <div className="flex items-center justify-between">
                <small className="text-slate-400">{date(item.data.created_at, true)}</small>
                <button
                  onClick={() => removeCleanup(item.data.id)}
                  disabled={busyId === item.data.id}
                  className="text-xs text-red-600 hover:underline disabled:opacity-50"
                >
                  {busyId === item.data.id ? t("cabinet.deleting") : t("cabinet.delete")}
                </button>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import type { AIBlock, ArchiveItem, Stats } from "@/lib/types";

const pct = (x: number | null) => (x === null ? null : `${Math.round(x * 100)}%`);

function Card({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="rounded-2xl border bg-white p-3">
      <div className={`text-2xl font-bold ${accent ?? "text-slate-900"}`}>{value}</div>
      <div className="mt-0.5 text-xs text-slate-500">{label}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-2xl border bg-white p-4">
      <h2 className="font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Legend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <div className="flex flex-wrap gap-3 text-xs text-slate-600">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          <span className={`inline-block h-2.5 w-2.5 rounded-sm ${i.color}`} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

function AIPanel({ title, block }: { title: string; block: AIBlock }) {
  const { t } = useI18n();
  const noData = (v: string | null) => v ?? t("stats.aiNoData");
  return (
    <div className="space-y-2 rounded-xl bg-slate-50 p-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <div className="text-xl font-bold text-emerald-700">{noData(pct(block.auto_share))}</div>
          <div className="text-xs text-slate-500">
            {t("stats.aiAuto")}
            {block.analyzed > 0 && ` (${block.auto} / ${block.analyzed})`}
          </div>
        </div>
        <div>
          <div className="text-xl font-bold text-emerald-700">{noData(pct(block.agreement))}</div>
          <div className="text-xs text-slate-500">
            {t("stats.aiAgree")}
            {block.reviewed_with_verdict > 0 && ` (${block.reviewed_with_verdict})`}
          </div>
        </div>
        <div>
          <div className="text-xl font-bold text-emerald-700">{noData(pct(block.avg_confidence_auto))}</div>
          <div className="text-xs text-slate-500">{t("stats.aiConf")}</div>
        </div>
      </div>
    </div>
  );
}

export default function StatsPage() {
  const { t, category, desc, date } = useI18n();
  const [stats, setStats] = useState<Stats | null>(null);
  const [archive, setArchive] = useState<ArchiveItem[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api<Stats>("/api/stats").then(setStats).catch(() => setFailed(true));
    api<ArchiveItem[]>("/api/reports/archive?limit=12").then(setArchive).catch(() => setArchive([]));
  }, []);

  if (failed) return <p className="p-8 text-center text-red-600">{t("stats.loadFail")}</p>;
  if (!stats) return <p className="p-8 text-center text-slate-500">{t("stats.loading")}</p>;

  const maxCat = Math.max(1, ...stats.by_category.map((c) => c.active + c.resolved));
  const maxDay = Math.max(1, ...stats.by_day.flatMap((d) => [d.reported, d.resolved]));
  const dayLabel = (iso: string) => iso.slice(8, 10) + "." + iso.slice(5, 7);

  return (
    <div className="safe-bottom mx-auto max-w-3xl space-y-4 p-4">
      <div>
        <h1 className="text-xl font-bold">📊 {t("stats.title")}</h1>
        <p className="text-sm text-slate-500">{t("stats.subtitle")}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Card label={t("stats.total")} value={stats.total} />
        <Card label={t("stats.active")} value={stats.active} accent="text-amber-600" />
        <Card label={t("stats.resolved")} value={stats.resolved} accent="text-emerald-600" />
        <Card label={t("stats.rate")} value={pct(stats.resolution_rate) ?? "—"} accent="text-emerald-600" />
        <Card
          label={t("stats.avgDays")}
          value={stats.avg_days_to_resolve === null ? "—" : t("stats.days", { n: stats.avg_days_to_resolve })}
        />
        <Card label={t("stats.supports")} value={stats.supports} />
        <Card label={t("stats.cleanups")} value={stats.cleanups_confirmed} />
      </div>

      {stats.by_category.length > 0 && (
        <Section title={t("stats.byCategory")}>
          <Legend
            items={[
              { color: "bg-amber-500", label: t("stats.legendActive") },
              { color: "bg-emerald-500", label: t("stats.legendResolved") },
            ]}
          />
          <div className="space-y-2">
            {stats.by_category.map((c) => (
              <div key={c.category}>
                <div className="mb-0.5 flex justify-between text-sm">
                  <span>{category(c.category)}</span>
                  <span className="text-slate-500">{c.active + c.resolved}</span>
                </div>
                <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
                  <div className="bg-amber-500" style={{ width: `${(c.active / maxCat) * 100}%` }} />
                  <div className="bg-emerald-500" style={{ width: `${(c.resolved / maxCat) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title={t("stats.byDay")}>
        <Legend
          items={[
            { color: "bg-amber-500", label: t("stats.legendNew") },
            { color: "bg-emerald-500", label: t("stats.legendResolved") },
          ]}
        />
        <div className="flex h-28 items-end gap-[3px]">
          {stats.by_day.map((d) => (
            <div key={d.date} className="flex h-full flex-1 items-end gap-px" title={`${dayLabel(d.date)}: +${d.reported} / ✓${d.resolved}`}>
              <div className="flex-1 rounded-t bg-amber-500" style={{ height: `${(d.reported / maxDay) * 100}%`, minHeight: d.reported ? 3 : 0 }} />
              <div className="flex-1 rounded-t bg-emerald-500" style={{ height: `${(d.resolved / maxDay) * 100}%`, minHeight: d.resolved ? 3 : 0 }} />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-slate-400">
          <span>{dayLabel(stats.by_day[0].date)}</span>
          <span>{dayLabel(stats.by_day[stats.by_day.length - 1].date)}</span>
        </div>
      </Section>

      <Section title={`🤖 ${t("stats.aiTitle")}`}>
        <AIPanel title={t("stats.aiReports")} block={stats.ai_reports} />
        <AIPanel title={t("stats.aiCleanups")} block={stats.ai_cleanups} />
      </Section>

      <Section title={`🧹 ${t("stats.archive")}`}>
        {archive === null ? (
          <p className="text-sm text-slate-500">{t("stats.loading")}</p>
        ) : archive.length === 0 ? (
          <p className="text-sm text-slate-500">{t("stats.archiveEmpty")}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {archive.map((a) => (
              <div key={a.id} className="space-y-2 rounded-xl border p-2">
                <div className="grid grid-cols-2 gap-1.5">
                  <figure>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.photo_url} alt="" className="h-28 w-full rounded-lg object-cover" />
                    <figcaption className="mt-0.5 text-center text-[11px] text-slate-500">{t("stats.before")}</figcaption>
                  </figure>
                  {a.after_photo_url ? (
                    <figure>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={a.after_photo_url} alt="" className="h-28 w-full rounded-lg object-cover" />
                      <figcaption className="mt-0.5 text-center text-[11px] text-emerald-700">{t("stats.after")}</figcaption>
                    </figure>
                  ) : (
                    <div className="grid h-28 place-items-center rounded-lg bg-emerald-50 p-2 text-center text-xs text-emerald-800">
                      ✓ {t("stats.adminCleaned")}
                    </div>
                  )}
                </div>
                <div className="text-sm">
                  <b>{category(a.category)}</b>
                  <p className="line-clamp-2 text-xs text-slate-600">{desc(a)}</p>
                  {a.resolved_at && <small className="text-slate-400">{date(a.resolved_at)}</small>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

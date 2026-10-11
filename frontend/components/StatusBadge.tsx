"use client";
import { useI18n } from "@/lib/i18n";
import type { CleanupStatusT, Status } from "@/lib/types";

const COLORS: Record<Status, string> = {
  pending: "bg-blue-100 text-blue-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  needs_review: "bg-amber-100 text-amber-800",
  resolved: "bg-slate-200 text-slate-700",
};

const CLEANUP_COLORS: Record<CleanupStatusT, string> = {
  pending: "bg-blue-100 text-blue-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  needs_review: "bg-amber-100 text-amber-800",
};

export default function StatusBadge({ status }: { status: Status }) {
  const { t } = useI18n();
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${COLORS[status]}`}>
      {t(`status.${status}` as const)}
    </span>
  );
}

export function CleanupStatusBadge({ status }: { status: CleanupStatusT }) {
  const { t } = useI18n();
  const label = status === "confirmed" || status === "rejected" ? t(`cstatus.${status}` as const) : t(`status.${status}` as const);
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${CLEANUP_COLORS[status]}`}>{label}</span>;
}

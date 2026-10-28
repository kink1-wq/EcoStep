"use client";
import { useI18n } from "@/lib/i18n";
import type { CleanupStatusT, Status } from "@/lib/types";
import Icon, { type IconName } from "./Icon";

const COLORS: Record<Status, string> = {
  pending: "bg-blue-50 text-blue-800",
  approved: "bg-emerald-50 text-emerald-800",
  rejected: "bg-red-50 text-red-800",
  needs_review: "bg-amber-50 text-amber-800",
  resolved: "bg-emerald-50 text-emerald-800",
};
const ICONS: Record<Status, IconName> = {
  pending: "clock", approved: "pin", rejected: "close", needs_review: "eye", resolved: "leaf",
};
export default function StatusBadge({ status }: { status: Status }) {
  const { t } = useI18n();
  return <span className={`status-badge shrink-0 ${COLORS[status]}`}><Icon name={ICONS[status]}/>{t(`status.${status}` as const)}</span>;
}
export function CleanupStatusBadge({ status }: { status: CleanupStatusT }) {
  const { t } = useI18n();
  const label = status === "confirmed" || status === "rejected" ? t(`cstatus.${status}` as const) : t(`status.${status}` as const);
  const mapped = status === "confirmed" ? "resolved" : status;
  return <span className={`status-badge shrink-0 ${COLORS[mapped]}`}><Icon name={ICONS[mapped]}/>{label}</span>;
}

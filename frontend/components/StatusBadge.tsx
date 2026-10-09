import type { CleanupStatusT, Status } from "@/lib/types";

const MAP: Record<Status, [string, string]> = {
  pending: ["Анализ ИИ…", "bg-blue-100 text-blue-800"],
  approved: ["На карте", "bg-emerald-100 text-emerald-800"],
  rejected: ["Отклонена", "bg-red-100 text-red-800"],
  needs_review: ["На проверке", "bg-amber-100 text-amber-800"],
  resolved: ["Убрана", "bg-slate-200 text-slate-700"],
};

const CLEANUP_MAP: Record<CleanupStatusT, [string, string]> = {
  pending: ["Анализ ИИ…", "bg-blue-100 text-blue-800"],
  confirmed: ["Уборка подтверждена", "bg-emerald-100 text-emerald-800"],
  rejected: ["Не подтверждено", "bg-red-100 text-red-800"],
  needs_review: ["На проверке", "bg-amber-100 text-amber-800"],
};

export default function StatusBadge({ status }: { status: Status }) {
  const [label, cls] = MAP[status];
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{label}</span>;
}

export function CleanupStatusBadge({ status }: { status: CleanupStatusT }) {
  const [label, cls] = CLEANUP_MAP[status];
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{label}</span>;
}

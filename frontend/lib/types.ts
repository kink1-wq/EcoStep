export type Status = "pending" | "approved" | "rejected" | "needs_review" | "resolved";
export type CleanupStatusT = "pending" | "confirmed" | "rejected" | "needs_review";

export interface Report {
  id: string;
  latitude: number;
  longitude: number;
  photo_url: string;
  category: string | null;
  description: string | null;
  description_kk: string | null;
  status: Status;
  created_at: string;
  support_count: number;
}

export interface AdminReport extends Report {
  user_id: string;
  user_comment: string | null;
  ai_is_polluted: boolean | null;
  ai_confidence: number | null;
  moderation_note: string | null;
  flag_count: number;
}

export interface FlaggedReport extends AdminReport {
  flag_reasons: string[];
}

export interface BlockedUser {
  user_id: string;
  reason: string | null;
  created_at: string;
}

export interface CleanupAdmin {
  id: string;
  report_id: string;
  photo_url: string;
  status: CleanupStatusT;
  created_at: string;
  user_id: string;
  ai_is_clean: boolean | null;
  ai_confidence: number | null;
  moderation_note: string | null;
  report_photo_url: string;
  report_category: string | null;
  report_description: string | null;
  report_latitude: number;
  report_longitude: number;
}

/** Заявка на уборку в личном кабинете пользователя. */
export interface MyCleanup {
  id: string;
  report_id: string;
  photo_url: string;
  status: CleanupStatusT;
  created_at: string;
  report_photo_url: string;
  report_category: string | null;
  report_description: string | null;
  report_description_kk?: string | null;
}

export interface LatLng {
  lat: number;
  lng: number;
}

/** Просьба «перелететь» картой к точке; n увеличивается при каждом новом запросе. */
export interface FocusTarget extends LatLng {
  n: number;
}

export interface ArchiveItem {
  id: string;
  latitude: number;
  longitude: number;
  category: string | null;
  description: string | null;
  description_kk: string | null;
  photo_url: string;
  after_photo_url: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface AIBlock {
  analyzed: number;
  auto: number;
  escalated: number;
  auto_share: number | null;
  reviewed_with_verdict: number;
  agreement: number | null;
  avg_confidence_auto: number | null;
}

export interface Stats {
  total: number;
  active: number;
  resolved: number;
  resolution_rate: number | null;
  avg_days_to_resolve: number | null;
  supports: number;
  cleanups_confirmed: number;
  by_category: { category: string; active: number; resolved: number }[];
  by_day: { date: string; reported: number; resolved: number }[];
  ai_reports: AIBlock;
  ai_cleanups: AIBlock;
}

export type Status = "pending" | "approved" | "rejected" | "needs_review" | "resolved";
export type CleanupStatusT = "pending" | "confirmed" | "rejected" | "needs_review";

export interface Report {
  id: string;
  latitude: number;
  longitude: number;
  photo_url: string;
  category: string | null;
  description: string | null;
  status: Status;
  created_at: string;
}

export interface AdminReport extends Report {
  user_id: string;
  user_comment: string | null;
  ai_is_polluted: boolean | null;
  ai_confidence: number | null;
  moderation_note: string | null;
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
}

export interface LatLng {
  lat: number;
  lng: number;
}

/** Просьба «перелететь» картой к точке; n увеличивается при каждом новом запросе. */
export interface FocusTarget extends LatLng {
  n: number;
}

"use client";
import { useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import type { LegalKind } from "@/lib/legalTexts";
import LegalDocument from "./LegalDocument";

/** Документ поверх страницы: так пользователь читает Политику или Условия, не уходя с формы входа и не теряя введённое. */
export default function LegalModal({ kind, onClose }: { kind: LegalKind; onClose: () => void }) {
  const { t } = useI18n();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[1300] grid place-items-center bg-black/50 px-3"
      style={{
        paddingTop: "calc(0.75rem + env(safe-area-inset-top, 0px))",
        paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))",
      }}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="flex max-h-full w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex-1 overflow-y-auto p-5">
          <LegalDocument kind={kind} />
        </div>
        <div className="border-t p-3 text-right">
          <button onClick={onClose} className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
            {t("login.close")}
          </button>
        </div>
      </div>
    </div>
  );
}

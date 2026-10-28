"use client";
import Link from "@/components/MotionLink";
import LegalDocument from "@/components/LegalDocument";
import { useI18n } from "@/lib/i18n";

export default function TermsPage() {
  const { t } = useI18n();
  return (
    <div className="safe-bottom mx-auto max-w-3xl space-y-4 p-4">
      <Link href="/" className="text-sm text-emerald-700 hover:underline">
        {t("legal.back")}
      </Link>
      <LegalDocument kind="terms" />
      <p className="text-sm text-slate-600">
        {t("legal.other")}{" "}
        <Link href="/privacy" className="text-emerald-700 underline">
          {t("nav.privacy")}
        </Link>
      </p>
    </div>
  );
}

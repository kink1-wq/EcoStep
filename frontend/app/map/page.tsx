"use client";
import Link from "@/components/MotionLink";
import MapView from "@/components/MapView";
import Icon from "@/components/Icon";
import { useI18n } from "@/lib/i18n";

export default function MapPage() {
  const { t } = useI18n();

  return (
    <section className="fullscreen-map" aria-label={t("brand.mapTitle")}>
      <MapView />
      <div className="map-toolbar">
        <Link href="/" className="map-back" aria-label={t("nav.home")}>
          <Icon name="arrow" className="rotate-180" />
          <span>{t("nav.home")}</span>
        </Link>
        <h1>{t("brand.mapTitle")}</h1>
      </div>
      <Link href="/report" className="button button-primary fullscreen-report">
        <Icon name="plus" />
        {t("brand.report")}
      </Link>
    </section>
  );
}

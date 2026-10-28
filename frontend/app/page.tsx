"use client";
import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import Link from "@/components/MotionLink";
import Icon from "@/components/Icon";
import { StepArt } from "@/components/Brand";
import ParallaxArt from "@/components/ParallaxArt";
import Reveal from "@/components/Reveal";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import type { Stats } from "@/lib/types";

const steps = [
  { number: 1, title: "brand.step1", text: "brand.step1Text" },
  { number: 2, title: "brand.step2", text: "brand.step2Text" },
  { number: 3, title: "brand.step3", text: "brand.step3Text" },
] as const;

export default function Home() {
  const { t } = useI18n();
  const [native, setNative] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => { setNative(Capacitor.isNativePlatform()); }, []);
  useEffect(() => { api<Stats>("/api/stats").then(setStats).catch(() => setFailed(true)); }, []);
  const metrics = [
    { value: stats?.active, label: t("brand.active"), kind: "warm" },
    { value: stats?.resolved, label: t("brand.resolved"), kind: "green" },
    { value: stats?.supports, label: t("brand.supports"), kind: "blue" },
  ];
  return <div className="home-page">
    <section className="hero">
      <div className="hero-copy">
        <div className="eyebrow"><span className="edition-mark"/>{t("brand.eyebrow")}</div>
        <h1><span className="hero-line"><span>{t("brand.heroOne")}</span></span><span className="hero-line"><span className="hero-accent">{t("brand.heroTwo")}</span></span></h1>
        <p>{t("brand.heroText")}</p>
        <div className="hero-actions"><Link href="/map" className="button button-primary">{t("brand.explore")}<Icon name="arrow"/></Link><Link href="/report" className="hero-map-link"><Icon name="plus"/>{t("brand.report")}</Link></div>
        <div className="hero-note"><span className="note-line"/><span>{t("brand.heroNote")}</span></div>
      </div>
      <ParallaxArt caption={t("brand.artCaption")}/>
    </section>
    <Reveal as="section" className="impact-section" aria-label={t("nav.stats")}>
      <div className="impact-heading"><span className="eyebrow">{t("brand.impactEyebrow")}</span><Link href="/stats">{t("brand.impact")}<Icon name="arrow"/></Link></div>
      <div className="impact-strip">{metrics.map((m, i) => <div className={`impact-metric ${m.kind}`} key={m.label}><div className="metric-meta"><span>0{i + 1}</span><span className="metric-glyph"/></div><strong>{m.value?.toLocaleString() ?? "—"}</strong><span>{m.label}</span></div>)}</div>
      {failed && <p className="impact-error" role="status">{t("brand.statsUnavailable")}</p>}
    </Reveal>
    <section className="action-guide home-guide">
      <Reveal className="guide-heading"><div><div className="eyebrow">{t("brand.together")}</div><h2>{t("brand.stepTitle")}</h2></div><p>{t("brand.stepIntro")}</p></Reveal>
      <ol>{steps.map(s => <Reveal as="li" delay={(s.number - 1) * 90} key={s.number}><div className="step-illustration"><span className="step-number">0{s.number}</span><StepArt step={s.number}/></div><div className="step-copy"><h3>{t(s.title)}</h3><p>{t(s.text)}</p></div></Reveal>)}</ol>
    </section>
    <Reveal as="section" className="map-invitation"><div className="invitation-symbol"><Icon name="map"/></div><div><span className="eyebrow">{t("brand.around")}</span><h2>{t("brand.inviteTitle")}</h2><p>{t("brand.inviteText")}</p></div><Link href="/map" className="round-link" aria-label={t("brand.explore")}><Icon name="arrow"/></Link></Reveal>
    <footer className="home-footer"><span>© {new Date().getFullYear()} EcoStep · {t("brand.tagline")}</span><div><Link href="/privacy">{t("nav.privacy")}</Link>{!native && <Link href="/download">{t("nav.download")}</Link>}</div></footer>
  </div>;
}

"use client";
import { useEffect, useRef, useState } from "react";
import Link from "@/components/MotionLink";
import { usePathname } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/useSession";
import { useI18n } from "@/lib/i18n";
import { BrandMark } from "./Brand";
import Icon from "./Icon";
import useActiveIndicator from "./useActiveIndicator";

export default function Header() {
  const { session, isAdmin } = useSession();
  const { t, lang, setLang } = useI18n();
  const path = usePathname().replace(/\/$/, "") || "/";
  const [open, setOpen] = useState(false);
  const [native, setNative] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const indicatorKey = `${path}:${lang}:${Boolean(session)}`;
  const desktopNav = useActiveIndicator(indicatorKey);
  const mobileNav = useActiveIndicator(indicatorKey);
  useEffect(() => setNative(Capacitor.isNativePlatform()), []);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => { if (!menu.current?.contains(e.target as Node)) setOpen(false); };
    const escape = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); menuButton.current?.focus(); } };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", escape); };
  }, [open]);
  const nav = [
    { href: "/", label: t("nav.home"), icon: "home" as const },
    { href: "/map", label: t("nav.map"), icon: "map" as const },
    { href: "/stats", label: t("nav.stats"), icon: "chart" as const },
    { href: session ? "/cabinet" : "/login", label: t("nav.mine"), icon: "user" as const },
  ];
  if (path === "/map") return null;
  return <>
    <a href="#main" className="skip-link">{t("brand.skip")}</a>
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="brand" aria-label="EcoStep"><BrandMark/><span>eco<span className="brand-light">step</span><small>{t("brand.tagline")}</small></span></Link>
        <nav ref={desktopNav} className="desktop-nav" aria-label={t("nav.menu")}>{nav.map(n => <Link key={n.href} href={n.href} title={n.label} aria-label={n.label} className={path === n.href ? "active" : ""} aria-current={path === n.href ? "page" : undefined}><Icon name={n.icon}/>{n.label}</Link>)}</nav>
        <div className="header-actions">
          <div className="lang-switch" data-lang={lang} role="group" aria-label="Язык / Тіл">{(["ru", "kk"] as const).map(l => <button key={l} onClick={() => setLang(l)} aria-pressed={lang === l}>{l === "ru" ? "RU" : "ҚАЗ"}</button>)}</div>
          <Link href="/report" className="button button-primary header-report"><Icon name="plus"/>{t("brand.report")}</Link>
          <div className="menu-wrap" ref={menu}>
            <button ref={menuButton} className="icon-button" aria-label={t("nav.menu")} aria-expanded={open} aria-controls="site-menu" onClick={() => setOpen(!open)}><Icon name={open ? "close" : "menu"}/></button>
            {open && <nav className="menu-panel" id="site-menu" aria-label={t("nav.menu")} onClick={() => setOpen(false)}>
              {isAdmin && <Link href="/admin"><Icon name="shield"/>{t("nav.admin")}</Link>}
              {!native && <Link href="/download"><Icon name="phone"/>{t("nav.download")}</Link>}
              <Link href="/privacy"><Icon name="shield"/>{t("nav.privacy")}</Link><Link href="/terms"><Icon name="file"/>{t("nav.terms")}</Link>
              {session ? <button onClick={() => supabase.auth.signOut()}><Icon name="logout"/>{t("nav.logout")}</button> : <Link href="/login"><Icon name="user"/>{t("nav.login")}</Link>}
            </nav>}
          </div>
        </div>
      </div>
    </header>
    <nav ref={mobileNav} className="mobile-nav" aria-label={t("nav.menu")}>{[nav[0], nav[1], { href: "/report", label: t("brand.reportShort"), icon: "plus" as const }, nav[2], nav[3]].map(n => <Link key={n.href} href={n.href} className={`${path === n.href ? "active" : ""} ${n.href === "/report" ? "mobile-add" : ""}`} aria-current={path === n.href ? "page" : undefined}><Icon name={n.icon}/><span>{n.label}</span></Link>)}</nav>
  </>;
}

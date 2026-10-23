"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/useSession";
import { useI18n, type Lang } from "@/lib/i18n";

function LangSwitch() {
  const { lang, setLang } = useI18n();
  const btn = (l: Lang, label: string) => (
    <button
      type="button"
      onClick={() => setLang(l)}
      aria-pressed={lang === l}
      className={`px-2.5 py-1.5 text-xs font-bold ${lang === l ? "bg-emerald-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
    >
      {label}
    </button>
  );
  return (
    <div className="flex overflow-hidden rounded-lg border" role="group" aria-label="Language / Тіл">
      {btn("ru", "RU")}
      {btn("kk", "ҚАЗ")}
    </div>
  );
}

export default function Header() {
  const { session, isAdmin } = useSession();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [native, setNative] = useState(false);
  const close = () => setOpen(false);
  const item = "block rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 active:bg-emerald-100";

  // В самом приложении пункт «Скачать приложение» не нужен
  useEffect(() => setNative(Capacitor.isNativePlatform()), []);

  return (
    <header
      className="sticky top-0 z-[1100] border-b bg-white"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }} // отступ под вырез/чёлку экрана
    >
      <div className="flex h-14 items-center justify-between px-3">
        <Link href="/" onClick={close} className="flex shrink-0 items-center gap-2 self-stretch pr-2 text-lg font-bold text-emerald-700">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" width={34} height={34} className="h-[34px] w-[34px]" />
          EcoStep
        </Link>
        <div className="flex items-center gap-2">
          <LangSwitch />
          <button
            type="button"
            aria-label={t("nav.menu")}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="grid h-10 w-10 place-items-center rounded-lg border text-xl text-slate-700 hover:bg-slate-50"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {open && (
        <>
          {/* прозрачная подложка: нажатие вне меню закрывает его */}
          <div className="fixed inset-0" onClick={close} />
          <nav className="absolute right-2 top-full mt-1 w-64 rounded-xl border bg-white p-1.5 shadow-lg">
            <Link href="/" onClick={close} className={item}>🗺 {t("nav.map")}</Link>
            <Link href="/stats" onClick={close} className={item}>📊 {t("nav.stats")}</Link>
            {session && <Link href="/cabinet" onClick={close} className={item}>📋 {t("nav.mine")}</Link>}
            {isAdmin && <Link href="/admin" onClick={close} className={item}>🛡 {t("nav.admin")}</Link>}
            {!native && <Link href="/download" onClick={close} className={item}>📱 {t("nav.download")}</Link>}
            <div className="my-1 border-t" />
            <Link href="/privacy" onClick={close} className={`${item} !text-xs !font-normal`}>📄 {t("nav.privacy")}</Link>
            <Link href="/terms" onClick={close} className={`${item} !text-xs !font-normal`}>📄 {t("nav.terms")}</Link>
            <div className="my-1 border-t" />
            {session ? (
              <button
                onClick={() => {
                  close();
                  supabase.auth.signOut();
                }}
                className={`${item} w-full text-left`}
              >
                🚪 {t("nav.logout")}
              </button>
            ) : (
              <Link href="/login" onClick={close} className={item}>🔑 {t("nav.login")}</Link>
            )}
          </nav>
        </>
      )}
    </header>
  );
}

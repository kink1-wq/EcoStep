"use client";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/useSession";

export default function Header() {
  const { session, isAdmin } = useSession();
  // self-stretch растягивает зону нажатия на всю высоту шапки — удобнее попадать пальцем
  const link = "flex items-center self-stretch px-2 text-sm text-slate-600 hover:text-emerald-700 active:text-emerald-800";
  return (
    <header
      className="sticky top-0 z-[1100] border-b bg-white"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }} // отступ под вырез/чёлку экрана
    >
      <div className="flex h-14 items-center justify-between px-3">
        <Link href="/" className="flex shrink-0 items-center self-stretch pr-2 text-lg font-bold text-emerald-700">
          🌿 EcoStep
        </Link>
        <nav className="flex items-center gap-1">
          {session && <Link href="/cabinet" className={link}>Мои заявки</Link>}
          {isAdmin && <Link href="/admin" className={link}>Модерация</Link>}
          {session ? (
            <button onClick={() => supabase.auth.signOut()} className={link}>Выйти</button>
          ) : (
            <Link href="/login" className={link}>Войти</Link>
          )}
        </nav>
      </div>
    </header>
  );
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(""); setInfo("");
    const { data, error } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (error) return setError(error.message);
    if (data.session) router.push("/");
    else setInfo(t("login.checkMail"));
  }

  return (
    <form onSubmit={submit} className="safe-bottom mx-auto mt-16 max-w-sm space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
      <h1 className="text-xl font-bold">{mode === "in" ? t("login.signin") : t("login.signup")}</h1>
      <input type="email" required placeholder={t("login.email")} value={email} onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-lg border px-3 py-2" />
      <input type="password" required minLength={6} placeholder={t("login.password")} value={password}
        onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border px-3 py-2" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {info && <p className="text-sm text-emerald-700">{info}</p>}
      <button disabled={busy} className="w-full rounded-lg bg-emerald-600 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
        {mode === "in" ? t("login.doSignin") : t("login.doSignup")}
      </button>
      <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} className="w-full text-sm text-slate-500 hover:text-emerald-700">
        {mode === "in" ? t("login.toSignup") : t("login.toSignin")}
      </button>
    </form>
  );
}

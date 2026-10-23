"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useI18n, type TKey } from "@/lib/i18n";
import { siteUrl } from "@/lib/site";
import { LEGAL_VERSION } from "@/lib/legal";
import type { LegalKind } from "@/lib/legalTexts";
import LegalModal from "@/components/LegalModal";

/** Строка согласия: {link} в тексте заменён на ссылку, которая открывает документ поверх формы. */
function Consent({
  checked, onChange, textKey, linkKey, onOpen,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  textKey: TKey;
  linkKey: TKey;
  onOpen: () => void;
}) {
  const { t } = useI18n();
  const [before, after] = t(textKey).split("{link}");
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-sm leading-snug text-slate-700">
      <input
        type="checkbox"
        required
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 accent-emerald-600"
      />
      <span>
        {before}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onOpen();
          }}
          className="font-medium text-emerald-700 underline"
        >
          {t(linkKey)}
        </button>
        {after}
      </span>
    </label>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreeData, setAgreeData] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [legal, setLegal] = useState<LegalKind | null>(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const consentOk = agreeData && agreeTerms;

  // Сообщения Supabase приходят по-английски — показываем понятный текст на выбранном языке
  function explain(message: string): string {
    if (message.startsWith("Invalid login credentials")) return t("login.badCredentials");
    if (message.startsWith("Email not confirmed")) return t("login.notConfirmed");
    if (message.startsWith("User already registered")) return t("login.exists");
    if (message.startsWith("Password should be at least")) return t("login.weak");
    return message;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!consentOk) return setError(t("login.consentRequired"));
    setBusy(true);
    setError("");
    setInfo("");

    const { data, error } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              // ссылка из письма ведёт на настоящий адрес сайта, а не на localhost
              emailRedirectTo: siteUrl() || undefined,
              // фиксируем согласие: что приняли, какая версия документов, когда
              data: { consent: { personal_data: true, terms: true, version: LEGAL_VERSION, at: new Date().toISOString() } },
            },
          });

    setBusy(false);
    if (error) return setError(explain(error.message));
    if (data.session) router.push("/");
    else setInfo(t("login.checkMail"));
  }

  return (
    <>
      <form onSubmit={submit} className="safe-bottom mx-auto mt-16 max-w-sm space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold">{mode === "in" ? t("login.signin") : t("login.signup")}</h1>
        <input
          type="email"
          required
          placeholder={t("login.email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border px-3 py-2"
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder={t("login.password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border px-3 py-2"
        />

        <div className="space-y-3 rounded-xl bg-slate-50 p-3">
          <Consent checked={agreeData} onChange={setAgreeData} textKey="login.consentData" linkKey="login.consentDataLink" onOpen={() => setLegal("privacy")} />
          <Consent checked={agreeTerms} onChange={setAgreeTerms} textKey="login.consentTerms" linkKey="login.consentTermsLink" onOpen={() => setLegal("terms")} />
          {!consentOk && <p className="text-xs text-slate-500">{t("login.consentRequired")}</p>}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {info && <p className="text-sm text-emerald-700">{info}</p>}
        <button
          disabled={busy || !consentOk}
          className="w-full rounded-lg bg-emerald-600 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {mode === "in" ? t("login.doSignin") : t("login.doSignup")}
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === "in" ? "up" : "in")}
          className="w-full text-sm text-slate-500 hover:text-emerald-700"
        >
          {mode === "in" ? t("login.toSignup") : t("login.toSignin")}
        </button>
      </form>

      {legal && <LegalModal kind={legal} onClose={() => setLegal(null)} />}
    </>
  );
}

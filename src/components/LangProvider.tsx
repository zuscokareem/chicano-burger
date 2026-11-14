"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { COPY, type Copy, type Lang } from "@/lib/copy";

const Ctx = createContext<{ lang: Lang; t: Copy; setLang: (l: Lang) => void }>({
  lang: "en",
  t: COPY.en,
  setLang: () => {},
});

export function LangProvider({ children, initial }: { children: React.ReactNode; initial?: Lang }) {
  const [lang, setLangState] = useState<Lang>(initial ?? "en");

  useEffect(() => {
    if (initial) return;
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("cb-lang");
    } catch {}
    const pick = saved === "es" || saved === "en" ? saved : navigator.language?.toLowerCase().startsWith("es") ? "es" : "en";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (pick !== "en") setLangState(pick);
  }, [initial]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("cb-lang", l);
    } catch {}
  };

  return <Ctx.Provider value={{ lang, t: COPY[lang], setLang }}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);

export function LangToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <div className={`inline-flex rounded-full border border-line p-0.5 text-xs font-semibold ${className}`} role="group" aria-label="Language">
      {(["en", "es"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`rounded-full px-2.5 py-1 uppercase tracking-wider transition ${lang === l ? "bg-cream text-ink" : "text-muted hover:text-cream"}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

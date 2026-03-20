'use client';

import { createContext, useContext, useState } from 'react';
import { Lang, createT } from '@/lib/i18n';

const STORAGE_KEY = 'grammify-lang';

function getStoredLang(): Lang {
  if (typeof window === 'undefined') return 'th';
  const stored = localStorage.getItem(STORAGE_KEY);
  return (stored === 'en' || stored === 'th') ? stored : 'th';
}

type LangContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: ReturnType<typeof createT>;
};

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => getStoredLang());

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }

  const value: LangContextValue = {
    lang,
    setLang,
    t: createT(lang),
  };

  return (
    <LangContext.Provider value={value}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used inside LangProvider');
  return ctx;
}

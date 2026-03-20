'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { Lang, createT } from '@/lib/i18n';

const STORAGE_KEY = 'grammify-lang';

type LangContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: ReturnType<typeof createT>;
};

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('th');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'th') {
      setLangState(stored);
      setMounted(true);
      return;
    }

    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        const country = data?.country_code;
        const langFromIP = country === 'TH' ? 'th' : 'en';
        setLangState(langFromIP);
        localStorage.setItem(STORAGE_KEY, langFromIP);
      })
      .catch(() => {
        setLangState('th');
        localStorage.setItem(STORAGE_KEY, 'th');
      })
      .finally(() => {
        setMounted(true);
      });
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }

  const value: LangContextValue = {
    lang: mounted ? lang : 'th',
    setLang,
    t: createT(mounted ? lang : 'th'),
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

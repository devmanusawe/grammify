'use client';

import { useState, useEffect } from 'react';
import { useLang } from '@/components/LangProvider';
import { useSession } from 'next-auth/react';

interface Correction {
  original: string;
  corrected: string;
  reason: string;
  type?: 'spelling' | 'grammar' | 'suggestion';
}

interface CheckResult {
  original: string;
  corrected: string;
  corrections: Correction[];
  message?: string;
}

interface HistoryEntry {
  id: string;
  timestamp: number;
  originalText: string;
  correctedText: string;
  errorCount: number;
  provider: string;
  corrections: Correction[];
  userId?: string;
}

type Provider = 'gemini-web' | 'gemini-api' | 'chatgpt-web' | 'openai-api';

interface Settings {
  provider: Provider;
  geminiApiKey: string;
  openaiApiKey: string;
}

const DEFAULT_SETTINGS: Settings = {
  provider: 'gemini-web',
  geminiApiKey: '',
  openaiApiKey: '',
};

function getRetentionCutoff(retention: string): number {
  const now = Date.now();
  if (retention === '1day') return now - 24 * 60 * 60 * 1000;
  if (retention === '1week') return now - 7 * 24 * 60 * 60 * 1000;
  return now - 30 * 24 * 60 * 60 * 1000;
}

function saveToHistory(entry: HistoryEntry, userId?: string) {
  const retRaw = localStorage.getItem('grammify-history-settings');
  const retention = retRaw ? JSON.parse(retRaw).retention : '1week';
  const cutoff = getRetentionCutoff(retention);
  const storageKey = userId ? `grammify-history-${userId}` : 'grammify-history';
  const raw = localStorage.getItem(storageKey);
  let history: HistoryEntry[] = raw ? JSON.parse(raw) : [];
  history = history.filter((e) => e.timestamp > cutoff);
  history.unshift({ ...entry, userId });
  localStorage.setItem(storageKey, JSON.stringify(history));
}

function FloatingOrb({ className, delay = 0 }: { className: string; delay?: number }) {
  return (
    <div
      className={`absolute rounded-full blur-3xl opacity-30 animate-float ${className}`}
      style={{ animationDelay: `${delay}s` }}
    />
  );
}

function SparkleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" fill="currentColor" />
      <path d="M19 14L19.75 16.25L22 17L19.75 17.75L19 20L18.25 17.75L16 17L18.25 16.25L19 14Z" fill="currentColor" opacity="0.6" />
      <path d="M5 2L5.5 3.5L7 4L5.5 4.5L5 6L4.5 4.5L3 4L4.5 3.5L5 2Z" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

function TypeWriter({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const startTimeout = setTimeout(() => setStarted(true), delay * 1000);
    return () => clearTimeout(startTimeout);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, 60);
    return () => clearInterval(interval);
  }, [started, text]);

  return <span>{displayed}<span className="animate-pulse">|</span></span>;
}

function FloatingParticle({ className, delay }: { className: string; delay: number }) {
  return (
    <div
      className={`absolute w-2 h-2 rounded-full ${className} opacity-40`}
      style={{
        animation: `float 6s ease-in-out infinite, fadeIn 1s ease-out forwards`,
        animationDelay: `${delay}s`,
        opacity: 0,
      }}
    />
  );
}

function AIBrainAnimation() {
  return (
    <div className="relative w-32 h-32 mx-auto mb-8">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/20 blur-2xl animate-pulse" />
      <div className="absolute inset-4 rounded-full bg-gradient-to-br from-indigo-400/30 to-purple-400/30 blur-xl animate-pulse" style={{ animationDelay: '0.5s' }} />
      <div className="relative w-full h-full rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-indigo-500/50 animate-float">
        <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-spin-slow" />
        <div className="absolute w-4 h-4 bg-white/80 rounded-full top-4 left-8 animate-pulse" />
        <div className="absolute w-3 h-3 bg-white/60 rounded-full bottom-8 right-6 animate-pulse" style={{ animationDelay: '0.3s' }} />
        <div className="absolute w-2 h-2 bg-white/40 rounded-full top-12 right-10 animate-pulse" style={{ animationDelay: '0.6s' }} />
        <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </div>
    </div>
  );
}

function FeatureBadge({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-white/50 shadow-lg animate-fade-in hover-lift cursor-default">
      <span className="text-lg">{icon}</span>
      <span className="text-sm font-semibold text-slate-600">{text}</span>
    </div>
  );
}

function SettingsModal({ settings, onSave, onClose }: {
  settings: Settings;
  onSave: (s: Settings) => void;
  onClose: () => void;
}) {
  const { t } = useLang();
  const [local, setLocal] = useState<Settings>(settings);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);

  const providers: { id: Provider; label: string; desc: string; icon: string; gradient: string }[] = [
    { id: 'gemini-web',  label: t('geminiWebLabel'),  desc: t('geminiWebDesc'),  icon: '🌐', gradient: 'from-amber-400 to-orange-500' },
    { id: 'gemini-api',  label: t('geminiApiLabel'),  desc: t('geminiApiDesc'),  icon: '✨', gradient: 'from-violet-500 to-purple-500' },
    { id: 'chatgpt-web', label: t('chatgptWebLabel'), desc: t('chatgptWebDesc'), icon: '💬', gradient: 'from-emerald-500 to-teal-500' },
    { id: 'openai-api',  label: t('openaiApiLabel'),  desc: t('openaiApiDesc'),  icon: '🤖', gradient: 'from-blue-500 to-cyan-500' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md border border-white/20 animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-slate-100/50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            {t('settingsTitle')}
          </h2>
          <button onClick={onClose} className="p-2.5 hover:bg-slate-100 rounded-xl transition-all hover:scale-105">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-bold text-slate-600 flex items-center gap-2">
              <SparkleIcon />
              {t('selectProvider')}
            </p>
            {providers.map((p) => (
              <label
                key={p.id}
                className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover-lift ${
                  local.provider === p.id
                    ? 'border-indigo-400 bg-gradient-to-r from-indigo-50/80 to-violet-50/80 shadow-lg shadow-indigo-100'
                    : 'border-slate-100 hover:border-slate-200 bg-white/60'
                }`}
              >
                <input
                  type="radio"
                  name="provider"
                  value={p.id}
                  checked={local.provider === p.id}
                  onChange={() => setLocal({ ...local, provider: p.id })}
                  className="sr-only"
                />
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${p.gradient} flex items-center justify-center text-2xl shadow-lg flex-shrink-0`}>
                  {p.icon}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800 text-base">{p.label}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{p.desc}</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  local.provider === p.id ? 'border-indigo-500 bg-indigo-500' : 'border-slate-200'
                }`}>
                  {local.provider === p.id && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </label>
            ))}
          </div>

          {local.provider === 'gemini-api' && (
            <div className="space-y-2 animate-slide-up">
              <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                <SparkleIcon />
                Gemini API Key
              </label>
              <div className="relative group">
                <input
                  type={showGeminiKey ? 'text' : 'password'}
                  value={local.geminiApiKey}
                  onChange={(e) => setLocal({ ...local, geminiApiKey: e.target.value })}
                  placeholder="AIza..."
                  className="w-full pr-12 p-4 border-2 border-slate-200 rounded-2xl text-sm focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none transition-all bg-white/80 group-hover:shadow-lg"
                />
                <button
                  type="button"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors p-1"
                >
                  {showGeminiKey ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}

          {local.provider === 'openai-api' && (
            <div className="space-y-2 animate-slide-up">
              <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                <SparkleIcon />
                OpenAI API Key
              </label>
              <div className="relative group">
                <input
                  type={showOpenAIKey ? 'text' : 'password'}
                  value={local.openaiApiKey}
                  onChange={(e) => setLocal({ ...local, openaiApiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full pr-12 p-4 border-2 border-slate-200 rounded-2xl text-sm focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none transition-all bg-white/80 group-hover:shadow-lg"
                />
                <button
                  type="button"
                  onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors p-1"
                >
                  {showOpenAIKey ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all hover-lift"
          >
            {t('cancel')}
          </button>
          <button
            onClick={() => { onSave(local); onClose(); }}
            className="flex-1 py-3.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 hover:from-indigo-600 hover:via-violet-600 hover:to-purple-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 hover-lift animate-gradient"
          >
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  );
}

const PROVIDER_LABELS: Record<Provider, string> = {
  'gemini-web': '🌐 Gemini Web',
  'gemini-api': '✨ Gemini API',
  'chatgpt-web': '💬 ChatGPT Web',
  'openai-api': '🤖 ChatGPT API',
};

export default function Home() {
  const { lang, t } = useLang();
  const { data: session } = useSession();
  const [text, setText] = useState('');
  const [result, setResult] = useState<CheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('grammify-settings');
    if (saved) {
      try { setSettings(JSON.parse(saved)); } catch { /* ignore */ }
    }

    const handleOpenSettings = () => setShowSettings(true);
    window.addEventListener('open-settings', handleOpenSettings);
    return () => window.removeEventListener('open-settings', handleOpenSettings);
  }, []);

  const handleSaveSettings = (s: Settings) => {
    setSettings(s);
    localStorage.setItem('grammify-settings', JSON.stringify(s));
  };

  const handleCheck = async () => {
    if (!text.trim()) {
      setToast(lang === 'th' ? 'กรุณาพิมพ์ข้อความที่ต้องการตรวจสอบ' : 'Please enter some text to check');
      setTimeout(() => setToast(null), 3000);
      return;
    }

    if (!session) {
      setToast(lang === 'th' ? 'กรุณา Sign In ก่อนใช้งาน' : 'Please sign in first to use');
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          provider: settings.provider,
          geminiApiKey: settings.geminiApiKey,
          openaiApiKey: settings.openaiApiKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาด');
      }

      setResult(data);
      if (data.corrected !== undefined) {
        saveToHistory({
          id: Date.now().toString(),
          timestamp: Date.now(),
          originalText: text,
          correctedText: data.corrected ?? '',
          errorCount: data.corrections?.length ?? 0,
          provider: settings.provider,
          corrections: data.corrections ?? [],
        }, session?.user?.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (result?.corrected) {
      await navigator.clipboard.writeText(result.corrected);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClear = () => {
    setText('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 relative overflow-hidden">
      
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <FloatingOrb className="w-96 h-96 bg-gradient-to-br from-indigo-400/40 to-violet-400/40 -top-48 -right-48" delay={0} />
        <FloatingOrb className="w-80 h-80 bg-gradient-to-br from-purple-400/30 to-pink-400/30 top-1/2 -left-40" delay={2} />
        <FloatingOrb className="w-64 h-64 bg-gradient-to-br from-cyan-400/30 to-blue-400/30 bottom-20 right-20" delay={4} />
        <FloatingOrb className="w-48 h-48 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 top-40 right-1/4" delay={1} />
        <div className="absolute top-20 right-10 opacity-20 animate-float">
          <SparkleIcon />
        </div>
        <div className="absolute bottom-40 left-20 opacity-15 animate-float" style={{ animationDelay: '2s' }}>
          <SparkleIcon />
        </div>
        <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-indigo-400 rounded-full animate-pulse opacity-40" />
        <div className="absolute bottom-1/3 left-1/4 w-3 h-3 bg-purple-400 rounded-full animate-pulse opacity-30" style={{ animationDelay: '1s' }} />
        <div className="absolute top-2/3 right-1/3 w-2 h-2 bg-cyan-400 rounded-full animate-pulse opacity-50" style={{ animationDelay: '0.5s' }} />
      </div>

      <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${toast ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-8 scale-95 pointer-events-none'}`}>
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-4 rounded-2xl shadow-2xl shadow-amber-500/40 text-sm font-bold text-white flex items-center gap-3 animate-pulse">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          {toast}
        </div>
      </div>

      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
      
      <header className="py-12 md:py-20 px-4 relative z-10">
        <div className="max-w-5xl mx-auto text-center relative">
          
          <AIBrainAnimation />

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-indigo-100 shadow-lg shadow-indigo-100/50 text-sm font-bold text-indigo-600 mb-6 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="gradient-text">{PROVIDER_LABELS[settings.provider]}</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-800 tracking-tight leading-tight mb-6">
            <span className="gradient-text">
              <TypeWriter text={t('subtitle')} delay={0.5} />
            </span>
          </h1>
          
          <p className="text-base md:text-lg text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            {lang === 'th'
              ? 'พิมพ์ย่อหน้า รายงาน หรือบทความของคุณ แล้วให้ AI ของเราช่วยตรวจสอบไวยากรณ์ การสะกดคำ และปรับรูปประโยคให้ถูกต้องและเป็นธรรมชาติที่สุด'
              : 'Type your paragraph, report, or article, and let our AI correct your grammar, spelling, and phrasing naturally.'}
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <FeatureBadge icon="✨" text={lang === 'th' ? 'ตรวจไวยากรณ์' : 'Grammar Check'} />
            <FeatureBadge icon="🔍" text={lang === 'th' ? 'แก้คำผิด' : 'Spell Check'} />
            <FeatureBadge icon="📝" text={lang === 'th' ? 'ปรับประโยค' : 'Phrase Tuning'} />
            <FeatureBadge icon="🌍" text={lang === 'th' ? 'รองรับไทย' : 'Thai Support'} />
          </div>

          <FloatingParticle className="bg-indigo-400 top-20 left-10" delay={0} />
          <FloatingParticle className="bg-violet-400 top-40 right-20" delay={1} />
          <FloatingParticle className="bg-purple-400 bottom-20 left-20" delay={2} />
          <FloatingParticle className="bg-pink-400 bottom-40 right-10" delay={0.5} />
          <FloatingParticle className="bg-cyan-400 top-60 left-1/3" delay={1.5} />
          <FloatingParticle className="bg-emerald-400 bottom-60 right-1/3" delay={2.5} />
        </div>
      </header>

      <main className="px-4 pb-20 relative z-10">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className={`grid gap-8 items-start ${result || error ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 max-w-3xl mx-auto'}`}>

            <div className="bg-white rounded-2xl p-8 md:p-10 border border-slate-100 shadow-lg shadow-slate-200/50 transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/80 animate-scale-in">
              <div className="flex items-center justify-between mb-6">
                <label className="text-base font-semibold text-slate-700 flex items-center gap-3">
                  <span className="text-2xl">✍️</span>
                  {t('inputLabel')}
                </label>
                {text && !isLoading && (
                  <button
                    onClick={handleClear}
                    title={lang === 'th' ? 'ล้างข้อความ' : 'Clear text'}
                    className="p-2.5 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-all duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              
              <div className="relative group">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={t('inputPlaceholder')}
                  className="w-full h-[280px] p-6 text-base text-slate-700 placeholder:text-slate-300 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/50 focus:shadow-lg focus:shadow-indigo-500/10 transition-all duration-300 resize-none outline-none font-sans leading-relaxed"
                  disabled={isLoading}
                />
                <div className="absolute bottom-4 right-4 text-xs font-medium text-slate-400">
                  {text.length} {t('characters')}
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={handleCheck}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 hover:from-indigo-600 hover:via-violet-600 hover:to-purple-600 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 disabled:hover:translate-y-0 shadow-lg shadow-indigo-500/20 disabled:shadow-none flex items-center justify-center gap-3 text-base cursor-pointer disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>{t('checking')}</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      {t('check')}
                    </>
                  )}
                </button>
              </div>

              {!result && !error && !isLoading && (
                <div className="text-center py-10">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center">
                    <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-slate-500">{t('hintTitle')}</p>
                  <p className="text-xs mt-1 text-slate-400">{t('hintSub')}</p>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {isLoading && (
                <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-lg animate-pulse">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl" />
                    <div className="h-5 bg-slate-100 rounded-lg w-32" />
                  </div>
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <div className="flex gap-3">
                          <div className="w-6 h-6 bg-slate-200 rounded-full flex-shrink-0" />
                          <div className="flex-1 space-y-2 py-1">
                            <div className="flex gap-2">
                              <div className="h-4 bg-red-100 rounded w-16" />
                              <div className="h-4 bg-slate-200 rounded w-4" />
                              <div className="h-4 bg-emerald-100 rounded w-20" />
                            </div>
                            <div className="h-3 bg-slate-200 rounded w-full" />
                            <div className="h-3 bg-slate-200 rounded w-2/3" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error && !isLoading && (
                <div className="bg-white rounded-2xl p-8 border border-red-100 animate-scale-in">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">{t('errorTitle')}</h3>
                      <p className="text-slate-600 mt-1 text-sm">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {result && !isLoading && (
                <>
                  {result.corrections && result.corrections.length > 0 && (
                    <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-lg animate-scale-in">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-base font-semibold text-slate-700 flex items-center gap-3">
                          <span className="text-xl">💡</span>
                          {t('correctionsTitle')}
                        </h2>
                        <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600">
                          {result.corrections.length} {t('errorsFound', { count: result.corrections.length })}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {result.corrections.map((correction, index) => {
                          const isSpelling = correction.type === 'spelling' || !correction.type;
                          return (
                            <CorrectionCard
                              key={index}
                              correction={correction}
                              index={index}
                              isSpelling={isSpelling}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {(!result.corrections || result.corrections.length === 0) && !result.message && (
                    <div className="bg-white rounded-2xl p-10 text-center border border-emerald-100 animate-scale-in">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200/50">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-800">{t('noErrorsTitle')}</h3>
                      <p className="text-slate-500 text-sm mt-1">{t('noErrorsSub')}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {isLoading && (
            <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-lg animate-pulse">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-slate-100 rounded-xl" />
                <div className="h-5 bg-slate-100 rounded-lg w-40" />
              </div>
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 space-y-3">
                <div className="h-4 bg-slate-200 rounded w-full" />
                <div className="h-4 bg-slate-200 rounded w-11/12" />
                <div className="h-4 bg-slate-200 rounded w-4/5" />
              </div>
            </div>
          )}
          
          {result && !isLoading && (
            <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-lg shadow-indigo-500/5 animate-slide-up">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-3">
                  <span className="text-xl">✨</span>
                  {t('correctedTitle')}
                </h2>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl transition-all text-sm font-semibold"
                >
                  {copied ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {t('copied')}
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      {t('copy')}
                    </>
                  )}
                </button>
              </div>
              <div className="bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/50 rounded-xl p-6 border border-indigo-100/50">
                <p className="text-base text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {result.corrected}
                </p>
              </div>
              {result.message && (
                <p className="mt-4 text-amber-600 text-sm flex items-center gap-2">
                  <span>💬</span>
                  {result.message}
                </p>
              )}
            </div>
          )}
        </div>
      </main>

    </div>
  );
}

function CorrectionCard({ correction, index, isSpelling }: { correction: Correction; index: number; isSpelling: boolean }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const highlightColor = isSpelling ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-100 text-amber-700 border-amber-200';
  
  return (
    <div 
      className="relative group"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-white transition-all duration-200">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
          isSpelling ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
        }`}>
          {index + 1}
        </div>
        <div className="flex-1 flex items-center gap-2 flex-wrap">
          <span className="px-2 py-1 bg-red-50 text-red-600 rounded-lg text-sm font-medium line-through">
            {correction.original}
          </span>
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          <span className={`px-2 py-1 rounded-lg text-sm font-semibold border ${highlightColor}`}>
            {correction.corrected}
          </span>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-md ${
          isSpelling ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-600'
        }`}>
          {correction.type || 'Spelling'}
        </span>
      </div>

      {showTooltip && (
        <div className="absolute left-0 top-full mt-2 z-20 w-72 bg-white rounded-xl shadow-xl border border-slate-100 p-4 animate-fade-in">
          <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">
            {isSpelling ? 'Spelling' : 'Grammar'} Correction
          </p>
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-1 bg-red-50 text-red-600 rounded-lg text-sm font-medium line-through">
              {correction.original}
            </span>
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-sm font-semibold">
              {correction.corrected}
            </span>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">{correction.reason}</p>
        </div>
      )}
    </div>
  );
}

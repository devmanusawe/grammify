'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useLang } from '@/components/LangProvider';
import { useSession } from 'next-auth/react';
import { RETENTION_KEYS } from '@/lib/i18n';

type Retention = '1day' | '1week' | '1month';

interface Correction {
  original: string;
  corrected: string;
  reason: string;
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


const PROVIDER_LABELS: Record<string, string> = {
  'gemini-web': '🌐 Gemini Web',
  'gemini-api': '✨ Gemini API',
  'chatgpt-web': '💬 ChatGPT Web',
  'openai-api': '🤖 ChatGPT API',
};

function getRetentionCutoff(retention: Retention): number {
  const now = Date.now();
  if (retention === '1day') return now - 24 * 60 * 60 * 1000;
  if (retention === '1week') return now - 7 * 24 * 60 * 60 * 1000;
  return now - 30 * 24 * 60 * 60 * 1000;
}

function formatDateTime(ts: number, lang: string): string {
  return new Date(ts).toLocaleString(lang === 'en' ? 'en-US' : 'th-TH', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function FloatingOrb({ className, delay = 0 }: { className: string; delay?: number }) {
  return (
    <div
      className={`absolute rounded-full blur-3xl opacity-20 animate-float ${className}`}
      style={{ animationDelay: `${delay}s` }}
    />
  );
}

export default function Dashboard() {
  const { lang, t } = useLang();
  const { data: session } = useSession();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [retention, setRetention] = useState<Retention>('1week');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const retRaw = localStorage.getItem('grammify-history-settings');
    const ret: Retention = retRaw ? (JSON.parse(retRaw).retention as Retention) : '1week';
    setRetention(ret);
    loadAndSetHistory(ret, session?.user?.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  function loadAndSetHistory(ret: Retention, userId?: string) {
    const storageKey = userId ? `grammify-history-${userId}` : 'grammify-history';
    const raw = localStorage.getItem(storageKey);
    if (!raw) { setHistory([]); return; }
    const cutoff = getRetentionCutoff(ret);
    const all: HistoryEntry[] = JSON.parse(raw);
    setHistory(all.filter(e => e.timestamp > cutoff));
  }

  function handleRetentionChange(newRet: Retention) {
    const userId = session?.user?.id;
    const storageKey = userId ? `grammify-history-${userId}` : 'grammify-history';
    setRetention(newRet);
    localStorage.setItem('grammify-history-settings', JSON.stringify({ retention: newRet }));
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const cutoff = getRetentionCutoff(newRet);
      const filtered = (JSON.parse(raw) as HistoryEntry[]).filter(e => e.timestamp > cutoff);
      localStorage.setItem(storageKey, JSON.stringify(filtered));
      setHistory(filtered);
    }
  }

  function handleClearAll() {
    const userId = session?.user?.id;
    const storageKey = userId ? `grammify-history-${userId}` : 'grammify-history';
    localStorage.removeItem(storageKey);
    setHistory([]);
    setShowClearConfirm(false);
  }

  const stats = useMemo(() => {
    const total = history.length;
    const totalErrors = history.reduce((s, e) => s + e.errorCount, 0);
    const providerCount: Record<string, number> = {};
    history.forEach(e => { providerCount[e.provider] = (providerCount[e.provider] ?? 0) + 1; });
    const topProvider = Object.entries(providerCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
    const avgErrors = total > 0 ? (totalErrors / total).toFixed(1) : '0';
    return { total, totalErrors, topProvider, avgErrors };
  }, [history]);

  const chartData = useMemo(() => {
    if (retention === '1day') {
      const byHour: Record<string, { checks: number; errors: number }> = {};
      history.forEach(e => {
        const d = new Date(e.timestamp);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`;
        if (!byHour[key]) byHour[key] = { checks: 0, errors: 0 };
        byHour[key].checks++;
        byHour[key].errors += e.errorCount;
      });
      const items = [];
      for (let i = 23; i >= 0; i--) {
        const d = new Date();
        d.setHours(d.getHours() - i, 0, 0, 0);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`;
        const label = `${d.getHours()}:00`;
        items.push({ key, label, checks: byHour[key]?.checks ?? 0, errors: byHour[key]?.errors ?? 0 });
      }
      return items;
    }

    const days = retention === '1week' ? 7 : 30;
    const byDay: Record<string, { checks: number; errors: number }> = {};
    history.forEach(e => {
      const day = new Date(e.timestamp).toLocaleDateString('en-CA');
      if (!byDay[day]) byDay[day] = { checks: 0, errors: 0 };
      byDay[day].checks++;
      byDay[day].errors += e.errorCount;
    });
    const items = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-CA');
      const label = d.toLocaleDateString('th-TH', { month: 'short', day: 'numeric' });
      items.push({ key, label, checks: byDay[key]?.checks ?? 0, errors: byDay[key]?.errors ?? 0 });
    }
    return items;
  }, [history, retention]);

  const reportData = useMemo(() => {
    const wordCount: Record<string, { count: number; corrected: string }> = {};
    history.forEach(e => {
      e.corrections.forEach(c => {
        const key = c.original.trim().toLowerCase();
        if (!wordCount[key]) wordCount[key] = { count: 0, corrected: c.corrected };
        wordCount[key].count++;
      });
    });
    const topWords = Object.entries(wordCount)
      .map(([original, v]) => ({ original, corrected: v.corrected, count: v.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const reasonCount: Record<string, number> = {};
    history.forEach(e => {
      e.corrections.forEach(c => {
        const key = c.reason.trim();
        reasonCount[key] = (reasonCount[key] ?? 0) + 1;
      });
    });
    const topReasons = Object.entries(reasonCount)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const passCount = history.filter(e => e.errorCount === 0).length;
    const failCount = history.filter(e => e.errorCount > 0).length;

    const byHourOfDay: number[] = Array(24).fill(0);
    history.forEach(e => {
      byHourOfDay[new Date(e.timestamp).getHours()]++;
    });
    const peakHour = byHourOfDay.indexOf(Math.max(...byHourOfDay));

    return { topWords, topReasons, passCount, failCount, byHourOfDay, peakHour };
  }, [history]);

  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return history;
    const q = searchQuery.toLowerCase();
    return history.filter(e => 
      e.originalText.toLowerCase().includes(q) || 
      e.correctedText.toLowerCase().includes(q)
    );
  }, [history, searchQuery]);

  if (!mounted) return null;

  const maxChecks = Math.max(...chartData.map(d => d.checks), 1);
  const maxErrors = Math.max(...chartData.map(d => d.errors), 1);
  const labelStep = Math.ceil(chartData.length / 7);

  const sidebarMenu = [
    { id: 'overview', label: lang === 'th' ? 'ภาพรวม' : 'Overview', icon: '📊', badge: null },
    { id: 'history', label: lang === 'th' ? 'ประวัติ' : 'History', icon: '📜', badge: history.length > 0 ? history.length : null },
    { id: 'analytics', label: lang === 'th' ? 'วิเคราะห์' : 'Analytics', icon: '📈', badge: null },
    { id: 'settings', label: lang === 'th' ? 'ตั้งค่า' : 'Settings', icon: '⚙️', badge: null },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 relative overflow-hidden flex">

      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <FloatingOrb className="w-96 h-96 bg-gradient-to-br from-indigo-400/30 to-violet-400/30 -top-48 -right-48" delay={0} />
        <FloatingOrb className="w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 top-1/2 -left-40" delay={2} />
        <FloatingOrb className="w-64 h-64 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 bottom-20 right-20" delay={4} />
      </div>

      <aside className="w-72 glass border-r border-white/50 min-h-screen sticky top-0 z-30 flex flex-col">
        <nav className="flex-1 p-4 pt-8">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mb-3">
            {lang === 'th' ? 'เมนู' : 'Menu'}
          </p>
          <div className="space-y-1">
            {sidebarMenu.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-200/50'
                    : 'text-slate-600 hover:bg-white/60 hover:text-indigo-600'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-bold flex-1">{item.label}</span>
                {item.badge && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    activeTab === item.id ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-600'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </nav>
      </aside>

      <main className="flex-1 px-6 py-8 relative z-10 min-h-screen">
        <div className="flex items-center justify-between mb-8">
          {activeTab === 'overview' && (
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-slate-800">{lang === 'th' ? 'ยินดีต้อนรับ' : 'Welcome Back'}</h2>
              <span className="text-2xl">👋</span>
            </div>
          )}
          {activeTab === 'history' && (
            <h2 className="text-2xl font-black text-slate-800">{lang === 'th' ? 'ประวัติการใช้งาน' : 'History'}</h2>
          )}
          {activeTab === 'analytics' && (
            <h2 className="text-2xl font-black text-slate-800">{lang === 'th' ? 'การวิเคราะห์' : 'Analytics'}</h2>
          )}
          {activeTab === 'settings' && (
            <h2 className="text-2xl font-black text-slate-800">{lang === 'th' ? 'ตั้งค่า' : 'Settings'}</h2>
          )}

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/80 backdrop-blur-sm border border-slate-100/50 shadow-sm">
              {(['1day', '1week', '1month'] as Retention[]).map((r) => (
                <button
                  key={r}
                  onClick={() => handleRetentionChange(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    retention === r
                      ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {t(RETENTION_KEYS[r])}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowClearConfirm(true)}
              disabled={history.length === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 font-bold text-sm ${
                history.length === 0 ? 'opacity-30 cursor-not-allowed text-slate-400' : 'hover:bg-red-50 text-red-500 hover:text-red-600 bg-white/80 border border-slate-100/50 shadow-sm hover:border-red-200'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="hidden sm:inline">{t('clearData')}</span>
            </button>
          </div>
        </div>
        <div className="max-w-5xl mx-auto space-y-8">

          {(activeTab === 'overview') && (
            <p className="text-slate-500 text-sm">{lang === 'th' ? 'นี่คือภาพรวมการใช้งานของคุณ' : 'Here is your usage overview'}</p>
          )}

          {(activeTab === 'overview') && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: t('totalChecks'),
                  value: stats.total,
                  unit: t('times'),
                  gradient: 'from-indigo-500 to-violet-600',
                  emoji: '🔍',
                },
                {
                  label: t('totalErrors'),
                  value: stats.totalErrors,
                  unit: t('points'),
                  gradient: 'from-amber-500 to-orange-600',
                  emoji: '⚠️',
                },
                {
                  label: t('avgErrors'),
                  value: stats.avgErrors,
                  unit: t('pointsPerTime'),
                  gradient: 'from-purple-500 to-pink-600',
                  emoji: '📊',
                },
                {
                  label: t('topAI'),
                  value: null,
                  valueText: stats.topProvider ? (PROVIDER_LABELS[stats.topProvider] ?? stats.topProvider) : '—',
                  unit: '',
                  gradient: 'from-emerald-500 to-teal-600',
                  emoji: '🤖',
                },
              ].map((card, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-3 shadow-sm`}>
                    <span className="text-lg">{card.emoji}</span>
                  </div>
                  {card.value !== null ? (
                    <div className="text-3xl font-bold text-slate-800 leading-none">{card.value}</div>
                  ) : (
                    <div className="text-sm font-semibold text-slate-800 leading-snug">{card.valueText}</div>
                  )}
                  {card.unit && <div className="text-xs text-slate-400 mt-1">{card.unit}</div>}
                  <div className="text-xs text-slate-500 mt-2 font-medium">{card.label}</div>
                </div>
              ))}
            </div>
          )}

          {(activeTab === 'overview' || activeTab === 'analytics') && history.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[
                { title: t('checksChartTitle'), dataKey: 'checks' as const, gradient: 'from-indigo-500 to-violet-600', unit: t('times'), max: maxChecks, emoji: '📈' },
                { title: t('errorsChartTitle'), dataKey: 'errors' as const, gradient: 'from-amber-400 to-orange-500', unit: t('points'), max: maxErrors, emoji: '📉' },
              ].map((chart) => (
                <div key={chart.dataKey} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 animate-scale-in">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                      <span className="text-lg">{chart.emoji}</span>
                      {chart.title}
                    </h3>
                    <span className="text-xs text-slate-400 px-2 py-1 bg-slate-50 rounded-lg">
                      {retention === '1day' ? t('perHour') : t('perDay')}
                    </span>
                  </div>
                  <div className="flex items-end gap-0.5 h-28 mb-3">
                    {chartData.map((d) => (
                      <div key={d.key} className="flex-1 flex items-end h-28 group relative">
                        {d[chart.dataKey] > 0 && (
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs rounded-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none z-10 shadow-lg text-center">
                            {d[chart.dataKey]} {chart.unit}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-3 border-transparent border-t-slate-800" />
                          </div>
                        )}
                        <div
                          className={`w-full rounded-t-sm bg-gradient-to-t ${chart.gradient} transition-all cursor-default hover:opacity-80`}
                          style={{
                            height: `${Math.max((d[chart.dataKey] / chart.max) * 100, d[chart.dataKey] > 0 ? 4 : 0)}%`,
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-0.5">
                    {chartData.map((d, i) => (
                      <div key={d.key} className="flex-1 overflow-hidden text-center">
                        {i % labelStep === 0 && (
                          <span className="text-[10px] text-slate-400 block truncate">{d.label}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'analytics' && history.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
 
              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm p-5 animate-scale-in">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xl">🔤</span>
                  <div>
                    <h3 className="font-semibold text-slate-700 text-sm">{t('topMisspelledTitle')}</h3>
                    <p className="text-xs text-slate-400">{t('topMisspelledSub')}</p>
                  </div>
                </div>
                {reportData.topWords.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-6">{t('noMisspelledData')}</p>
                ) : (
                  <div className="space-y-2">
                    {reportData.topWords.map((w, i) => {
                      const maxCount = reportData.topWords[0].count;
                      const barPct = maxCount > 1 ? (w.count / maxCount) * 100 : 100;
                      const isTop = i === 0 && w.count > 1;
                      return (
                        <div key={i} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${isTop ? 'bg-red-50' : 'hover:bg-slate-50'}`}>
                          <span className="text-xs text-slate-300 w-4 text-right flex-shrink-0">{i + 1}</span>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-sm text-red-500 line-through truncate max-w-[100px]">{w.original}</span>
                            <svg className="w-3 h-3 text-slate-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                            <span className="text-sm font-semibold text-emerald-600 truncate">{w.corrected}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {maxCount > 1 && (
                              <div className="w-16 bg-slate-100 rounded-full h-1.5">
                                <div
                                  className="bg-gradient-to-r from-red-400 to-rose-500 h-1.5 rounded-full"
                                  style={{ width: `${barPct}%` }}
                                />
                              </div>
                            )}
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${
                              w.count >= 3 ? 'bg-red-100 text-red-600' :
                              w.count === 2 ? 'bg-amber-100 text-amber-600' :
                              'bg-slate-100 text-slate-500'
                            }`}>{w.count}×</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4">

                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 animate-scale-in">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xl">📊</span>
                    <div>
                      <h3 className="font-semibold text-slate-700 text-sm">{t('accuracyTitle')}</h3>
                      <p className="text-xs text-slate-400">{t('accuracySub')}</p>
                    </div>
                  </div>
                  {(() => {
                    const total = reportData.passCount + reportData.failCount;
                    const pct = total > 0 ? Math.round((reportData.passCount / total) * 100) : 0;
                    const r = 28; const circ = 2 * Math.PI * r;
                    const dash = (pct / 100) * circ;
                    const strokeColor = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';
                    return (
                      <div className="flex items-center gap-4">
                        <div className="relative w-20 h-20 flex-shrink-0">
                          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 64 64">
                            <circle cx="32" cy="32" r={r} fill="none" stroke="#f1f5f9" strokeWidth="6" />
                            <circle
                              cx="32" cy="32" r={r} fill="none"
                              stroke={strokeColor}
                              strokeWidth="6"
                              strokeDasharray={`${dash} ${circ}`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-slate-700">{pct}%</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 flex-shrink-0" />
                            <span className="text-xs text-slate-500">{t('passLabel', { count: reportData.passCount })}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 flex-shrink-0" />
                            <span className="text-xs text-slate-500">{t('failLabel', { count: reportData.failCount })}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 animate-scale-in" style={{ animationDelay: '0.1s' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xl">⏰</span>
                    <div>
                      <h3 className="font-semibold text-slate-700 text-sm">{t('peakHourTitle')}</h3>
                      <p className="text-xs text-slate-400">{t('peakHourSub')}</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-slate-800">
                      {reportData.byHourOfDay.every(h => h === 0) ? '—' : `${reportData.peakHour}:00`}
                    </div>
                    {!reportData.byHourOfDay.every(h => h === 0) && (
                      <p className="text-xs text-slate-400 mt-1">
                        {reportData.peakHour < 6 ? t('timeMidnight') : reportData.peakHour < 12 ? t('timeMorning') : reportData.peakHour < 18 ? t('timeAfternoon') : t('timeEvening')}
                      </p>
                    )}
                    <div className="flex items-end gap-px mt-3 h-8 justify-center">
                      {reportData.byHourOfDay.map((v, h) => {
                        const maxV = Math.max(...reportData.byHourOfDay, 1);
                        return (
                          <div
                            key={h}
                            title={`${h}:00 — ${v} ${t('times')}`}
                            className={`flex-1 rounded-t-sm transition-all ${
                              h === reportData.peakHour && v > 0 ? 'bg-indigo-500' : v > 0 ? 'bg-indigo-200' : 'bg-slate-100'
                            }`}
                            style={{ height: `${Math.max((v / maxV) * 100, v > 0 ? 20 : 8)}%` }}
                          />
                        );
                      })}
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-slate-400">0:00</span>
                      <span className="text-[10px] text-slate-400">12:00</span>
                      <span className="text-[10px] text-slate-400">23:00</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-scale-in">
              <div className="p-5 border-b border-slate-100">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-semibold text-slate-700 flex items-center gap-3">
                    <span className="text-xl">📜</span>
                    {t('historyTitle')}
                  </h3>
                  {history.length > 0 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const text = history.map(e => `Original: ${e.originalText}\nCorrected: ${e.correctedText}`).join('\n\n');
                          navigator.clipboard.writeText(text);
                        }}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="Copy all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                      </button>
                      <span className="text-xs text-slate-400 px-2 py-1 bg-slate-50 rounded-lg">
                        {history.length} items
                      </span>
                    </div>
                  )}
                </div>

                {history.length > 0 && (
                  <div className="mt-3 relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={lang === 'th' ? 'ค้นหาประวัติ...' : 'Search history...'}
                      className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
                    />
                    <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                )}
              </div>

              {history.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                    <span className="text-4xl">📋</span>
                  </div>
                  <p className="text-slate-600 font-semibold text-base">{t('noHistoryTitle')}</p>
                  <p className="text-slate-400 text-sm mt-1 mb-6">{t('noHistoryDesc')}</p>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md"
                  >
                    {t('startUsing')}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="py-12 text-center">
                  <span className="text-4xl">🔍</span>
                  <p className="text-slate-500 text-sm mt-3">{lang === 'th' ? 'ไม่พบผลลัพธ์' : 'No results found'}</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {filteredHistory.map((entry) => (
                    <div
                      key={entry.id}
                      onClick={() => setSelectedEntry(entry)}
                      onKeyDown={(e) => e.key === 'Enter' && setSelectedEntry(entry)}
                      role="button"
                      tabIndex={0}
                      className="w-full text-left px-5 py-4 hover:bg-slate-50 transition-all flex items-center gap-4 cursor-pointer"
                    >
                      <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                        entry.errorCount > 0 ? 'bg-amber-50' : 'bg-emerald-50'
                      }`}>
                        {entry.errorCount > 0 ? (
                          <span className="text-amber-500">⚠️</span>
                        ) : (
                          <span className="text-emerald-500">✓</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-800 truncate font-medium">{entry.originalText}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {formatDateTime(entry.timestamp, lang)}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                        entry.errorCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {entry.errorCount > 0 ? `${entry.errorCount} errors` : 'Passed'}
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEntry(entry);
                        }}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="View"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && reportData.topReasons.length > 0 && (
            <div className="glass rounded-3xl border border-white/50 shadow-xl p-6 animate-scale-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-200">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-slate-700 text-base">{t('topReasonsTitle')}</h3>
                  <p className="text-xs text-slate-400">{t('topReasonsSub')}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {reportData.topReasons.map((r, i) => {
                  const maxCount = reportData.topReasons[0].count;
                  const gradients = [
                    { bg: 'from-purple-500 to-pink-600', light: 'from-purple-50/80 to-pink-50/80', text: 'text-purple-700' },
                    { bg: 'from-indigo-500 to-violet-600', light: 'from-indigo-50/80 to-violet-50/80', text: 'text-indigo-700' },
                    { bg: 'from-blue-500 to-cyan-600', light: 'from-blue-50/80 to-cyan-50/80', text: 'text-blue-700' },
                    { bg: 'from-cyan-500 to-teal-600', light: 'from-cyan-50/80 to-teal-50/80', text: 'text-cyan-700' },
                    { bg: 'from-teal-500 to-emerald-600', light: 'from-teal-50/80 to-emerald-50/80', text: 'text-teal-700' },
                  ];
                  const c = gradients[i % gradients.length];
                  return (
                    <div key={i} className={`bg-gradient-to-br ${c.light} rounded-2xl p-5 transition-all hover-lift`}>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <p className={`text-sm font-semibold ${c.text} line-clamp-2 leading-relaxed`}>{r.reason}</p>
                        <span className={`flex-shrink-0 text-xs font-bold bg-gradient-to-br ${c.bg} text-white px-2.5 py-1 rounded-lg`}>{r.count}×</span>
                      </div>
                      <div className="w-full bg-white/60 rounded-full h-2">
                        <div
                          className={`bg-gradient-to-r ${c.bg} h-2 rounded-full transition-all`}
                          style={{ width: `${(r.count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {selectedEntry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in"
          onClick={() => setSelectedEntry(null)}
        >
          <div
            className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto border border-white/20 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100/50 sticky top-0 bg-white/95 backdrop-blur-xl rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-slate-800">{t('detailTitle')}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {formatDateTime(selectedEntry.timestamp, lang)} · {PROVIDER_LABELS[selectedEntry.provider] ?? selectedEntry.provider}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedEntry(null)} className="p-2.5 hover:bg-slate-100 rounded-xl transition-all hover:scale-105">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('originalLabel')}</p>
                <p className="text-sm text-slate-700 bg-slate-50/80 rounded-2xl p-4 leading-relaxed whitespace-pre-wrap font-medium">{selectedEntry.originalText}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('correctedLabel')}</p>
                <p className="text-sm text-slate-700 bg-gradient-to-br from-indigo-50/80 to-violet-50/80 rounded-2xl p-4 leading-relaxed whitespace-pre-wrap font-medium">{selectedEntry.correctedText}</p>
              </div>
              {selectedEntry.corrections.length > 0 ? (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    {t('correctionsLabel', { count: selectedEntry.corrections.length })}
                  </p>
                  <div className="space-y-3">
                    {selectedEntry.corrections.map((c, i) => (
                      <div key={i} className="bg-gradient-to-br from-slate-50/80 to-slate-100/80 rounded-2xl p-4">
                        <div className="flex items-center gap-3 text-sm flex-wrap">
                          <span className="line-through text-red-500 bg-red-50 px-3 py-1.5 rounded-xl font-medium">{c.original}</span>
                          <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                          <span className="text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl font-bold">{c.corrected}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-2.5 font-medium">{c.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-5 bg-gradient-to-r from-emerald-50/80 to-teal-50/80 rounded-2xl text-emerald-600 text-sm font-bold">
                  {t('noErrorBadge')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center border border-white/20 animate-scale-in">
            <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-red-200">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">{t('clearConfirmTitle')}</h3>
            <p className="text-slate-500 text-sm mb-7 font-medium">
              {t('clearConfirmDesc', { count: history.length })}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all hover-lift"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleClearAll}
                className="flex-1 py-3.5 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-red-200 hover-lift"
              >
                {t('clearBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useLang } from '@/components/LangProvider';

export function Footer() {
  const { lang } = useLang();

  return (
    <footer className="mt-auto relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-50/50 to-slate-100/80" />
      
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-12 flex flex-col sm:flex-row items-start justify-between gap-10">

        <div className="flex flex-col gap-4 max-w-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200/50">
              <svg style={{width:'18px',height:'18px'}} className="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <span className="font-black text-xl text-slate-800">
              Grammi<span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">fy</span>
            </span>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed">
            {lang === 'th'
              ? 'ตรวจสอบและแก้ไขไวยากรณ์ด้วย AI อย่างรวดเร็วและแม่นยำ'
              : 'Grammar checking and correction powered by AI — fast, accurate, and easy to use.'}
          </p>
          <span className="inline-flex items-center gap-2 w-fit px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100/50 text-emerald-600 text-xs font-bold shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            {lang === 'th' ? 'พร้อมใช้งาน' : 'All systems operational'}
          </span>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
            {lang === 'th' ? 'เมนู' : 'Navigate'}
          </p>
          <Link href="/" className="group flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 font-semibold transition-all">
            <svg className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            {lang === 'th' ? 'ตรวจสอบไวยากรณ์' : 'Grammar Checker'}
          </Link>
          <Link href="/dashboard" className="group flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 font-semibold transition-all">
            <svg className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            {lang === 'th' ? 'แดชบอร์ด' : 'Dashboard'}
          </Link>
        </div>
      </div>

      <div className="relative border-t border-slate-200/50 bg-white/30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <p className="text-xs text-slate-400 font-medium">
            © {new Date().getFullYear()} Grammify.{' '}
            {lang === 'th' ? 'สงวนลิขสิทธิ์' : 'All rights reserved.'}
          </p>
          <p className="text-xs text-slate-300 hidden sm:flex items-center gap-1.5 font-medium">
            {lang === 'th' ? 'สร้างด้วย' : 'Built with'}
            <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            + AI
          </p>
        </div>
      </div>
    </footer>
  );
}

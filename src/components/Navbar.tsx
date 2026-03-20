'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLang } from '@/components/LangProvider';
import { useSession, signOut } from 'next-auth/react';

export function Navbar() {
  const { lang, setLang } = useLang();
  const pathname = usePathname();
  const { data: session } = useSession();

  const navLinks = [
    { href: '/', label: 'navChecker', icon: '🔍' },
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  ];

  return (
    <nav className="sticky top-0 z-40 glass border-b border-white/30 shadow-xl shadow-indigo-500/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        <Link href="/" className="flex items-center gap-3 flex-shrink-0 group">
          <div className="relative">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-md shadow-indigo-200/60 group-hover:shadow-indigo-300/60 group-hover:scale-105 transition-all duration-200">
              <svg style={{width:'18px',height:'18px'}} className="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white shadow-sm" />
          </div>
          <div className="leading-none">
            <p className="font-extrabold text-xl tracking-tight text-slate-800">
              Grammi<span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">fy</span>
            </p>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide mt-0.5">AI Grammar Checker</p>
          </div>
        </Link>

        <div className="hidden sm:flex items-center gap-6">
          {navLinks.map(({ href, label, icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-2 text-sm font-semibold pb-0.5 transition-colors duration-150 ${
                  active ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>{icon}</span>
                {label === 'navChecker' ? (lang === 'th' ? 'ตรวจสอบ' : 'Checker') : label}
                <span
                  className={`absolute -bottom-0.5 left-0 h-0.5 bg-indigo-500 rounded-full transition-all duration-200 ${
                    active ? 'w-full' : 'w-0'
                  }`}
                />
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex sm:hidden items-center gap-0.5 bg-slate-100 p-0.5 rounded-xl mr-1">
            {navLinks.map(({ href, label, icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-xs font-semibold transition-all ${
                  pathname === href
                    ? 'bg-white text-indigo-600 shadow-[0_1px_8px_rgba(0,0,0,0.04)]'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <span className="text-sm leading-none">{icon}</span>
                <span className="hidden xs:inline-block">{label === 'navChecker' ? (lang === 'th' ? 'ตรวจสอบ' : 'Checker') : label}</span>
              </Link>
            ))}
          </div>

          {pathname === '/' && (
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('open-settings'));
              }}
              title={lang === 'th' ? 'ตั้งค่าเครือข่าย AI' : 'AI Settings'}
              className="flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-500 hover:text-indigo-600 transition-all duration-200 shadow-sm active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          )}

          <button
            onClick={() => setLang(lang === 'th' ? 'en' : 'th')}
            title={lang === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm"
          >
            <span className="text-lg leading-none">{lang === 'th' ? '🇹🇭' : '🇺🇸'}</span>
          </button>

          {session ? (
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
                {session.user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-red-50 hover:text-red-500 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          ) : (
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-indigo-500/30"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

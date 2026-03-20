export type Lang = 'th' | 'en';

const translations = {
  th: {
    // Header / Nav
    subtitle: 'ตรวจสอบคำผิดด้วย AI',
    dashboard: 'Dashboard',
    settings: 'ตั้งค่า',
    footer: 'สร้างด้วย Next.js และ AI',

    // Settings modal
    settingsTitle: 'ตั้งค่า AI',
    selectProvider: 'เลือก AI Provider',
    geminiWebLabel: 'Gemini (เว็บ)',
    geminiWebDesc: 'ใช้หน้าเว็บ gemini.google.com โดยตรง ไม่ต้องใช้ API Key',
    geminiApiLabel: 'Gemini API',
    geminiApiDesc: 'ใช้ Google Gemini API ต้องใส่ API Key',
    chatgptWebLabel: 'ChatGPT (เว็บ)',
    chatgptWebDesc: 'ใช้หน้าเว็บ chatgpt.com โดยตรง ไม่ต้องใช้ API Key',
    openaiApiLabel: 'ChatGPT (OpenAI API)',
    openaiApiDesc: 'ใช้ OpenAI API (gpt-4o-mini) ต้องใส่ API Key',
    cancel: 'ยกเลิก',
    save: 'บันทึก',

    // Main page
    inputLabel: 'ข้อความที่ต้องการตรวจสอบ',
    inputPlaceholder: 'พิมพ์หรือวางข้อความที่ต้องการตรวจสอบที่นี่...',
    characters: 'ตัวอักษร',
    checking: 'กำลังตรวจสอบ...',
    check: 'ตรวจสอบ',
    clear: 'ล้าง',
    hintTitle: 'พิมพ์ข้อความแล้วกด "ตรวจสอบ"',
    hintSub: 'รองรับทั้งภาษาไทยและภาษาอังกฤษ',
    errorTitle: 'เกิดข้อผิดพลาด',
    correctionsTitle: 'รายการแก้ไข',
    errorsFound: 'พบคำผิด {count} จุด',
    noErrorsTitle: 'ไม่พบคำผิด!',
    noErrorsSub: 'ข้อความของคุณถูกต้องแล้ว',
    correctedTitle: 'ประโยคที่แก้ถูกต้องแล้ว',
    copied: 'คัดลอกแล้ว!',
    copy: 'คัดลอก',

    // Dashboard header
    dashboardTitle: 'Dashboard',
    dashboardSub: 'ประวัติและสถิติการตรวจสอบ',
    back: 'กลับหน้าหลัก',
    clearData: 'เคลียร์ข้อมูล',

    // Retention
    retention1day: 'วัน',
    retention1week: 'อาทิตย์',
    retention1month: 'เดือน',
    retentionLabel: 'เก็บประวัติย้อนหลัง:',
    retentionHint: 'ประวัติเก่ากว่า {period} จะถูกลบอัตโนมัติ',

    // Stats
    totalChecks: 'ตรวจสอบทั้งหมด',
    totalErrors: 'พบคำผิดทั้งหมด',
    avgErrors: 'เฉลี่ยคำผิด/ครั้ง',
    topAI: 'AI ที่ใช้บ่อยสุด',
    times: 'ครั้ง',
    points: 'จุด',
    pointsPerTime: 'จุด/ครั้ง',

    // Charts
    checksChartTitle: 'จำนวนการตรวจสอบ',
    errorsChartTitle: 'คำผิดที่พบ',
    perHour: 'รายชั่วโมง',
    perDay: 'รายวัน',
    checksTooltip: '{count} ครั้ง',
    errorsTooltip: '{count} จุด',

    // Report
    topMisspelledTitle: 'คำที่ผิดบ่อย',
    topMisspelledSub: 'เรียงตามความถี่',
    noMisspelledData: 'ยังไม่มีข้อมูลคำผิด',
    accuracyTitle: 'อัตราผ่าน',
    accuracySub: 'ไม่พบคำผิด',
    passLabel: 'ผ่าน {count} ครั้ง',
    failLabel: 'มีผิด {count} ครั้ง',
    peakHourTitle: 'เวลาที่ใช้บ่อยสุด',
    peakHourSub: 'ช่วงโมงที่ active ที่สุด',
    timeMidnight: '🌙 ดึก',
    timeMorning: '🌅 เช้า',
    timeAfternoon: '☀️ บ่าย',
    timeEvening: '🌆 เย็น/ค่ำ',
    topReasonsTitle: 'ประเภทข้อผิดพลาดที่พบบ่อย',
    topReasonsSub: 'เหตุผลที่ AI แก้ไขบ่อยที่สุด',

    // History
    historyTitle: 'ประวัติการตรวจสอบ',
    historyCount: '{count} รายการ',
    noHistoryTitle: 'ยังไม่มีประวัติการตรวจสอบ',
    noHistoryDesc: 'ประวัติจะแสดงหลังจากใช้งานครั้งแรก',
    startUsing: 'เริ่มต้นใช้งาน',
    hasErrors: '{count} คำผิด',
    passed: 'ผ่าน',

    // Detail modal
    detailTitle: 'รายละเอียดการตรวจสอบ',
    originalLabel: 'ข้อความต้นฉบับ',
    correctedLabel: 'ข้อความที่แก้แล้ว',
    correctionsLabel: 'รายการแก้ไข ({count} จุด)',
    noErrorBadge: '✅ ไม่พบคำผิด',
    approveAll: 'Approve All',
    rejectAll: 'Reject All',

    // Clear confirm
    clearConfirmTitle: 'เคลียร์ข้อมูลทั้งหมด?',
    clearConfirmDesc: 'ประวัติการตรวจสอบ {count} รายการจะถูกลบถาวร ไม่สามารถกู้คืนได้',
    clearBtn: 'เคลียร์',
  },

  en: {
    // Header / Nav
    subtitle: 'AI-powered grammar checker',
    dashboard: 'Dashboard',
    settings: 'Settings',
    footer: 'Built with Next.js and AI',

    // Settings modal
    settingsTitle: 'AI Settings',
    selectProvider: 'Select AI Provider',
    geminiWebLabel: 'Gemini (Web)',
    geminiWebDesc: 'Use gemini.google.com directly. No API Key needed.',
    geminiApiLabel: 'Gemini API',
    geminiApiDesc: 'Use Google Gemini API. Requires an API Key.',
    chatgptWebLabel: 'ChatGPT (Web)',
    chatgptWebDesc: 'Use chatgpt.com directly. No API Key needed.',
    openaiApiLabel: 'ChatGPT (OpenAI API)',
    openaiApiDesc: 'Use OpenAI API (gpt-4o-mini). Requires an API Key.',
    cancel: 'Cancel',
    save: 'Save',

    // Main page
    inputLabel: 'Text to check',
    inputPlaceholder: 'Type or paste text to check here...',
    characters: 'characters',
    checking: 'Checking...',
    check: 'Check',
    clear: 'Clear',
    hintTitle: 'Type text and press "Check"',
    hintSub: 'Supports both Thai and English',
    errorTitle: 'Error',
    correctionsTitle: 'Corrections',
    errorsFound: '{count} error(s) found',
    noErrorsTitle: 'No errors found!',
    noErrorsSub: 'Your text looks correct.',
    correctedTitle: 'Corrected Text',
    copied: 'Copied!',
    copy: 'Copy',

    // Dashboard header
    dashboardTitle: 'Dashboard',
    dashboardSub: 'History & Statistics',
    back: 'Back',
    clearData: 'Clear Data',

    // Retention
    retention1day: 'Day',
    retention1week: 'Week',
    retention1month: 'Month',
    retentionLabel: 'Keep history for:',
    retentionHint: 'Records older than {period} will be deleted automatically.',

    // Stats
    totalChecks: 'Total Checks',
    totalErrors: 'Total Errors',
    avgErrors: 'Avg Errors/Check',
    topAI: 'Most Used AI',
    times: 'times',
    points: 'errors',
    pointsPerTime: 'errors/check',

    // Charts
    checksChartTitle: 'Number of Checks',
    errorsChartTitle: 'Errors Found',
    perHour: 'Hourly',
    perDay: 'Daily',
    checksTooltip: '{count} checks',
    errorsTooltip: '{count} errors',

    // Report
    topMisspelledTitle: 'Most Misspelled Words',
    topMisspelledSub: 'Sorted by frequency',
    noMisspelledData: 'No misspelling data yet.',
    accuracyTitle: 'Pass Rate',
    accuracySub: 'No errors found',
    passLabel: 'Pass {count}x',
    failLabel: 'Fail {count}x',
    peakHourTitle: 'Peak Usage Hour',
    peakHourSub: 'Most active time of day',
    timeMidnight: '🌙 Late night',
    timeMorning: '🌅 Morning',
    timeAfternoon: '☀️ Afternoon',
    timeEvening: '🌆 Evening',
    topReasonsTitle: 'Most Common Error Types',
    topReasonsSub: 'Reasons AI corrected most often',

    // History
    historyTitle: 'Check History',
    historyCount: '{count} records',
    noHistoryTitle: 'No history yet',
    noHistoryDesc: 'History will appear after your first check.',
    startUsing: 'Get started',
    hasErrors: '{count} error(s)',
    passed: 'Passed',

    // Detail modal
    detailTitle: 'Check Details',
    originalLabel: 'Original Text',
    correctedLabel: 'Corrected Text',
    correctionsLabel: 'Corrections ({count})',
    noErrorBadge: '✅ No errors found',
    approveAll: 'Approve All',
    rejectAll: 'Reject All',

    // Clear confirm
    clearConfirmTitle: 'Clear all data?',
    clearConfirmDesc: '{count} records will be permanently deleted and cannot be recovered.',
    clearBtn: 'Clear',
  },
} as const;

type Translations = typeof translations.th;
type TKey = keyof Translations;

export function createT(lang: Lang) {
  return function t(key: TKey, vars?: Record<string, string | number>): string {
    let str: string = translations[lang][key] ?? translations.th[key] ?? key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }
    return str;
  };
}

export const RETENTION_KEYS = {
  '1day': 'retention1day',
  '1week': 'retention1week',
  '1month': 'retention1month',
} as const satisfies Record<string, TKey>;

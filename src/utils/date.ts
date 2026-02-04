import NepaliDate from 'nepali-date-converter';

const NEPAL_TZ = 'Asia/Kathmandu';
const NEPALI_MONTHS = [
  'बैशाख',
  'जेठ',
  'असार',
  'साउन',
  'भदौ',
  'असोज',
  'कात्तिक',
  'मंसिर',
  'पुस',
  'माघ',
  'फागुन',
  'चैत',
];
const NEPALI_WEEKDAYS: Record<string, string> = {
  Sunday: 'आइतबार',
  Monday: 'सोमबार',
  Tuesday: 'मंगलबार',
  Wednesday: 'बुधबार',
  Thursday: 'बिहीबार',
  Friday: 'शुक्रबार',
  Saturday: 'शनिबार',
};
const NEPALI_DIGITS: Record<string, string> = {
  '0': '०',
  '1': '१',
  '2': '२',
  '3': '३',
  '4': '४',
  '5': '५',
  '6': '६',
  '7': '७',
  '8': '८',
  '9': '९',
};

function toDate(value?: string | Date): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
    // SQLite datetime('now') -> UTC without timezone
    return new Date(`${value.replace(' ', 'T')}Z`);
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00+05:45`);
  }
  return new Date(value);
}

function getNepalDateString(adDate: Date): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: NEPAL_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(adDate); // YYYY-MM-DD
}

function getNepalTimeString(adDate: Date): string {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: NEPAL_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return formatter.format(adDate);
}

function getNepalTimeString12(adDate: Date): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: NEPAL_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  const parts = formatter.formatToParts(adDate);
  const hour = parts.find((p) => p.type === 'hour')?.value ?? '';
  const minute = parts.find((p) => p.type === 'minute')?.value ?? '';
  const dayPeriod = parts.find((p) => p.type === 'dayPeriod')?.value ?? '';
  return `${hour}:${minute} ${dayPeriod}`.trim();
}

export function getNepaliGreeting(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: NEPAL_TZ,
    hour: '2-digit',
    hour12: false,
  });
  const hourStr = formatter.format(date);
  const hour = Number(hourStr);
  if (hour >= 5 && hour < 12) return 'शुभ बिहान';
  if (hour >= 12 && hour < 17) return 'शुभ दिउँसो';
  if (hour >= 17 && hour < 21) return 'शुभ साँझ';
  return 'शुभ रात्री';
}

function toNepaliDigits(value: string): string {
  return value.replace(/[0-9]/g, (d) => NEPALI_DIGITS[d] ?? d);
}

export function formatNepaliDateLong(date: Date = new Date()): string {
  const d = toDate(date) ?? new Date();
  const nepalDateStr = getNepalDateString(d);
  const nepalMidnight = new Date(`${nepalDateStr}T00:00:00+05:45`);
  const nep = new NepaliDate(nepalMidnight);
  const bsStr = nep.format('YYYY-MM-DD');
  const bs = parseBsDate(bsStr);
  const monthName = bs ? NEPALI_MONTHS[bs.month - 1] ?? '' : '';
  const dayStr = bs ? toNepaliDigits(String(bs.day)) : '';
  const weekdayEng = new Intl.DateTimeFormat('en-US', {
    timeZone: NEPAL_TZ,
    weekday: 'long',
  }).format(d);
  const weekdayNep = NEPALI_WEEKDAYS[weekdayEng] ?? '';
  if (!weekdayNep || !monthName || !dayStr) return bsStr;
  return `${weekdayNep}, ${monthName} ${dayStr}`;
}

export function formatNepaliDate(value?: string | Date): string {
  const d = toDate(value);
  if (!d || Number.isNaN(d.getTime())) return value ? String(value) : '—';
  const nepalDateStr = getNepalDateString(d);
  const nepalMidnight = new Date(`${nepalDateStr}T00:00:00+05:45`);
  const nep = new NepaliDate(nepalMidnight);
  return nep.format('YYYY-MM-DD');
}

export function formatNepaliDateTime(value?: string | Date): string {
  const d = toDate(value);
  if (!d || Number.isNaN(d.getTime())) return value ? String(value) : '—';
  const nepDate = formatNepaliDate(d);
  const time = getNepalTimeString12(d);
  return `${nepDate} ${time}`;
}

function parseBsDate(bs: string): { year: number; month: number; day: number } | null {
  const m = bs.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

function bsToAdDate(bsYear: number, bsMonth: number, bsDay: number): Date | null {
  const resolveDate = (nep: any): Date | null => {
    return nep?.getADDate?.() || nep?.getAD?.() || nep?.toJsDate?.() || null;
  };
  const isValid = (d: Date | null) => !!d && !Number.isNaN(d.getTime());

  try {
    const nep = new (NepaliDate as any)(bsYear, bsMonth, bsDay);
    const ad = resolveDate(nep);
    if (isValid(ad)) return ad as Date;
  } catch {
    // ignore and try fallback
  }

  // Some libraries expect zero-based month; retry with month-1.
  try {
    const nep = new (NepaliDate as any)(bsYear, Math.max(bsMonth - 1, 0), bsDay);
    const ad = resolveDate(nep);
    if (isValid(ad)) return ad as Date;
  } catch {
    // ignore
  }

  return null;
}

function toAdDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function convertBsToAdDateString(
  bsYear: number,
  bsMonth: number,
  bsDay: number,
): string | null {
  const ad = bsToAdDate(bsYear, bsMonth, bsDay);
  return ad ? toAdDateString(ad) : null;
}

export function getNepaliRange(range: 'today' | 'week' | 'month' | 'year'): {
  startAD: string;
  endAD: string;
} {
  const now = new Date();
  const nepToday = new NepaliDate(now);
  const bsTodayStr = (nepToday as any).format?.('YYYY-MM-DD') || formatNepaliDate(now);
  const bs = parseBsDate(bsTodayStr) ?? {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  };

  if (range === 'today') {
    const adDate = bsToAdDate(bs.year, bs.month, bs.day) ?? now;
    const iso = toAdDateString(adDate);
    return { startAD: iso, endAD: iso };
  }

  if (range === 'week') {
    const nepalDateStr = getNepalDateString(now);
    const adNepalMidnight = new Date(`${nepalDateStr}T00:00:00+05:45`);
    const day = adNepalMidnight.getUTCDay(); // 0 (Sun) - 6 (Sat) in Nepal time
    const start = new Date(adNepalMidnight.getTime() - day * 86400000);
    const end = new Date(start.getTime() + 6 * 86400000);
    return { startAD: toAdDateString(start), endAD: toAdDateString(end) };
  }

  if (range === 'month') {
    const startAd = bsToAdDate(bs.year, bs.month, 1) ?? now;
    const nextMonth = bs.month === 12 ? { y: bs.year + 1, m: 1 } : { y: bs.year, m: bs.month + 1 };
    const nextStartAd = bsToAdDate(nextMonth.y, nextMonth.m, 1) ?? now;
    const endAd = new Date(nextStartAd.getTime() - 86400000);
    const startIso = toAdDateString(startAd);
    const endIso = toAdDateString(endAd);
    return startIso <= endIso
      ? { startAD: startIso, endAD: endIso }
      : { startAD: endIso, endAD: startIso };
  }

  // year
  const startAd = bsToAdDate(bs.year, 1, 1) ?? now;
  const nextYearStartAd = bsToAdDate(bs.year + 1, 1, 1) ?? now;
  const endAd = new Date(nextYearStartAd.getTime() - 86400000);
  const startIso = toAdDateString(startAd);
  const endIso = toAdDateString(endAd);
  return startIso <= endIso
    ? { startAD: startIso, endAD: endIso }
    : { startAD: endIso, endAD: startIso };
}

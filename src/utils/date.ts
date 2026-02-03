import NepaliDate from "nepali-date-converter";

const NEPAL_TZ = "Asia/Kathmandu";

function toDate(value?: string | Date): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00+05:45`);
  }
  return new Date(value);
}

function getNepalDateString(adDate: Date): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: NEPAL_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(adDate); // YYYY-MM-DD
}

function getNepalTimeString(adDate: Date): string {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: NEPAL_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return formatter.format(adDate);
}

export function formatNepaliDate(value?: string | Date): string {
  const d = toDate(value);
  if (!d || Number.isNaN(d.getTime())) return value ? String(value) : "—";
  const nepalDateStr = getNepalDateString(d);
  const nepalMidnight = new Date(`${nepalDateStr}T00:00:00+05:45`);
  const nep = new NepaliDate(nepalMidnight);
  return nep.format("YYYY-MM-DD");
}

export function formatNepaliDateTime(value?: string | Date): string {
  const d = toDate(value);
  if (!d || Number.isNaN(d.getTime())) return value ? String(value) : "—";
  const nepDate = formatNepaliDate(d);
  const time = getNepalTimeString(d);
  return `${nepDate} ${time}`;
}

function parseBsDate(bs: string): { year: number; month: number; day: number } | null {
  const m = bs.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

function bsToAdDate(bsYear: number, bsMonth: number, bsDay: number): Date | null {
  const resolveDate = (nep: any): Date | null => {
    return (
      nep?.getADDate?.() ||
      nep?.getAD?.() ||
      nep?.toJsDate?.() ||
      null
    );
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

export function getNepaliRange(range: "today" | "week" | "month" | "year"): {
  startAD: string;
  endAD: string;
} {
  const now = new Date();
  const nepToday = new NepaliDate(now);
  const bsTodayStr = (nepToday as any).format?.("YYYY-MM-DD") || formatNepaliDate(now);
  const bs = parseBsDate(bsTodayStr) ?? {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  };

  if (range === "today") {
    const adDate = bsToAdDate(bs.year, bs.month, bs.day) ?? now;
    const iso = toAdDateString(adDate);
    return { startAD: iso, endAD: iso };
  }

  if (range === "week") {
    const nepalDateStr = getNepalDateString(now);
    const adNepalMidnight = new Date(`${nepalDateStr}T00:00:00+05:45`);
    const day = adNepalMidnight.getUTCDay(); // 0 (Sun) - 6 (Sat) in Nepal time
    const start = new Date(adNepalMidnight.getTime() - day * 86400000);
    const end = new Date(start.getTime() + 6 * 86400000);
    return { startAD: toAdDateString(start), endAD: toAdDateString(end) };
  }

  if (range === "month") {
    const startAd = bsToAdDate(bs.year, bs.month, 1) ?? now;
    const nextMonth = bs.month === 12 ? { y: bs.year + 1, m: 1 } : { y: bs.year, m: bs.month + 1 };
    const nextStartAd = bsToAdDate(nextMonth.y, nextMonth.m, 1) ?? now;
    const endAd = new Date(nextStartAd.getTime() - 86400000);
    const startIso = toAdDateString(startAd);
    const endIso = toAdDateString(endAd);
    return startIso <= endIso ? { startAD: startIso, endAD: endIso } : { startAD: endIso, endAD: startIso };
  }

  // year
  const startAd = bsToAdDate(bs.year, 1, 1) ?? now;
  const nextYearStartAd = bsToAdDate(bs.year + 1, 1, 1) ?? now;
  const endAd = new Date(nextYearStartAd.getTime() - 86400000);
  const startIso = toAdDateString(startAd);
  const endIso = toAdDateString(endAd);
  return startIso <= endIso ? { startAD: startIso, endAD: endIso } : { startAD: endIso, endAD: startIso };
}

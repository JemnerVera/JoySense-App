// ISO 8601 week date functions

export interface IsoWeekDateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

function getIsoWeekDate(date: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { year: d.getUTCFullYear(), week: weekNum };
}

function dateFromIsoWeek(year: number, week: number): Date {
  const date = new Date(Date.UTC(year, 0, 1));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum + (week - 1) * 7);
  return date;
}

export function getIsoWeekDateRange(year: number, week: number): IsoWeekDateRange {
  const startOfWeek = dateFromIsoWeek(year, week);
  const dayNum = startOfWeek.getUTCDay() || 7;
  startOfWeek.setUTCDate(startOfWeek.getUTCDate() - (dayNum - 1));

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setUTCDate(endOfWeek.getUTCDate() + 6);

  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  return {
    startDate: formatDate(startOfWeek),
    endDate: formatDate(endOfWeek),
  };
}

export function getCurrentIsoWeek(): { year: number; week: number } {
  return getIsoWeekDate(new Date());
}

export function getAvailableYears(): number[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  return [currentYear - 2, currentYear - 1, currentYear].sort();
}

export function isWeekInFuture(year: number, week: number): boolean {
  const current = getCurrentIsoWeek();
  if (year > current.year) return true;
  if (year === current.year && week > current.week) return true;
  return false;
}

export function getWeeksInYear(year: number): number {
  const lastDay = new Date(Date.UTC(year, 11, 31));
  const { week } = getIsoWeekDate(lastDay);
  return week;
}

export function formatWeekRange(startDate: string, endDate: string): string {
  const start = new Date(startDate + 'T00:00:00Z');
  const end = new Date(endDate + 'T23:59:59Z');

  const formatPart = (d: Date) => {
    const day = d.getUTCDate().toString().padStart(2, '0');
    const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}`;
  };

  const startStr = formatPart(start);
  const endStr = formatPart(end);
  const endYear = end.getUTCFullYear();
  const currentYear = new Date().getFullYear();

  if (endYear === currentYear) {
    return `${startStr} – ${endStr}/${endYear}`;
  } else {
    return `${startStr}/${start.getUTCFullYear()} – ${endStr}/${endYear}`;
  }
}

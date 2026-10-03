/** İş günü hesapları — hafta sonu ve Türkiye resmi tatilleri hariç. Arife yarım günleri iş günü sayılır. */
export const TR_HOLIDAYS: string[] = [
  // 2026
  "2026-01-01", "2026-03-20", "2026-03-21", "2026-03-22", "2026-04-23", "2026-05-01", "2026-05-19",
  "2026-05-27", "2026-05-28", "2026-05-29", "2026-05-30", "2026-07-15", "2026-08-30", "2026-10-29",
  // 2027
  "2027-01-01", "2027-03-09", "2027-03-10", "2027-03-11", "2027-04-23", "2027-05-01",
  "2027-05-16", "2027-05-17", "2027-05-18", "2027-05-19", "2027-07-15", "2027-08-30", "2027-10-29",
];
const HOLIDAY_SET = new Set(TR_HOLIDAYS);

const toDate = (iso: string) => new Date(iso.slice(0, 10) + "T00:00:00Z");
const toISO = (d: Date) => d.toISOString().slice(0, 10);
const nextDay = (d: Date) => new Date(d.getTime() + 86400000);

export function isBusinessDay(dateISO: string) {
  const d = toDate(dateISO);
  const wd = d.getUTCDay();
  return wd !== 0 && wd !== 6 && !HOLIDAY_SET.has(toISO(d));
}

/** fromISO'dan sonraki n'inci iş günü. from iş günü değilse sayım bir sonraki iş gününden başlar. */
export function addBusinessDays(fromISO: string, n: number) {
  let d = toDate(fromISO);
  while (!isBusinessDay(toISO(d))) d = nextDay(d);
  let count = 0;
  while (count < n) {
    d = nextDay(d);
    if (isBusinessDay(toISO(d))) count++;
  }
  return toISO(d);
}

/** a'dan b'ye (a hariç, b dahil) iş günü sayısı; b < a ise negatif. */
export function businessDaysBetween(aISO: string, bISO: string) {
  const a = aISO.slice(0, 10), b = bISO.slice(0, 10);
  if (a === b) return 0;
  const [lo, hi, sign] = a < b ? [a, b, 1] : [b, a, -1];
  let d = toDate(lo), n = 0;
  const end = toDate(hi).getTime();
  while (d.getTime() < end) {
    d = nextDay(d);
    if (isBusinessDay(toISO(d))) n++;
  }
  return n * sign;
}

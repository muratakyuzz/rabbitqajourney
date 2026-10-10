/** İş günü hesapları — hafta sonu ve resmi tatiller hariç. Yarım gün (arife) iş günü sayılır. */
export interface HolidayDef { date: string; name: string; halfDay: boolean }

/** Yedek sabit liste; asıl liste state.holidays'te tutulur (Sistem ayarları > Uyarılar). */
export const TR_HOLIDAY_DEFS: HolidayDef[] = [
  { date: "2026-01-01", name: "Yılbaşı", halfDay: false },
  { date: "2026-03-19", name: "Ramazan Bayramı arifesi", halfDay: true },
  { date: "2026-03-20", name: "Ramazan Bayramı 1. gün", halfDay: false },
  { date: "2026-03-21", name: "Ramazan Bayramı 2. gün", halfDay: false },
  { date: "2026-03-22", name: "Ramazan Bayramı 3. gün", halfDay: false },
  { date: "2026-04-23", name: "Ulusal Egemenlik ve Çocuk Bayramı", halfDay: false },
  { date: "2026-05-01", name: "Emek ve Dayanışma Günü", halfDay: false },
  { date: "2026-05-19", name: "Atatürk'ü Anma, Gençlik ve Spor Bayramı", halfDay: false },
  { date: "2026-05-26", name: "Kurban Bayramı arifesi", halfDay: true },
  { date: "2026-05-27", name: "Kurban Bayramı 1. gün", halfDay: false },
  { date: "2026-05-28", name: "Kurban Bayramı 2. gün", halfDay: false },
  { date: "2026-05-29", name: "Kurban Bayramı 3. gün", halfDay: false },
  { date: "2026-05-30", name: "Kurban Bayramı 4. gün", halfDay: false },
  { date: "2026-07-15", name: "Demokrasi ve Milli Birlik Günü", halfDay: false },
  { date: "2026-08-30", name: "Zafer Bayramı", halfDay: false },
  { date: "2026-10-28", name: "Cumhuriyet Bayramı arifesi", halfDay: true },
  { date: "2026-10-29", name: "Cumhuriyet Bayramı", halfDay: false },
  { date: "2027-01-01", name: "Yılbaşı", halfDay: false },
  { date: "2027-03-08", name: "Ramazan Bayramı arifesi", halfDay: true },
  { date: "2027-03-09", name: "Ramazan Bayramı 1. gün", halfDay: false },
  { date: "2027-03-10", name: "Ramazan Bayramı 2. gün", halfDay: false },
  { date: "2027-03-11", name: "Ramazan Bayramı 3. gün", halfDay: false },
  { date: "2027-04-23", name: "Ulusal Egemenlik ve Çocuk Bayramı", halfDay: false },
  { date: "2027-05-01", name: "Emek ve Dayanışma Günü", halfDay: false },
  { date: "2027-05-15", name: "Kurban Bayramı arifesi", halfDay: true },
  { date: "2027-05-16", name: "Kurban Bayramı 1. gün", halfDay: false },
  { date: "2027-05-17", name: "Kurban Bayramı 2. gün", halfDay: false },
  { date: "2027-05-18", name: "Kurban Bayramı 3. gün", halfDay: false },
  { date: "2027-05-19", name: "Kurban Bayramı 4. gün", halfDay: false },
  { date: "2027-07-15", name: "Demokrasi ve Milli Birlik Günü", halfDay: false },
  { date: "2027-08-30", name: "Zafer Bayramı", halfDay: false },
  { date: "2027-10-28", name: "Cumhuriyet Bayramı arifesi", halfDay: true },
  { date: "2027-10-29", name: "Cumhuriyet Bayramı", halfDay: false },
];
export const TR_HOLIDAYS: string[] = TR_HOLIDAY_DEFS.filter((h) => !h.halfDay).map((h) => h.date);

/** Tatil listesinden iş günü olmayan tarihler (yarım günler hariç). */
export const holidayDates = (list: HolidayDef[] | undefined | null) => (list ? list.filter((h) => !h.halfDay).map((h) => h.date) : TR_HOLIDAYS);

let active: Set<string> = new Set(TR_HOLIDAYS);
/** Store, state.holidays değiştiğinde parametresiz çağrıların kullandığı listeyi günceller. */
export function setActiveHolidays(list: HolidayDef[] | undefined | null) { active = new Set(holidayDates(list)); }

const setOf = (h?: string[]) => (h ? new Set(h) : active);
const toDate = (iso: string) => new Date(iso.slice(0, 10) + "T00:00:00Z");
const toISO = (d: Date) => d.toISOString().slice(0, 10);
const nextDay = (d: Date) => new Date(d.getTime() + 86400000);

function isBD(iso: string, set: Set<string>) {
  const wd = toDate(iso).getUTCDay();
  return wd !== 0 && wd !== 6 && !set.has(iso.slice(0, 10));
}

export function isBusinessDay(dateISO: string, holidays?: string[]) {
  return isBD(dateISO, setOf(holidays));
}

/** fromISO'dan sonraki n'inci iş günü. from iş günü değilse sayım bir sonraki iş gününden başlar. */
export function addBusinessDays(fromISO: string, n: number, holidays?: string[]) {
  const set = setOf(holidays);
  let d = toDate(fromISO);
  while (!isBD(toISO(d), set)) d = nextDay(d);
  let count = 0;
  while (count < n) {
    d = nextDay(d);
    if (isBD(toISO(d), set)) count++;
  }
  return toISO(d);
}

/** a'dan b'ye (a hariç, b dahil) iş günü sayısı; b < a ise negatif. */
export function businessDaysBetween(aISO: string, bISO: string, holidays?: string[]) {
  const set = setOf(holidays);
  const a = aISO.slice(0, 10), b = bISO.slice(0, 10);
  if (a === b) return 0;
  const [lo, hi, sign] = a < b ? [a, b, 1] : [b, a, -1];
  let d = toDate(lo), n = 0;
  const end = toDate(hi).getTime();
  while (d.getTime() < end) {
    d = nextDay(d);
    if (isBD(toISO(d), set)) n++;
  }
  return n * sign;
}

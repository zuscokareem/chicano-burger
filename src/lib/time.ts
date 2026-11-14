import { BOOKING, HOURS, UTC_OFFSET_HOURS } from "./config";

const OFFSET_MS = UTC_OFFSET_HOURS * 3600_000;

/** Current local date/time in Puerto Vallarta as plain parts. */
export function nowLocal(now = Date.now()) {
  const d = new Date(now + OFFSET_MS);
  return {
    date: d.toISOString().slice(0, 10),
    minutes: d.getUTCHours() * 60 + d.getUTCMinutes(),
  };
}

/** Epoch ms for a local Puerto Vallarta date ("2026-11-20") and time ("19:30"). */
export function localToEpoch(date: string, time: string) {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return Date.UTC(y, m - 1, d, hh, mm) - OFFSET_MS;
}

export function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function fromMinutes(min: number) {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

export function weekday(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function addDays(date: string, days: number) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export function isValidDate(date: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date + "T00:00:00Z"));
}

/** All reservable times for a date, ignoring capacity. Past/too-soon slots removed for today. */
export function slotsFor(date: string, now = Date.now()): string[] {
  const hours = HOURS[weekday(date)];
  if (!hours) return [];
  const { date: today, minutes: nowMin } = nowLocal(now);
  if (date < today || date > addDays(today, BOOKING.daysAhead)) return [];
  const out: string[] = [];
  const last = toMinutes(BOOKING.lastSeating);
  for (let t = toMinutes(hours.open); t <= last; t += BOOKING.slotMinutes) {
    if (date === today && t < nowMin + BOOKING.minNoticeMinutes) continue;
    out.push(fromMinutes(t));
  }
  return out;
}

/** Open days from today forward (for the date picker). */
export function openDays(count: number, now = Date.now()) {
  const { date: today } = nowLocal(now);
  const days: string[] = [];
  for (let i = 0; i <= BOOKING.daysAhead && days.length < count; i++) {
    const d = addDays(today, i);
    if (slotsFor(d, now).length) days.push(d);
  }
  return days;
}

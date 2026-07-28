import type { RecurrenceFreq } from "./types";

const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Local-date ISO string (YYYY-MM-DD), avoiding UTC off-by-one. */
export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Parse a YYYY-MM-DD string as a local date. */
export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Short badge label, e.g. "Jun 29". */
export function formatBadge(iso: string): string {
  const d = parseISO(iso);
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
}

/** Today as a local YYYY-MM-DD string. */
export function todayISO(): string {
  return toISODate(new Date());
}

/** True when a due date has already passed (date-only comparison). */
export function isOverdue(dueISO?: string): boolean {
  return Boolean(dueISO) && dueISO! < todayISO();
}

/** Advance one recurrence step. Monthly keeps the anchor day-of-month (clamped). */
function stepDate(date: Date, freq: RecurrenceFreq, anchorDay: number): Date {
  if (freq === "daily") return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  if (freq === "weekly") return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 2, 0).getDate();
  return new Date(date.getFullYear(), date.getMonth() + 1, Math.min(anchorDay, lastDay));
}

/** Upper bound on steps needed to advance from anchorISO to toISO at the given frequency. */
function stepsRequired(anchorISO: string, toISO: string, freq: RecurrenceFreq): number {
  const diffDays = Math.max(
    0,
    Math.ceil((parseISO(toISO).getTime() - parseISO(anchorISO).getTime()) / 86_400_000),
  );
  if (freq === "daily") return diffDays + 1;
  if (freq === "weekly") return Math.ceil(diffDays / 7) + 1;
  return Math.ceil(diffDays / 28) + 1; // 28 = shortest possible month
}

/** All occurrence dates of a recurring task within [startISO, endISO], inclusive. */
export function occurrencesInRange(
  anchorISO: string,
  freq: RecurrenceFreq,
  startISO: string,
  endISO: string,
): string[] {
  const result: string[] = [];
  const anchorDay = parseISO(anchorISO).getDate();
  let occ = parseISO(anchorISO);
  const limit = stepsRequired(anchorISO, endISO, freq);
  for (let i = 0; i <= limit; i++) {
    const iso = toISODate(occ);
    if (iso > endISO) break;
    if (iso >= startISO) result.push(iso);
    occ = stepDate(occ, freq, anchorDay);
  }
  return result;
}

/** The first occurrence on or after fromISO (defaults to today). */
export function nextOccurrence(anchorISO: string, freq: RecurrenceFreq, fromISO = todayISO()): string {
  const anchorDay = parseISO(anchorISO).getDate();
  let occ = parseISO(anchorISO);
  const limit = stepsRequired(anchorISO, fromISO, freq);
  for (let i = 0; i <= limit && toISODate(occ) < fromISO; i++) {
    occ = stepDate(occ, freq, anchorDay);
  }
  return toISODate(occ);
}

function ordinal(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  const suffix = ["th", "st", "nd", "rd"][n % 10] ?? "th";
  return `${n}${suffix}`;
}

/** Human-readable cadence, e.g. "Monthly on the 10th", "Weekly on Tue", "Daily". */
export function describeRecurrence(freq: RecurrenceFreq, anchorISO: string): string {
  const d = parseISO(anchorISO);
  if (freq === "daily") return "Daily";
  if (freq === "weekly") return `Weekly on ${WEEKDAYS_SHORT[d.getDay()]}`;
  return `Monthly on the ${ordinal(d.getDate())}`;
}

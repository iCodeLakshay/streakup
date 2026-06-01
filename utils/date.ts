// utils/date.ts
// Local-timezone date helpers for StreakUp, built on date-fns.
// All string-based helpers use the 'YYYY-MM-DD' format and operate on the
// user's LOCAL calendar date. parseISO is used for string inputs so that
// 'YYYY-MM-DD' is interpreted in local time (avoiding the UTC parsing bug of
// `new Date('YYYY-MM-DD')`).

import {
  format,
  subDays,
  addDays,
  parseISO,
  differenceInCalendarDays,
  startOfWeek,
} from 'date-fns';

/** Today's local calendar date as 'YYYY-MM-DD'. */
export function getTodayDateString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/** Yesterday's local calendar date as 'YYYY-MM-DD'. */
export function getYesterdayDateString(): string {
  return format(subDays(new Date(), 1), 'yyyy-MM-dd');
}

/** Returns `from` ('YYYY-MM-DD') offset by `days`, as 'YYYY-MM-DD'. */
export function offsetDateStr(from: string, days: number): string {
  return format(addDays(parseISO(from), days), 'yyyy-MM-dd');
}

/** Calendar-day difference between two 'YYYY-MM-DD' strings (a - b). */
export function diffInDays(a: string, b: string): number {
  return differenceInCalendarDays(parseISO(a), parseISO(b));
}

/** Start of the week (Monday) for the given date. */
export function startOfWeekMonday(d: Date): Date {
  return startOfWeek(d, { weekStartsOn: 1 });
}

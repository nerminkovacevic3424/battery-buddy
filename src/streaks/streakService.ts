import { BuddyData } from '../buddy/types';
export function localDay(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function dayNumber(day: string): number {
  const [y, m, d] = day.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}
export function visit(streak: BuddyData['streak'], date: Date) {
  const today = localDay(date);
  // Clock rollback and revisiting a day cannot earn another reward.
  if (streak.lastActiveDate && today <= streak.lastActiveDate) return { streak, daily: false, weekly: false };
  const consecutive = streak.lastActiveDate && dayNumber(today) - dayNumber(streak.lastActiveDate) === 1;
  const current = consecutive ? streak.current + 1 : 1;
  return { streak: { lastActiveDate: today, current, longest: Math.max(streak.longest, current) }, daily: true, weekly: current % 7 === 0 };
}

import { BatteryFacts, BuddyData } from '../buddy/types';
export interface Achievement {
  id: string; title: string; description: string; reward: number;
  progress: (data: BuddyData, facts: BatteryFacts) => number;
  target: number;
}
export const achievements: Achievement[] = [
  { id: 'first_rescue', title: 'First Rescue', description: 'Plug in below 10%.', reward: 15, target: 1, progress: (_, f) => Number(f.firstRescue) },
  { id: 'seven_lives', title: 'Seven Lives', description: 'Visit for 7 consecutive days.', reward: 20, target: 7, progress: d => d.streak.longest },
  { id: 'guardian', title: 'Battery Guardian', description: 'Earn 10 early charging rewards.', reward: 40, target: 10, progress: (_, f) => f.careCount },
  { id: 'survivor', title: 'Survivor', description: 'Keep monitoring on and stay at 5% or above for 30 continuous days. Monitoring gaps restart progress.', reward: 100, target: 30, progress: (_, f) => f.survivor ? 30 : f.safeDays },
  { id: 'fashion', title: 'Fashion Buddy', description: 'Own 5 cosmetics (including your starter color).', reward: 25, target: 5, progress: d => d.owned.length },
];
export function evaluateAchievements(data: BuddyData, facts: BatteryFacts, date: Date): BuddyData {
  const next = { ...data, achievements: { ...data.achievements } };
  for (const definition of achievements) {
    if (!next.achievements[definition.id] && definition.progress(next, facts) >= definition.target) {
      next.achievements[definition.id] = date.toISOString();
      next.bolts += definition.reward;
    }
  }
  return next;
}

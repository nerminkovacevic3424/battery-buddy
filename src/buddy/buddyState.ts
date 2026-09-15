import { BuddyMood } from './types';
export function getBuddyMood(level: number, plugged: boolean): BuddyMood {
  if (plugged) return level >= 100 ? 'full' : 'charging';
  if (!Number.isFinite(level) || level < 0 || level > 100) return 'happy';
  if (level >= 80) return 'energetic';
  if (level >= 50) return 'happy';
  if (level >= 30) return 'concerned';
  if (level >= 15) return 'worried';
  if (level >= 5) return 'crying';
  return 'panic';
}
export const moodLabels: Record<BuddyMood, string> = {
  energetic: 'Full of energy', happy: 'Feeling good', concerned: 'Getting a little tired',
  worried: 'Could use a charger', crying: 'Running on fumes', panic: 'Rescue needed',
  charging: 'Recharging & relieved', full: 'Fully charged. Time to celebrate!',
};

import { BatteryFacts, BuddyData, BuddyProfile, personalities } from '../buddy/types';
import { catalog, isEquipped } from '../shop/catalog';
import { evaluateAchievements } from '../achievements/achievements';
import { visit } from '../streaks/streakService';
import { rewards, testingGrant } from './rewards';
import { customColorPrice, normalizeColor } from './customColor';
export const balanceResetId = 'owner-balance-reset-2026-09-15';
export type BuddyAction = { type: 'sync' } | { type: 'visit' } | { type: 'profile'; profile: BuddyProfile; customColor?: boolean }
  | { type: 'buy'; id: string } | { type: 'equip'; id: string } | { type: 'adCompleted'; receipt: string } | { type: 'claimTestingBonus' } | { type: 'resetTestingBalance' };
export function reduceBuddy(data: BuddyData, facts: BatteryFacts, action: BuddyAction, now: Date): BuddyData {
  let next = { ...data, profile: { ...data.profile }, owned: [...data.owned] };
  if (action.type === 'claimTestingBonus' && !next.claimedGrants.includes(testingGrant.id)) {
    next.bolts += testingGrant.amount;
    next.claimedGrants = [...next.claimedGrants, testingGrant.id];
  }
  if (facts.careCount > next.claimedCareCount) {
    next.bolts += (facts.careCount - next.claimedCareCount) * rewards.earlyCharge;
    next.claimedCareCount = facts.careCount;
  }
  if (action.type === 'visit') {
    const result = visit(next.streak, now); next.streak = result.streak;
    if (result.daily) next.bolts += rewards.daily;
    if (result.weekly) next.bolts += rewards.weekly;
  }
  if (action.type === 'profile') {
    const p = action.profile;
    if (!p.name.trim() || p.name.trim().length > 24) throw new Error('Give Buddy a name between 1 and 24 characters.');
    if (!personalities.includes(p.personality)) throw new Error('Choose a valid personality.');
    const color = normalizeColor(p.color);
    if (!color) throw new Error('Enter a six-digit hex color, such as #AB91CF.');
    const changed = color !== normalizeColor(next.profile.color);
    if (action.customColor && changed) {
      if (next.bolts < customColorPrice) throw new Error(`You need ${customColorPrice - next.bolts} more Bolts for this color.`);
      next.bolts -= customColorPrice;
      next.customColor = color;
      next.customColors = [...new Set([...next.customColors, color])];
    } else if (changed && !catalog.some(item => item.category === 'color' && item.color === color && next.owned.includes(item.id))) throw new Error('You do not own that color yet.');
    for (const category of ['hat', 'faceAccessory', 'clothing'] as const) {
      if (p[category] !== null && !catalog.some(item => item.category === category && item.id === p[category] && next.owned.includes(item.id))) throw new Error('You do not own that cosmetic yet.');
    }
    next.profile = { ...p, color, name: p.name.trim() };
  }
  if (action.type === 'buy' || action.type === 'equip') {
    const item = catalog.find(item => item.id === action.id);
    if (!item) throw new Error('That item is not available.');
    if (action.type === 'buy') {
      if (!next.owned.includes(item.id)) {
        if (next.bolts < item.price) throw new Error(`You need ${item.price - next.bolts} more Bolts.`);
        next.bolts -= item.price; next.owned.push(item.id);
      }
    } else {
      if (!next.owned.includes(item.id)) throw new Error('Buy this item before equipping it.');
      if (item.category === 'color') next.profile.color = item.color!;
      else next.profile[item.category] = isEquipped(next.profile, item) ? null : item.id;
    }
  }
  if (action.type === 'adCompleted' && !next.adReceipts.includes(action.receipt)) {
    if (!action.receipt) throw new Error('A completed ad receipt is required.');
    next.bolts += rewards.rewardedAd; next.adReceipts = [...next.adReceipts, action.receipt];
  }
  next = evaluateAchievements(next, facts, now);
  if (action.type === 'resetTestingBalance' && !next.claimedGrants.includes(balanceResetId)) {
    next.bolts = 0;
    next.claimedGrants = [...new Set([...next.claimedGrants, balanceResetId, testingGrant.id])];
  }
  return next;
}

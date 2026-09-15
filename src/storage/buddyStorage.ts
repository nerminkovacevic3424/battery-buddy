import { BatteryFacts, BuddyData, defaultProfile, personalities } from '../buddy/types';
import { catalog, starterItems } from '../shop/catalog';
import { normalizeColor } from '../economy/customColor';
export const emptyFacts: BatteryFacts = { careCount: 0, firstRescue: false, safeDays: 0, survivor: false };
const count = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : 0;
export function parseFacts(raw: string): BatteryFacts {
  const f = JSON.parse(raw);
  return { careCount: count(f.careCount), firstRescue: f.firstRescue === true, safeDays: count(f.safeDays), survivor: f.survivor === true };
}
export function hydrateBuddy(raw: string | null): BuddyData {
  const value = raw ? JSON.parse(raw) : {};
  if (value.version && value.version !== 1) throw new Error('This Buddy save needs a newer app version. Your saved data has been kept.');
  const owned = [...new Set<string>([...starterItems, ...(Array.isArray(value.owned) ? value.owned.filter((id: unknown) => catalog.some(item => item.id === id)) : [])])];
  const p = value.profile || {};
  const equipped = (category: 'hat' | 'faceAccessory' | 'clothing') => catalog.find(item => item.category === category && item.id === p[category] && owned.includes(item.id))?.id ?? null;
  const customColor = normalizeColor(value.customColor);
  const customColors = [...new Set<string>([...(Array.isArray(value.customColors) ? value.customColors.map(normalizeColor).filter((color: string | null): color is string => color !== null) : []), ...(customColor ? [customColor] : [])])];
  const color = (customColor && normalizeColor(p.color) === customColor ? customColor : null) ?? catalog.find(item => item.category === 'color' && item.color === p.color && owned.includes(item.id))?.color ?? defaultProfile.color;
  const dates = value.achievements && typeof value.achievements === 'object' ? value.achievements : {};
  return {
    version: 1, profile: { name: typeof p.name === 'string' && p.name.trim() ? p.name.trim().slice(0, 24) : 'Buddy',
      color, hat: equipped('hat'), faceAccessory: equipped('faceAccessory'), clothing: equipped('clothing'),
      personality: personalities.includes(p.personality) ? p.personality : defaultProfile.personality },
    bolts: count(value.bolts), owned, customColor, customColors,
    streak: { lastActiveDate: /^\d{4}-\d{2}-\d{2}$/.test(value.streak?.lastActiveDate) ? value.streak.lastActiveDate : null,
      current: count(value.streak?.current), longest: count(value.streak?.longest) },
    achievements: Object.fromEntries(Object.entries(dates).filter((entry): entry is [string, string] => typeof entry[1] === 'string' && Number.isFinite(Date.parse(entry[1])))),
    claimedCareCount: count(value.claimedCareCount), adReceipts: Array.isArray(value.adReceipts) ? [...new Set<string>(value.adReceipts.filter((id: unknown) => typeof id === 'string'))] : [],
    claimedGrants: Array.isArray(value.claimedGrants) ? [...new Set<string>(value.claimedGrants.filter((id: unknown) => typeof id === 'string'))] : [],
  };
}

export const personalities = ['cute', 'dramatic', 'angry', 'sarcastic', 'chill'] as const;
export type Personality = typeof personalities[number];
export type BuddyMood = 'energetic' | 'happy' | 'concerned' | 'worried' | 'crying' | 'panic' | 'charging' | 'full';
export interface BuddyProfile {
  name: string;
  color: string;
  hat: string | null;
  faceAccessory: string | null;
  clothing: string | null;
  personality: Personality;
}
export const defaultProfile: BuddyProfile = {
  name: 'Buddy', color: '#AB91CF', hat: null, faceAccessory: null, clothing: null, personality: 'cute',
};
export interface BatteryFacts {
  careCount: number;
  firstRescue: boolean;
  safeDays: number;
  survivor: boolean;
}
export interface BuddyData {
  version: 1;
  profile: BuddyProfile;
  bolts: number;
  customColor: string | null;
  customColors: string[];
  owned: string[];
  streak: { lastActiveDate: string | null; current: number; longest: number };
  achievements: Record<string, string>;
  claimedCareCount: number;
  adReceipts: string[];
  claimedGrants: string[];
}
export interface BuddyEnvelope { revision: number; state: string | null; facts: string }

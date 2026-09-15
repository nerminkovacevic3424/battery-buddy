import { rewards } from '../economy/rewards';
export interface RewardedAdProvider {
  available: boolean;
  // An installed SDK adapter must call onEarned ONLY from its earned-reward event.
  show(callbacks: { onEarned: () => void }): Promise<void>;
}
export const unavailableAds: RewardedAdProvider = { available: false, show: async () => { throw new Error('Rewarded ads are not configured yet.'); } };
export function createRewardedAds(provider: RewardedAdProvider, credit: (receipt: string) => Promise<void>) {
  let showing = false;
  return {
    available: provider.available, amount: rewards.rewardedAd,
    async watch() {
      if (!provider.available) throw new Error('Rewarded ads are not available yet.');
      if (showing) return;
      showing = true;
      let earned = false;
      let active = true;
      let creditError: unknown;
      let award: Promise<void> | undefined;
      const receipt = `ad-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      try {
        await provider.show({ onEarned: () => { if (active && !earned) { earned = true; award = credit(receipt).catch(error => { creditError = error; }); } } });
        await award;
        if (creditError) throw creditError;
      } finally { active = false; await award; showing = false; }
    },
  };
}

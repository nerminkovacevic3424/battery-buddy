import { getBuddyMood } from '../src/buddy/buddyState';
import { buddyMessages, chooseMessage } from '../src/buddy/buddyMessages';
import { personalities } from '../src/buddy/types';
import { hydrateBuddy, emptyFacts } from '../src/storage/buddyStorage';
import { reduceBuddy, balanceResetId } from '../src/economy/buddyReducer';
import { createBuddyRepository, BuddyStoragePort } from '../src/storage/buddyRepository';
import { createRewardedAds, unavailableAds } from '../src/ads/rewardedAds';
import { visit } from '../src/streaks/streakService';
const now = new Date(2026, 8, 14, 12);
const initial = () => hydrateBuddy(null);

test('requested reset clears Bolts once across concurrent clients and preserves inventory and colors', async () => {
  const storage = memoryStore(10000);
  const a = createBuddyRepository(storage, () => now), b = createBuddyRepository(storage, () => now);
  await a.dispatch({ type: 'buy', id: 'hat_baseball' });
  await a.dispatch({ type: 'profile', profile: { ...initial().profile, color: '#123ABC' }, customColor: true });
  await a.dispatch({ type: 'visit' });
  await Promise.all([a.dispatch({ type: 'resetTestingBalance' }), b.dispatch({ type: 'resetTestingBalance' })]);
  let saved = hydrateBuddy((await storage.readBuddy()).state);
  expect(saved.bolts).toBe(0);
  expect(saved.owned).toContain('hat_baseball');
  expect(saved.customColors).toEqual(['#123ABC']);
  expect(saved.profile.color).toBe('#123ABC');
  expect(saved.claimedGrants).toContain(balanceResetId);
  await a.dispatch({ type: 'claimTestingBonus' });
  expect(hydrateBuddy((await storage.readBuddy()).state).bolts).toBe(0);
  await a.dispatch({ type: 'adCompleted', receipt: 'after-reset' });
  const restarted = createBuddyRepository(storage, () => now);
  await restarted.dispatch({ type: 'resetTestingBalance' });
  saved = hydrateBuddy((await storage.readBuddy()).state);
  expect(saved.bolts).toBe(25);
});

test('previous custom color migrates into a deduplicated saved palette', () => {
  const old = { ...initial(), customColor: '#123abc', customColors: undefined, profile: { ...initial().profile, color: '#123abc' } };
  expect(hydrateBuddy(JSON.stringify(old)).customColors).toEqual(['#123ABC']);
  expect(hydrateBuddy(JSON.stringify({ ...old, customColors: ['#123ABC', '#654321', 'invalid'] })).customColors).toEqual(['#123ABC', '#654321']);
});

test('custom colors cost 30 per saved change and persist without charging for other edits', () => {
  let data = { ...initial(), bolts: 100 };
  data = reduceBuddy(data, emptyFacts, { type: 'profile', profile: { ...data.profile, color: '#123abc' }, customColor: true }, now);
  expect(data.bolts).toBe(70);
  data = hydrateBuddy(JSON.stringify(data));
  expect(data.profile.color).toBe('#123ABC');
  data = reduceBuddy(data, emptyFacts, { type: 'profile', profile: { ...data.profile, name: 'Bobby' } }, now);
  expect(data.bolts).toBe(70);
  data = reduceBuddy(data, emptyFacts, { type: 'profile', profile: { ...data.profile, color: '#654321' }, customColor: true }, now);
  expect(data.bolts).toBe(40);
  data = reduceBuddy(data, emptyFacts, { type: 'profile', profile: { ...data.profile, color: '#123ABC' }, customColor: true }, now);
  expect(data.bolts).toBe(10);
  expect(hydrateBuddy(JSON.stringify(data)).customColors).toEqual(['#123ABC', '#654321']);
  expect(() => reduceBuddy(data, emptyFacts, { type: 'profile', profile: { ...data.profile, color: '#000000' }, customColor: true }, now)).toThrow(/20 more/);
  expect(data.profile.color).toBe('#123ABC');
  expect(data.bolts).toBe(10);
});

test('invalid and unpaid custom colors are rejected without spending', () => {
  const data = { ...initial(), bolts: 100 };
  expect(() => reduceBuddy(data, emptyFacts, { type: 'profile', profile: { ...data.profile, color: 'red' }, customColor: true }, now)).toThrow(/hex/);
  expect(() => reduceBuddy(data, emptyFacts, { type: 'profile', profile: { ...data.profile, color: '#123ABC' } }, now)).toThrow(/own/);
  expect(data.bolts).toBe(100);
});

test('concurrent saves of the same custom color charge only once', async () => {
  const storage = memoryStore(100);
  const a = createBuddyRepository(storage, () => now), b = createBuddyRepository(storage, () => now);
  const action = { type: 'profile' as const, profile: { ...initial().profile, color: '#123ABC' }, customColor: true };
  await Promise.all([a.dispatch(action), b.dispatch(action)]);
  const result = hydrateBuddy((await storage.readBuddy()).state);
  expect(result.bolts).toBe(70);
  expect(result.profile.color).toBe('#123ABC');
});

test.each([[100, 'energetic'], [80, 'energetic'], [79, 'happy'], [50, 'happy'], [49, 'concerned'], [30, 'concerned'], [29, 'worried'], [15, 'worried'], [14, 'crying'], [5, 'crying'], [4, 'panic'], [0, 'panic'], [-1, 'happy']] as const)('mood at %i is %s', (level, mood) => {
  expect(getBuddyMood(level, false)).toBe(mood);
});
test('power overrides all low battery moods and full celebrates', () => {
  for (let level = 0; level < 100; level++) expect(getBuddyMood(level, true)).toBe('charging');
  expect(getBuddyMood(100, true)).toBe('full');
  expect(getBuddyMood(NaN, false)).toBe('happy');
});
test('every personality and mood has nonrepeating offline choices', () => {
  for (const personality of personalities) for (const choices of Object.values(buddyMessages[personality])) {
    expect(new Set(choices).size).toBeGreaterThanOrEqual(2);
    expect(chooseMessage(choices, choices[0], () => 0)).not.toBe(choices[0]);
  }
});
test('old users get defaults without receiving unearned currency or items', () => {
  const data = hydrateBuddy('{}');
  expect(data.profile.name).toBe('Buddy'); expect(data.profile.personality).toBe('cute');
  expect(data.bolts).toBe(0); expect(data.owned).toEqual(['color_lavender']);
  expect(hydrateBuddy(JSON.stringify({ profile: { hat: 'hat_crown', color: '#000000' } })).profile).toEqual(data.profile);
  expect(() => hydrateBuddy('{broken')).toThrow();
  expect(() => hydrateBuddy('{"version":2}')).toThrow(/newer app/);
});
test('daily reward is once per calendar date, even with repeated refreshes', () => {
  const first = reduceBuddy(initial(), emptyFacts, { type: 'visit' }, now);
  expect(first.bolts).toBe(5);
  expect(reduceBuddy(first, emptyFacts, { type: 'visit' }, now)).toEqual(first);
  expect(reduceBuddy(first, emptyFacts, { type: 'visit' }, new Date(2026, 8, 13))).toEqual(first);
});
test('7-day bonuses recur once at 7 and 14; achievement is awarded once', () => {
  let data = initial();
  for (let day = 1; day <= 14; day++) data = reduceBuddy(data, emptyFacts, { type: 'visit' }, new Date(2026, 8, day, 12));
  expect(data.streak).toEqual({ current: 14, longest: 14, lastActiveDate: '2026-09-14' });
  expect(data.bolts).toBe(14 * 5 + 2 * 30 + 20);
  expect(Object.keys(data.achievements)).toEqual(['seven_lives']);
  const missed = reduceBuddy(data, emptyFacts, { type: 'visit' }, new Date(2026, 8, 16));
  expect(missed.streak.current).toBe(1); expect(missed.streak.longest).toBe(14);
});
test('calendar streak survives month/year boundaries and DST', () => {
  expect(visit({ lastActiveDate: '2026-12-31', current: 3, longest: 3 }, new Date(2027, 0, 1)).streak.current).toBe(4);
  expect(visit({ lastActiveDate: '2026-03-28', current: 3, longest: 3 }, new Date(2026, 2, 29)).streak.current).toBe(4);
});
test('background care facts are credited once and achievements stay unlocked', () => {
  const facts = { ...emptyFacts, careCount: 10, firstRescue: true };
  const data = reduceBuddy(initial(), facts, { type: 'sync' }, now);
  expect(data.bolts).toBe(30 + 15 + 40);
  expect(reduceBuddy(data, facts, { type: 'sync' }, now)).toEqual(data);
  expect(reduceBuddy(data, emptyFacts, { type: 'sync' }, now).bolts).toBe(data.bolts);
});
test('survivor needs 30 monitored days and pays only once', () => {
  const before = reduceBuddy(initial(), { ...emptyFacts, safeDays: 29 }, { type: 'sync' }, now);
  expect(before.achievements.survivor).toBeUndefined();
  const after = reduceBuddy(before, { ...emptyFacts, safeDays: 30, survivor: true }, { type: 'sync' }, now);
  expect(after.bolts).toBe(100);
  expect(reduceBuddy(after, emptyFacts, { type: 'sync' }, now).achievements.survivor).toBeTruthy();
});
test('purchase, equip, name, and personality survive a saved-data round trip', () => {
  let data = { ...initial(), bolts: 100 };
  data = reduceBuddy(data, emptyFacts, { type: 'buy', id: 'hat_beanie' }, now);
  data = reduceBuddy(data, emptyFacts, { type: 'equip', id: 'hat_beanie' }, now);
  data = reduceBuddy(data, emptyFacts, { type: 'profile', profile: { ...data.profile, name: 'Bobby', personality: 'chill' } }, now);
  const restored = hydrateBuddy(JSON.stringify(data));
  expect(restored).toEqual(data); expect(restored.bolts).toBe(50);
  expect(restored.profile.hat).toBe('hat_beanie');
  expect(reduceBuddy(restored, emptyFacts, { type: 'buy', id: 'hat_beanie' }, now).bolts).toBe(50);
  expect(reduceBuddy(restored, emptyFacts, { type: 'equip', id: 'hat_beanie' }, now).profile.hat).toBeNull();
});
test('invalid or unaffordable cosmetics never change the input balance', () => {
  const data = initial();
  expect(() => reduceBuddy(data, emptyFacts, { type: 'buy', id: 'hat_crown' }, now)).toThrow(/more Bolts/);
  expect(() => reduceBuddy(data, emptyFacts, { type: 'equip', id: 'hat_crown' }, now)).toThrow(/Buy/);
  expect(() => reduceBuddy(data, emptyFacts, { type: 'profile', profile: { ...data.profile, hat: 'hat_crown' } }, now)).toThrow(/do not own/);
  expect(data.bolts).toBe(0);
});
test('fashion counts unique owned cosmetics and awards once', () => {
  let data = { ...initial(), bolts: 1000 };
  for (const id of ['color_mint', 'color_sky', 'hat_crown', 'face_round']) data = reduceBuddy(data, emptyFacts, { type: 'buy', id }, now);
  expect(data.achievements.fashion).toBeTruthy();
  expect(reduceBuddy(data, emptyFacts, { type: 'buy', id: 'face_round' }, now)).toEqual(data);
});
function memoryStore(balance = 0) {
  let revision = 0, state = JSON.stringify({ ...initial(), bolts: balance });
  const port: BuddyStoragePort = {
    readBuddy: async () => ({ revision, state, facts: JSON.stringify(emptyFacts) }),
    commitBuddy: async (expected, value) => { if (expected !== revision) return false; state = value; revision++; return true; },
  };
  return port;
}
test('concurrent clients cannot double-pay daily rewards or double-spend', async () => {
  const storage = memoryStore(100);
  const a = createBuddyRepository(storage, () => now), b = createBuddyRepository(storage, () => now);
  await Promise.all([a.dispatch({ type: 'visit' }), b.dispatch({ type: 'visit' }), a.dispatch({ type: 'buy', id: 'hat_baseball' }), b.dispatch({ type: 'buy', id: 'hat_baseball' })]);
  const saved = hydrateBuddy((await storage.readBuddy()).state);
  expect(saved.bolts).toBe(30); expect(saved.owned.filter(id => id === 'hat_baseball')).toHaveLength(1);
});
test('failed saves do not poison the next queued transaction', async () => {
  const storage = memoryStore(); const original = storage.commitBuddy;
  storage.commitBuddy = jest.fn().mockRejectedValueOnce(new Error('Disk full')).mockImplementation(original);
  const repository = createBuddyRepository(storage, () => now);
  await expect(repository.dispatch({ type: 'visit' })).rejects.toThrow('Disk full');
  expect((await repository.dispatch({ type: 'visit' })).data.bolts).toBe(5);
});
test('opening or dismissing an ad never grants currency; duplicate callbacks grant once', async () => {
  const credit = jest.fn().mockResolvedValue(undefined);
  await createRewardedAds({ available: true, show: async () => {} }, credit).watch();
  expect(credit).not.toHaveBeenCalled();
  await createRewardedAds({ available: true, show: async ({ onEarned }) => { onEarned(); onEarned(); } }, credit).watch();
  expect(credit).toHaveBeenCalledTimes(1);
  await expect(createRewardedAds(unavailableAds, credit).watch()).rejects.toThrow(/not available/);
});
test('replayed ad receipts cannot award twice, including after restart', () => {
  let data = reduceBuddy(initial(), emptyFacts, { type: 'adCompleted', receipt: 'one' }, now);
  data = reduceBuddy(data, emptyFacts, { type: 'adCompleted', receipt: 'two' }, now);
  data = hydrateBuddy(JSON.stringify(data));
  expect(reduceBuddy(data, emptyFacts, { type: 'adCompleted', receipt: 'one' }, now).bolts).toBe(50);
});
test('the requested 10000 Bolt gift adds to the balance once and persists after spending', async () => {
  const storage = memoryStore(240);
  const a = createBuddyRepository(storage, () => now), b = createBuddyRepository(storage, () => now);
  await Promise.all([a.dispatch({ type: 'claimTestingBonus' }), b.dispatch({ type: 'claimTestingBonus' })]);
  expect(hydrateBuddy((await storage.readBuddy()).state).bolts).toBe(10240);
  await a.dispatch({ type: 'buy', id: 'hat_crown' });
  const restarted = createBuddyRepository(storage, () => now);
  const result = await restarted.dispatch({ type: 'claimTestingBonus' });
  expect(result.data.bolts).toBe(10090);
  expect(result.data.owned).toContain('hat_crown');
  expect(result.data.claimedGrants).toHaveLength(1);
});

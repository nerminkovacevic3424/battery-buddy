import { useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { alarm } from '../native';
import { BuddyData } from './types';
import { createBuddyRepository } from '../storage/buddyRepository';
import { emptyFacts } from '../storage/buddyStorage';
import { BuddyAction } from '../economy/buddyReducer';
import { createRewardedAds, unavailableAds } from '../ads/rewardedAds';

const repository = alarm && typeof alarm.readBuddy === 'function' ? createBuddyRepository(alarm) : null;
export function useBuddy(revision?: number) {
  const [data, setData] = useState<BuddyData | null>(null);
  const [facts, setFacts] = useState(emptyFacts);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(0);
  const mounted = useRef(true);
  async function dispatch(action: BuddyAction) {
    if (!repository) { setError('Install the updated Android build to enable your battery pet.'); return; }
    setPending(n => n + 1); setError(null);
    try {
      const result = await repository.dispatch(action);
      if (mounted.current) { setData(result.data); setFacts(result.facts); }
    } catch (e) { if (mounted.current) setError(e instanceof Error ? e.message : String(e)); throw e; }
    finally { if (mounted.current) setPending(n => n - 1); }
  }
  const send = (action: BuddyAction) => { void dispatch(action).catch(() => {}); };
  useEffect(() => {
    mounted.current = true;
    send({ type: 'visit' });
    send({ type: 'resetTestingBalance' });
    const sub = AppState.addEventListener('change', next => { if (next === 'active') send({ type: 'visit' }); });
    return () => { mounted.current = false; sub.remove(); };
  }, []);
  useEffect(() => { if (repository) send({ type: 'sync' }); }, [revision]);
  const ads = useMemo(() => createRewardedAds(unavailableAds, async receipt => { await dispatch({ type: 'adCompleted', receipt }); }), []);
  return { data, facts, error, busy: pending > 0, send, dispatch, ads };
}

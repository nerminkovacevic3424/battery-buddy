import { BuddyData, BatteryFacts, BuddyEnvelope } from '../buddy/types';
import { BuddyAction, reduceBuddy } from '../economy/buddyReducer';
import { hydrateBuddy, parseFacts } from './buddyStorage';
export interface BuddyStoragePort {
  readBuddy(): Promise<BuddyEnvelope>;
  commitBuddy(revision: number, state: string): Promise<boolean>;
}
export function createBuddyRepository(storage: BuddyStoragePort, clock = () => new Date()) {
  let queue: Promise<unknown> = Promise.resolve();
  function dispatch(action: BuddyAction): Promise<{ data: BuddyData; facts: BatteryFacts }> {
    const now = clock();
    const task = queue.then(async () => {
      for (let retry = 0; retry < 12; retry++) {
        const envelope = await storage.readBuddy();
        const data = hydrateBuddy(envelope.state), facts = parseFacts(envelope.facts);
        const next = reduceBuddy(data, facts, action, now);
        const serialized = JSON.stringify(next);
        if (serialized === envelope.state || await storage.commitBuddy(envelope.revision, serialized)) return { data: next, facts };
      }
      throw new Error('Buddy is busy updating. Please try again.');
    });
    queue = task.catch(() => {});
    return task;
  }
  return { dispatch };
}

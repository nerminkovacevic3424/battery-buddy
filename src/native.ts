import { requireOptionalNativeModule, NativeModule } from 'expo';
import { BuddyEnvelope } from './buddy/types';
export type Sound = 'cry' | 'robot' | 'chime' | 'custom';
export type AlarmState = {
  level: number; plugged: boolean; enabled: boolean; running: boolean;
  ringing: boolean; threshold: number; sound: Sound; customName: string | null; error: string | null; buddyRevision?: number; chargingSound?: boolean;
};
declare class BatteryAlarmModule extends NativeModule<{ onChange: (state: AlarmState) => void }> {
  getState(): Promise<AlarmState>;
  readBuddy(): Promise<BuddyEnvelope>;
  commitBuddy(revision: number, state: string): Promise<boolean>;
  setEnabled(value: boolean): Promise<void>;
  setChargingSound(value: boolean): Promise<void>;
  configure(threshold: number, sound: Sound): Promise<void>;
  preview(sound: Sound): Promise<void>;
  stopPreview(): Promise<void>;
  importSound(uri: string, name: string): Promise<string>;
}
export const alarm = requireOptionalNativeModule<BatteryAlarmModule>('BatteryAlarm');

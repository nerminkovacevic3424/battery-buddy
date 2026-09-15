import React from 'react';
import { StyleSheet } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import App from '../App';
import { alarm, AlarmState } from '../src/native';
import * as DocumentPicker from 'expo-document-picker';
import { balanceResetId } from '../src/economy/buddyReducer';
import { hydrateBuddy } from '../src/storage/buddyStorage';

jest.mock('../src/native', () => ({ alarm: {
  getState: jest.fn(), addListener: jest.fn(), setEnabled: jest.fn(), configure: jest.fn(),
  preview: jest.fn(), stopPreview: jest.fn(), importSound: jest.fn(), readBuddy: jest.fn(), commitBuddy: jest.fn(), setChargingSound: jest.fn(),
} }));
jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn() }));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('@react-native-community/slider', () => {
  const { View } = require('react-native');
  return (props: any) => <View {...props} />;
});

let state: AlarmState;
let receive: (value: AlarmState) => void;
let saved: string | null;
let revision: number;
beforeEach(() => {
  saved = JSON.stringify({ ...hydrateBuddy(null), bolts: 10000, claimedGrants: [balanceResetId] }); revision = 0;
  (alarm!.readBuddy as jest.Mock).mockImplementation(async () => ({ revision, state: saved, facts: '{}' }));
  (alarm!.commitBuddy as jest.Mock).mockImplementation(async (expected, json) => { if (expected !== revision) return false; saved = json; revision++; return true; });
  state = { level: 48, plugged: false, enabled: false, running: false, ringing: false,
    threshold: 20, sound: 'cry', customName: null, error: null };
  (alarm!.getState as jest.Mock).mockImplementation(async () => state);
  (alarm!.addListener as jest.Mock).mockImplementation((_, listener) => { receive = listener; return { remove: jest.fn() }; });
  (alarm!.stopPreview as jest.Mock).mockResolvedValue(undefined);
  (alarm!.setEnabled as jest.Mock).mockImplementation(async (enabled) => { state = { ...state, enabled, running: enabled }; });
  (alarm!.configure as jest.Mock).mockImplementation(async (threshold, sound) => { state = { ...state, threshold, sound }; });
  (alarm!.setChargingSound as jest.Mock).mockImplementation(async chargingSound => { state = { ...state, chargingSound }; });
});
test('loads persisted threshold and sound', async () => {
  state = { ...state, threshold: 30, sound: 'robot' };
  render(<App />);
  await waitFor(() => expect(screen.getByRole('radio', { name: /Sad robot/ }).props.accessibilityState.checked).toBe(true));
  expect(screen.getByLabelText('Low battery percentage').props.value).toBe(30);
});

test('first launch resets balance once and removes the old automatic gift', async () => {
  saved = JSON.stringify({ ...hydrateBuddy(null), bolts: 5432 });
  const first = render(<App />);
  await screen.findByText('ϟ 0 Bolts');
  expect(hydrateBuddy(saved).claimedGrants).toContain(balanceResetId);
  first.unmount(); render(<App />);
  await screen.findByText('ϟ 0 Bolts');
});
test('enabling monitoring starts the native service', async () => {
  render(<App />);
  await waitFor(() => expect(screen.getByLabelText('Enable low battery monitoring').props.disabled).toBe(false));
  fireEvent(screen.getByLabelText('Enable low battery monitoring'), 'valueChange', true);
  await waitFor(() => expect(alarm!.setEnabled).toHaveBeenCalledWith(true));
  await screen.findByText('LOOKING OUT FOR YOU');
});
test('threshold changes preserve the selected sound', async () => {
  state.sound = 'robot'; render(<App />);
  await waitFor(() => expect(screen.getByLabelText('Set threshold to 15 percent').props.accessibilityState.disabled).toBe(false));
  fireEvent.press(screen.getByLabelText('Set threshold to 15 percent'));
  await waitFor(() => expect(alarm!.configure).toHaveBeenCalledWith(15, 'robot'));
});
test('native power event immediately replaces the crying UI', async () => {
  state = { ...state, level: 10, enabled: true, running: true, ringing: true }; render(<App />);
  await screen.findByText('Running on fumes');
  expect(screen.getByTestId('buddy-face-crying')).toBeTruthy();
  act(() => receive({ ...state, plugged: true, ringing: false }));
  expect(screen.getByTestId('buddy-face-charging')).toBeTruthy();
  expect(screen.queryByTestId('buddy-face-crying')).toBeNull();
  expect(screen.getByText('Recharging & relieved')).toBeTruthy();
  expect(screen.queryByText('Running on fumes')).toBeNull();
});
test('owned accessories have inventory artwork and can be selected and saved', async () => {
  saved = JSON.stringify({ ...hydrateBuddy(null), bolts: 10000, claimedGrants: [balanceResetId], owned: ['color_lavender', 'hat_crown', 'face_round', 'clothing_hoodie'] });
  render(<App />);
  await waitFor(() => expect(screen.getByText('ϟ 10005 Bolts')).toBeTruthy());
  fireEvent.press(screen.getByText('Customize'));
  for (const id of ['hat_crown', 'face_round', 'clothing_hoodie']) {
    expect(screen.getByTestId(`cosmetic-preview-${id}`)).toBeTruthy();
  }
  expect(screen.queryByTestId('cosmetic-preview-hat_baseball')).toBeNull();
  fireEvent.press(screen.getByRole('radio', { name: 'Crown' }));
  fireEvent.press(screen.getByRole('radio', { name: 'Hoodie' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Save Buddy' })).toBeEnabled());
  await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Save Buddy' })); });
  await waitFor(() => expect(hydrateBuddy(saved).profile.hat).toBe('hat_crown'));
  expect(hydrateBuddy(saved).profile.clothing).toBe('clothing_hoodie');
});

test('battery changes select every expression without reopening the app', async () => {
  render(<App />);
  await screen.findByTestId('buddy-face-concerned');
  const readings = [[90, false, 'energetic'], [60, false, 'happy'], [40, false, 'concerned'], [20, false, 'worried'], [8, false, 'crying'], [3, false, 'panic'], [3, true, 'charging'], [100, true, 'full']] as const;
  for (const [level, plugged, mood] of readings) {
    act(() => receive({ ...state, level, plugged }));
    expect(screen.getByTestId(`buddy-face-${mood}`)).toBeTruthy();
  }
});

test('personality choices show faces and custom color charges only on save', async () => {
  render(<App />);
  await screen.findByText('ϟ 10005 Bolts');
  fireEvent.press(screen.getByText('Customize'));
  expect(screen.getByTestId('personality-angry-face-concerned')).toBeTruthy();
  expect(screen.queryByText('angry')).toBeNull();
  fireEvent.changeText(screen.getByLabelText('Custom hex color'), '#123abc');
  expect(hydrateBuddy(saved).bolts).toBe(10005);
  fireEvent.press(screen.getByRole('button', { name: 'Close' }));
  expect(hydrateBuddy(saved).profile.color).toBe('#AB91CF');
  fireEvent.press(screen.getByText('Customize'));
  fireEvent.changeText(screen.getByLabelText('Custom hex color'), '#123abc');
  await waitFor(() => expect(screen.getByRole('button', { name: 'Save Buddy' })).toBeEnabled());
  await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Save Buddy' })); });
  await waitFor(() => expect(hydrateBuddy(saved).profile.color).toBe('#123ABC'));
  expect(hydrateBuddy(saved).bolts).toBe(9975);
  await waitFor(() => expect(screen.queryByLabelText('Buddy name')).toBeNull());
  fireEvent.press(screen.getByText('Customize'));
  expect(screen.getByRole('radio', { name: 'Saved color #123ABC' })).toBeTruthy();
  fireEvent.changeText(screen.getByLabelText('Custom hex color'), '#654321');
  await waitFor(() => expect(screen.getByRole('button', { name: 'Save Buddy' })).toBeEnabled());
  await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Save Buddy' })); });
  await waitFor(() => expect(screen.queryByLabelText('Buddy name')).toBeNull());
  fireEvent.press(screen.getByText('Customize'));
  fireEvent.press(screen.getByRole('radio', { name: 'Saved color #123ABC' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Save Buddy' })).toBeEnabled());
  await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Save Buddy' })); });
  await waitFor(() => expect(hydrateBuddy(saved).profile.color).toBe('#123ABC'));
  expect(hydrateBuddy(saved).bolts).toBe(9915);
  expect(hydrateBuddy(saved).customColors).toEqual(['#123ABC', '#654321']);
});

test('canceling a sound import preserves settings', async () => {
  (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({ canceled: true });
  render(<App />);
  await waitFor(() => expect(screen.getByLabelText('Enable low battery monitoring').props.disabled).toBe(false));
  fireEvent.press(screen.getByText('＋  Bring your own sound'));
  await waitFor(() => expect(DocumentPicker.getDocumentAsync).toHaveBeenCalled());
  expect(alarm!.importSound).not.toHaveBeenCalled(); expect(alarm!.configure).not.toHaveBeenCalled();
});
test('service failure is surfaced to the user', async () => {
  (alarm!.setEnabled as jest.Mock).mockRejectedValueOnce(new Error('Service could not start'));
  render(<App />);
  await waitFor(() => expect(screen.getByLabelText('Enable low battery monitoring').props.disabled).toBe(false));
  fireEvent(screen.getByLabelText('Enable low battery monitoring'), 'valueChange', true);
  await screen.findByText('Service could not start');
});
test('customization saves name and personality and survives remount', async () => {
  const first = render(<App />);
  await screen.findByText('ϟ 10005 Bolts');
  fireEvent.press(screen.getByText('Customize'));
  fireEvent.changeText(screen.getByLabelText('Buddy name'), 'Bobby');
  fireEvent.press(screen.getByLabelText('sarcastic personality'));
  const previewMouth = screen.getAllByTestId('buddy-mouth').slice(-1)[0];
  expect(StyleSheet.flatten(previewMouth.props.style).transform).toEqual([{ rotate: '-12deg' }]);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Save Buddy' })).toBeEnabled());
  await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Save Buddy' })); });
  await waitFor(() => expect(hydrateBuddy(saved).profile.name).toBe('Bobby'));
  expect(hydrateBuddy(saved).profile.personality).toBe('sarcastic');
  await waitFor(() => expect(screen.queryByLabelText('Buddy name')).toBeNull());
  first.unmount(); render(<App />);
  await screen.findByText('Bobby');
  expect(StyleSheet.flatten(screen.getByTestId('buddy-mouth').props.style).transform).toEqual([{ rotate: '-12deg' }]);
});
test('shop purchase and equip persist without touching alarm configuration', async () => {
  saved = JSON.stringify({ ...hydrateBuddy(null), bolts: 100, claimedGrants: [balanceResetId] });
  render(<App />);
  await waitFor(() => expect(screen.getByText('ϟ 105 Bolts')).toBeTruthy());
  fireEvent.press(screen.getByText('Buddy Shop'));
  fireEvent.press(screen.getByText('Buy · 75'));
  await waitFor(() => expect(hydrateBuddy(saved).owned).toContain('hat_baseball'));
  fireEvent.press(screen.getByText('Equip'));
  await waitFor(() => expect(hydrateBuddy(saved).profile.hat).toBe('hat_baseball'));
  expect(hydrateBuddy(saved).bolts).toBe(30);
  expect(alarm!.configure).not.toHaveBeenCalled();
});
test('canceling live customization leaves the saved profile untouched', async () => {
  render(<App />);
  await screen.findByText('ϟ 10005 Bolts');
  fireEvent.press(screen.getByText('Customize'));
  fireEvent.changeText(screen.getByLabelText('Buddy name'), 'Unsaved name');
  fireEvent.press(screen.getByRole('button', { name: 'Close' }));
  expect(hydrateBuddy(saved).profile.name).toBe('Buddy');
});
test('custom voice import still selects the file with the existing alarm threshold', async () => {
  state.threshold = 30;
  (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///cache/voice.mp3', name: 'My voice.mp3', size: 500 }] });
  (alarm!.importSound as jest.Mock).mockImplementation(async () => { state = { ...state, customName: 'My voice.mp3' }; return 'My voice.mp3'; });
  render(<App />);
  await waitFor(() => expect(screen.getByLabelText('Enable low battery monitoring').props.disabled).toBe(false));
  fireEvent.press(screen.getByText('＋  Bring your own sound'));
  await waitFor(() => expect(alarm!.configure).toHaveBeenCalledWith(30, 'custom'));
  await screen.findByText('My voice.mp3');
});
test('shop top icon tabs filter the cosmetic grid', async () => {
  render(<App />);
  await screen.findByText('ϟ 10005 Bolts');
  fireEvent.press(screen.getByLabelText('Buddy Shop'));
  expect(screen.getByText('Baseball cap')).toBeTruthy();
  fireEvent.press(screen.getByLabelText('Face category'));
  expect(screen.getByText('Round glasses')).toBeTruthy();
  expect(screen.queryByText('Baseball cap')).toBeNull();
  expect(screen.getByLabelText('Face category').props.accessibilityState.selected).toBe(true);
});
test('charging chime can be switched off without changing the alarm threshold', async () => {
  render(<App />);
  await waitFor(() => expect(screen.getByLabelText('Charging connection sound').props.disabled).toBe(false));
  fireEvent(screen.getByLabelText('Charging connection sound'), 'valueChange', false);
  await waitFor(() => expect(alarm!.setChargingSound).toHaveBeenCalledWith(false));
  expect(alarm!.configure).not.toHaveBeenCalled();
});




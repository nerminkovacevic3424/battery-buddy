import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BuddyScreen } from './BuddyCard';
const shortcuts = [
  { icon: '✎', label: 'Customize', screen: 'customize' },
  { icon: '♜', label: 'Buddy Shop', screen: 'shop' },
  { icon: '★', label: 'Achievements', screen: 'achievements' },
  { icon: '♫', label: 'Buddy’s Voice', section: 'sounds' },
  { icon: '⚙', label: 'Alarm Settings', section: 'alarm' },
] as const;
export function BuddyToolbar({ ready, open, jump }: { ready: boolean; open: (screen: BuddyScreen) => void; jump: (section: 'sounds' | 'alarm') => void }) {
  return <View style={a.row}>{shortcuts.map(shortcut => <Pressable key={shortcut.label} accessibilityRole="button" accessibilityLabel={shortcut.label} disabled={'screen' in shortcut && !ready} onPress={() => 'screen' in shortcut ? open(shortcut.screen) : jump(shortcut.section)} style={[a.button, 'screen' in shortcut && !ready && { opacity: 0.4 }]}><View style={a.icon}><Text style={a.glyph}>{shortcut.icon}</Text></View><Text style={a.label}>{shortcut.label}</Text></Pressable>)}</View>;
}
const a = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, marginBottom: 20 }, button: { flex: 1, alignItems: 'center', minHeight: 70 },
  icon: { width: 43, height: 43, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: '#EEE8F6' },
  glyph: { fontSize: 24, color: '#80649F' }, label: { color: '#786986', fontSize: 9, fontWeight: '700', textAlign: 'center', marginTop: 6 },
});

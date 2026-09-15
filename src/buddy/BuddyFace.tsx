import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { BuddyMood, Personality } from './types';
const ink = '#43344F';
// Mouths and eyebrows remain expressive even with sunglasses equipped.
const faces: Record<BuddyMood, { eye: ViewStyle; mouth: ViewStyle; brow?: number }> = {
  energetic: { eye: { width: 11, height: 15 }, mouth: { width: 30, height: 17, backgroundColor: ink, borderBottomLeftRadius: 18, borderBottomRightRadius: 18 } },
  happy: { eye: {}, mouth: { width: 24, height: 12, borderBottomWidth: 3, borderLeftWidth: 2, borderRightWidth: 2, borderBottomLeftRadius: 18, borderBottomRightRadius: 18 } },
  concerned: { eye: { height: 4, top: 42 }, mouth: { width: 19, height: 3, backgroundColor: ink, transform: [{ rotate: '-9deg' }] }, brow: -8 },
  worried: { eye: { width: 8, height: 12 }, mouth: { width: 25, height: 11, borderTopWidth: 3, borderLeftWidth: 2, borderRightWidth: 2, borderTopLeftRadius: 18, borderTopRightRadius: 18 }, brow: -24 },
  crying: { eye: { height: 5, width: 15, top: 41 }, mouth: { width: 25, height: 14, backgroundColor: ink, borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 }, brow: -30 },
  panic: { eye: { width: 16, height: 19, top: 33, borderWidth: 4, borderColor: ink, backgroundColor: '#FFF8F1' }, mouth: { width: 16, height: 20, top: 58, backgroundColor: ink, borderRadius: 12 }, brow: -35 },
  charging: { eye: { width: 16, height: 9, top: 39, backgroundColor: 'transparent', borderBottomWidth: 3, borderColor: ink, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }, mouth: { width: 25, height: 10, borderBottomWidth: 3, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 } },
  full: { eye: { width: 17, height: 11, top: 36, backgroundColor: 'transparent', borderTopWidth: 3, borderColor: ink, borderTopLeftRadius: 12, borderTopRightRadius: 12 }, mouth: { width: 33, height: 19, top: 58, backgroundColor: ink, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 } },
};
// Personality modifies the battery expression instead of replacing its mood.
const characters: Record<Personality, { eye: ViewStyle; mouth: ViewStyle; cheek: ViewStyle; brow: [number, number]; browStyle?: ViewStyle; sparkle?: boolean }> = {
  cute: { eye: { transform: [{ scale: 1.08 }] }, mouth: {}, cheek: { opacity: 1 }, brow: [-12, 12], sparkle: true },
  dramatic: { eye: { transform: [{ scaleY: 1.3 }] }, mouth: { transform: [{ scaleX: 1.15 }] }, cheek: { opacity: 0.6 }, brow: [-28, 28], browStyle: { top: 22, height: 4 } },
  angry: { eye: { transform: [{ scaleY: 0.75 }] }, mouth: { transform: [{ scaleX: 0.8 }] }, cheek: { backgroundColor: '#E68D95' }, brow: [25, -25], browStyle: { height: 5 } },
  sarcastic: { eye: { transform: [{ scaleY: 0.65 }] }, mouth: { transform: [{ rotate: '-12deg' }] }, cheek: { opacity: 0.3 }, brow: [-25, 4] },
  chill: { eye: { transform: [{ scaleY: 0.45 }] }, mouth: { transform: [{ scaleX: 0.8 }, { scaleY: 0.75 }] }, cheek: { opacity: 0.45 }, brow: [0, 0], browStyle: { height: 2 } },
};
export function BuddyFace({ mood, personality, testPrefix = 'buddy' }: { mood: BuddyMood; personality: Personality; testPrefix?: string }) {
  const face = faces[mood];
  const character = characters[personality];
  const tears = mood === 'crying' || mood === 'panic';
  const relieved = mood === 'charging' || mood === 'full';
  return <View testID={`${testPrefix}-face-${mood}`} pointerEvents="none" style={StyleSheet.absoluteFill}>
    <View style={[a.cheek, { left: 13 }, character.cheek]} /><View style={[a.cheek, { right: 13 }, character.cheek]} />
    {(['left', 'right'] as const).map(side => <React.Fragment key={side}>
      <View testID={`${testPrefix}-brow-${side}`} style={[a.brow, character.browStyle, { [side]: 19, transform: [{ rotate: `${character.brow[side === 'left' ? 0 : 1] * (relieved ? 0.5 : 1) + (face.brow ?? 0) * (side === 'left' ? 0.25 : -0.25)}deg` }] }]} />
      <View testID={`${testPrefix}-eye-${side}`} style={[a.eye, { [side]: 23 }, face.eye, character.eye, personality === 'sarcastic' && side === 'left' && { transform: [{ scaleY: 1.1 }], marginTop: -2 }]}>
        {character.sparkle && !['concerned', 'crying', 'charging', 'full'].includes(mood) && <View style={a.glint} />}
      </View>
      {tears && <View style={[a.tear, { [side]: 21, height: mood === 'panic' ? 27 : 20 }]} />}
    </React.Fragment>)}
    <View testID={`${testPrefix}-mouth`} style={[a.mouth, face.mouth, character.mouth]}>{(mood === 'energetic' || mood === 'full') && <View style={a.tongue} />}</View>
  </View>;
}
const a = StyleSheet.create({
  glint: { position: 'absolute', top: 2, left: 2, width: 3, height: 3, borderRadius: 2, backgroundColor: '#FFFFFF' },
  eye: { position: 'absolute', top: 36, width: 9, height: 12, borderRadius: 9, backgroundColor: ink },
  brow: { position: 'absolute', top: 25, width: 19, height: 3, borderRadius: 3, backgroundColor: ink },
  mouth: { position: 'absolute', top: 61, alignSelf: 'center', borderColor: ink, overflow: 'hidden' },
  cheek: { position: 'absolute', top: 52, width: 15, height: 8, borderRadius: 8, backgroundColor: '#E4ABC0' },
  tear: { position: 'absolute', top: 48, width: 8, borderRadius: 6, backgroundColor: '#9BDEFA', borderWidth: 1, borderColor: '#D1F1FF' },
  tongue: { position: 'absolute', width: 18, height: 8, borderRadius: 8, backgroundColor: '#E7A6B9', bottom: -2, alignSelf: 'center' },
});

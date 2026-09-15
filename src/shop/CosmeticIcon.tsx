import React from 'react';
import { View } from 'react-native';
import { Cosmetic } from './catalog';
import { defaultProfile } from '../buddy/types';
import { CosmeticLayers } from '../buddy/CosmeticLayers';
export function CosmeticIcon({ item }: { item: Cosmetic }) {
  if (item.category === 'color') return <View accessible={false} style={{ width: 104, height: 88, alignItems: 'center', justifyContent: 'center' }}><View style={{ width: 55, height: 55, backgroundColor: item.color, borderRadius: 28, borderWidth: 5, borderColor: '#FFFFFF' }} /></View>;
  const profile = { ...defaultProfile, [item.category]: item.id };
  return <View testID={`cosmetic-preview-${item.id}`} accessible={false} pointerEvents="none" style={{ width: 104, height: 88 }}><View style={{ position: 'absolute', width: 94, height: 106, left: 5, transform: [{ scale: 0.78 }], top: item.category === 'hat' ? 31 : item.category === 'clothing' ? -39 : -1 }}><CosmeticLayers profile={profile} layer={item.category === 'hat' ? 'head' : item.category === 'clothing' ? 'outfit' : 'face'} /></View></View>;
}

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BuddyProfile } from './types';
import { catalog } from '../shop/catalog';

// Placeholder artwork uses existing RN Views. All geometry lives here for easy replacement.
export function CosmeticLayers({ profile, layer }: { profile: BuddyProfile; layer: 'head' | 'face' | 'outfit' }) {
  const id = layer === 'head' ? profile.hat : layer === 'face' ? profile.faceAccessory : profile.clothing;
  const asset = catalog.find(item => item.id === id)?.asset;
  if (!asset) return null;
  if (layer === 'head') return <View pointerEvents="none" style={a.head}>
    {asset === 'crown' ? <View style={a.crown}>{[0, 1, 2].map(i => <View key={i} style={[a.crownPoint, { left: i * 33, top: i === 1 ? -18 : -12 }]} />)}<View style={a.crownBand} /><View style={a.jewel} /></View> : <>
      <View style={[a.hatTop, { backgroundColor: asset === 'beanie' ? '#DB9E8A' : asset === 'cowboy' ? '#B88B59' : '#729BC2' }]} />
      <View style={[a.brim, asset === 'cap' && { width: 82, left: 26 }, asset === 'beanie' && { width: 100, left: 0 }, { backgroundColor: asset === 'beanie' ? '#BA796B' : asset === 'cowboy' ? '#906641' : '#50769D' }]} />
      {asset === 'beanie' && <View style={a.pom} />}
    </>}
  </View>;
  if (layer === 'face') return <View pointerEvents="none" style={a.glasses}>
    <View style={[a.lens, asset === 'sunglasses' && a.dark]} /><View style={a.bridge} /><View style={[a.lens, asset === 'sunglasses' && a.dark]} />
  </View>;
  return <View pointerEvents="none" style={[a.outfit, { backgroundColor: asset === 'suit' ? '#465267' : asset === 'hoodie' ? '#77998C' : '#D3BBDD' }]}>
    <Text style={a.detail}>{asset === 'suit' ? '◆' : asset === 'hoodie' ? '│  │' : '· ✧ ·'}</Text>
  </View>;
}
const a = StyleSheet.create({
  head: { position: 'absolute', top: -24, left: -3, width: 100, height: 42, zIndex: 5 },
  hatTop: { width: 100, height: 35, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  brim: { position: 'absolute', bottom: 0, left: -12, width: 124, height: 9, borderRadius: 5 },
  crown: { position: 'absolute', left: 0, bottom: 0, width: 100, height: 24, backgroundColor: '#E7B743', borderBottomLeftRadius: 5, borderBottomRightRadius: 5 },
  crownPoint: { position: 'absolute', width: 0, height: 0, borderLeftWidth: 17, borderRightWidth: 17, borderBottomWidth: 23, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#E7B743' },
  crownBand: { position: 'absolute', bottom: 3, left: 0, right: 0, height: 5, backgroundColor: '#C9952D' },
  jewel: { position: 'absolute', left: 45, top: 3, width: 10, height: 10, borderRadius: 3, backgroundColor: '#8E72B2', transform: [{ rotate: '45deg' }] },
  pom: { position: 'absolute', top: -10, left: 41, width: 18, height: 18, borderRadius: 9, backgroundColor: '#E5B39F' },
  glasses: { position: 'absolute', top: 30, left: 13, flexDirection: 'row', alignItems: 'center', zIndex: 4 },
  lens: { width: 28, height: 28, borderRadius: 15, borderWidth: 2, borderColor: '#443B50' },
  bridge: { width: 12, height: 2, backgroundColor: '#443B50' }, dark: { backgroundColor: '#413E56', borderRadius: 7 },
  outfit: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 28, borderBottomLeftRadius: 22, borderBottomRightRadius: 22 },
  detail: { color: '#FAF8F5', fontSize: 15, textAlign: 'center' },
});

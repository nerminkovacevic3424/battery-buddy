import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { s } from '../styles';
import { BuddyMood, BuddyProfile } from './types';
import { CosmeticLayers } from './CosmeticLayers';
import { BuddyFace } from './BuddyFace';
export function BuddyAvatar({ profile, mood }: { profile: BuddyProfile; mood: BuddyMood }) {
  const tears = mood === 'crying' || mood === 'panic';
  return <View accessible accessibilityLabel={`${profile.name}, ${mood}`} style={s.buddySpace}>
    <View style={[s.batteryTip, { backgroundColor: profile.color }]} />
    <View style={[s.buddy, { backgroundColor: profile.color }, mood === 'panic' && a.panic]}>
      <CosmeticLayers profile={profile} layer="outfit" />
      <BuddyFace mood={mood} personality={profile.personality} />
      <CosmeticLayers profile={profile} layer="face" /><CosmeticLayers profile={profile} layer="head" />
    </View>
    <View style={s.shadow} /><View style={s.spark}><Text style={s.sparkText}>{mood === 'full' ? '✦' : mood === 'charging' ? 'ϟ' : mood === 'energetic' ? '✧' : tears ? '!' : '♡'}</Text></View>
  </View>;
}
const a = StyleSheet.create({
  panic: { transform: [{ rotate: '5deg' }] },
});

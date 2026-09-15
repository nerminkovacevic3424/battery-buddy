import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { AlarmState } from '../native';
import { BuddyData, defaultProfile } from './types';
import { getBuddyMood, moodLabels } from './buddyState';
import { buddyMessages, chooseMessage, reactions } from './buddyMessages';
import { BuddyAvatar } from './BuddyAvatar';
import { s } from '../styles';
import { p } from './petStyles';
export type BuddyScreen = 'customize' | 'shop' | 'achievements';
export function BuddyCard({ state, data }: {
  state: AlarmState | null; data: BuddyData | null;
}) {
  const profile = data?.profile ?? defaultProfile;
  const mood = getBuddyMood(state?.level ?? -1, !!state?.plugged);
  const [message, setMessage] = useState(() => chooseMessage(buddyMessages[profile.personality][mood]));
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => { setMessage(previous => chooseMessage(buddyMessages[profile.personality][mood], previous)); }, [profile.personality, mood]);
  function tap() {
    scale.stopAnimation(); scale.setValue(1);
    Animated.sequence([Animated.timing(scale, { toValue: 1.07, duration: 110, useNativeDriver: true }), Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true })]).start();
    setMessage(previous => chooseMessage(reactions[profile.personality], previous));
  }
  return <View style={s.hero}>
    <View style={s.pill}><View style={[s.dot, { backgroundColor: state?.enabled && state.running ? '#5B8F64' : '#96909D' }]} /><Text style={s.pillText}>{state?.enabled && state.running ? 'LOOKING OUT FOR YOU' : 'READY WHEN YOU ARE'}</Text></View>
    <Pressable accessibilityRole="button" accessibilityLabel={`Say hello to ${profile.name}`} onPress={tap}><Animated.View style={{ transform: [{ scale }] }}><BuddyAvatar profile={profile} mood={mood} /></Animated.View></Pressable>
    <Text style={s.heroTitle}>{profile.name}</Text>
    <Text style={[s.heroCaption, { minHeight: 42 }]} accessibilityLiveRegion="polite">{message}</Text>
    {state?.ringing && <Text style={p.badge}>Plug in your charger to stop the voice.</Text>}
    <View style={s.batteryReadout}><Text style={s.percent}>{state && state.level >= 0 ? state.level : '—'}<Text style={s.percentSymbol}>%</Text></Text><View style={s.readoutDivider} /><Text style={[s.readoutTitle, { flexShrink: 1 }]}>{state && state.level >= 0 ? moodLabels[mood] : 'Waiting for battery reading'}</Text></View>
    <View style={p.stats}><Text style={p.stat}>🔥 {data?.streak.current ?? 0} day streak</Text><Text style={p.stat}>ϟ {data?.bolts ?? 0} Bolts</Text></View>
  </View>;
}

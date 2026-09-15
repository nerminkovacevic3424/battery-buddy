import React, { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { normalizeColor } from '../economy/customColor';
import { s } from '../styles';
import { p } from './petStyles';

export function CustomColorPicker({ color, change }: { color: string; change: (color: string) => void }) {
  const [hex, setHex] = useState(color);
  useEffect(() => { setHex(color); }, [color]);
  const channels = [1, 3, 5].map(start => parseInt(color.slice(start, start + 2), 16));
  return <View style={p.item}>
    <Text style={p.itemTitle}>Custom color · 30 Bolts</Text>
    <Text style={s.note}>Pick any color. Charged only when you save a different custom color.</Text>
    {['Red', 'Green', 'Blue'].map((label, index) => <View key={label}>
      <Text style={s.note}>{label}</Text>
      <Slider accessibilityLabel={`${label} color channel`} minimumValue={0} maximumValue={255} step={1} value={channels[index]} minimumTrackTintColor={['#D77F87', '#79A890', '#819FD0'][index]} style={{ height: 40 }} onValueChange={value => {
        const next = '#' + channels.map((channel, i) => Math.round(i === index ? value : channel).toString(16).padStart(2, '0')).join('').toUpperCase();
        setHex(next); change(next);
      }} />
    </View>)}
    <TextInput accessibilityLabel="Custom hex color" autoCapitalize="characters" autoCorrect={false} maxLength={7} value={hex} onChangeText={value => { setHex(value); const valid = normalizeColor(value); if (valid) change(valid); }} style={[p.input, { marginBottom: 4 }]} />
    {!normalizeColor(hex) && <Text style={s.note}>Use # followed by six hex digits. Preview keeps the last valid color.</Text>}
  </View>;
}

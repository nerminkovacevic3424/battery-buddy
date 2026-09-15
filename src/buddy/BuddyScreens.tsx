import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { s } from '../styles';
import { p } from './petStyles';
import { BuddyFace } from './BuddyFace';
import { CustomColorPicker } from './CustomColorPicker';
import { customColorPrice } from '../economy/customColor';
import { BuddyAvatar } from './BuddyAvatar';
import { BuddyScreen } from './BuddyCard';
import { BuddyMood, BuddyProfile, personalities } from './types';
import { useBuddy } from './useBuddy';
import { catalog, categories, Category, isEquipped } from '../shop/catalog';
import { CosmeticIcon } from '../shop/CosmeticIcon';
import { achievements } from '../achievements/achievements';
import { buddyMessages } from './buddyMessages';
type Pet = ReturnType<typeof useBuddy>;
function Button({ label, onPress, disabled = false, primary = false }: { label: string; onPress: () => void; disabled?: boolean; primary?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={[p.button, primary && p.primary, disabled && p.disabled]}><Text style={[p.buttonText, primary && p.primaryText]}>{label}</Text></Pressable>;
}
function Customize({ pet, mood, close }: { pet: Pet; mood: BuddyMood; close: () => void }) {
  const [draft, setDraft] = useState<BuddyProfile>({ ...pet.data!.profile });
  const [customColor, setCustomColor] = useState(false);
  const colorCost = customColor && draft.color !== pet.data!.profile.color ? customColorPrice : 0;
  const [saving, setSaving] = useState(false);
  async function save() {
    if (saving) return;
    setSaving(true);
    try { await pet.dispatch({ type: 'profile', profile: draft, customColor }); close(); }
    catch { /* Shared error is shown in the modal. Draft remains available. */ }
    finally { setSaving(false); }
  }
  return <>
    <View style={p.shopHeader}>
      <View style={p.modalHeader}>
        <Text style={p.title}>Make Buddy yours</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginLeft: 8 }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Save Buddy" accessibilityHint="Save your changes and close customization" accessibilityState={{ disabled: saving || pet.busy || !draft.name.trim() || pet.data!.bolts < colorCost, busy: saving }} disabled={saving || pet.busy || !draft.name.trim() || pet.data!.bolts < colorCost} onPress={() => void save()} style={[p.headerIcon, p.primary, (saving || pet.busy || !draft.name.trim() || pet.data!.bolts < colorCost) && p.disabled]}>
            {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={[p.headerGlyph, p.primaryText]}>✓</Text>}
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" accessibilityHint="Discard unsaved changes" accessibilityState={{ disabled: saving }} disabled={saving} onPress={close} style={[p.headerIcon, saving && p.disabled]}><Text style={p.headerGlyph}>×</Text></Pressable>
        </View>
      </View>
      <View testID="customize-pinned-preview" style={p.pinnedPreview}>
        <View style={p.compactAvatar}><View style={{ transform: [{ scale: 0.8 }] }}><BuddyAvatar profile={draft} mood={mood} /></View></View>
        <View style={{ flex: 1, paddingRight: 12 }}><Text numberOfLines={2} style={[s.heroTitle, { fontSize: 19 }]}>{draft.name || 'Buddy'}</Text><Text numberOfLines={3} style={s.heroCaption}>{buddyMessages[draft.personality][mood][0]}</Text><Text style={[s.note, { textAlign: 'center', marginTop: 6, fontSize: 10 }]}>{colorCost ? `Save color · ${colorCost} Bolts` : 'Live preview · ✓ to save'}</Text></View>
      </View>
    </View>
    <ScrollView testID="customize-options" style={{ flex: 1 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={[p.modalContent, { paddingTop: 8 }]}>
    {pet.error && <View style={[s.notice, { marginBottom: 15 }]} accessibilityRole="alert"><Text style={s.note}>{pet.error}</Text></View>}
    <Text style={s.sectionTitle}>NAME</Text><TextInput accessibilityLabel="Buddy name" value={draft.name} maxLength={24} onChangeText={name => setDraft({ ...draft, name })} style={p.input} placeholder="Buddy" placeholderTextColor="#8C8393" />
    {categories.map(category => <View key={category.id}>
      <Text style={[s.sectionTitle, { marginBottom: 10 }]}>{category.title.toUpperCase()}</Text>
      <View style={p.shopGrid}>
        {category.id !== 'color' && <Pressable accessibilityRole="radio" accessibilityLabel={`No ${category.title.toLowerCase()} accessory`} accessibilityState={{ checked: draft[category.id] === null }} onPress={() => setDraft({ ...draft, [category.id]: null })} style={[p.shopTile, { alignItems: 'center', justifyContent: 'center', minHeight: 140 }, draft[category.id] === null && p.selected]}><Text style={{ fontSize: 30, color: '#A99AB8', marginBottom: 12 }}>∅</Text><Text style={p.buttonText}>None</Text></Pressable>}
        {catalog.filter(item => item.category === category.id && pet.data!.owned.includes(item.id)).map(item => <Pressable key={item.id} accessibilityRole="radio" accessibilityLabel={item.name} accessibilityState={{ checked: isEquipped(draft, item) }} onPress={() => { if (item.category === 'color') setCustomColor(false); setDraft({ ...draft, [item.category]: item.category === 'color' ? item.color! : item.id }); }} style={[p.shopTile, { alignItems: 'center' }, isEquipped(draft, item) && p.selected]}><CosmeticIcon item={item} /><Text style={[p.buttonText, { textAlign: 'center' }]}>{item.name}</Text>{isEquipped(draft, item) && <Text style={[p.badge, { marginTop: 5 }]}>Selected</Text>}</Pressable>)}
      </View>
      {category.id === 'color' && pet.data!.customColors.length > 0 && <>
        <Text style={[s.sectionTitle, { marginBottom: 10 }]}>SAVED CUSTOM COLORS</Text>
        <View style={p.faceGrid}>{pet.data!.customColors.map(color => <Pressable key={color} accessibilityRole="radio" accessibilityLabel={`Saved color ${color}`} accessibilityState={{ checked: draft.color === color }} onPress={() => { setCustomColor(true); setDraft({ ...draft, color }); }} style={[p.faceOption, draft.color === color && p.selected]}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: color, borderWidth: 2, borderColor: '#E4DCEB', marginBottom: 6 }} />
          <Text style={[p.buttonText, { fontSize: 10 }]}>{color}</Text><Text style={[s.note, { fontSize: 10 }]}>{pet.data!.profile.color === color ? 'Current' : '30 Bolts'}</Text>
        </Pressable>)}</View>
      </>}
      {category.id === 'color' && <CustomColorPicker color={draft.color} change={color => { setCustomColor(true); setDraft({ ...draft, color }); }} />}
      {category.id === 'color' && <Text style={[s.note, { marginBottom: 18 }]}>Balance: {pet.data!.bolts} Bolts{pet.data!.bolts < colorCost ? ` · Need ${colorCost - pet.data!.bolts} more to save` : ''}</Text>}
    </View>)}
    <Text style={[s.note, { marginBottom: 20 }]}>Find more colors and accessories in the Buddy Shop. Purchased items appear here.</Text>
    <Text style={[s.sectionTitle, { marginBottom: 10 }]}>PERSONALITY</Text><View style={p.faceGrid}>{personalities.map(personality => <Pressable key={personality} accessibilityRole="radio" accessibilityLabel={`${personality} personality`} accessibilityState={{ checked: draft.personality === personality }} onPress={() => setDraft({ ...draft, personality })} style={[p.faceOption, draft.personality === personality && p.selected]}><View style={p.smallFace}><View style={{ width: 94, height: 94, borderRadius: 24, backgroundColor: draft.color, transform: [{ scale: 0.66 }] }}><BuddyFace mood={mood} personality={personality} testPrefix={`personality-${personality}`} /></View></View><Text style={[p.badge, { height: 16 }]}>{draft.personality === personality ? '✓' : ''}</Text></Pressable>)}</View>
    </ScrollView>
  </>;
}
const categoryIcons: Record<Category, string> = { color: '◉', hat: '♛', faceAccessory: '◉‿◉', clothing: '♜' };
function ShopTabs({ category, select }: { category: Category; select: (category: Category) => void }) {
  return <View style={p.shopTabs}>{categories.map(item => <Pressable key={item.id} accessibilityRole="tab" accessibilityLabel={`${item.title} category`} accessibilityState={{ selected: category === item.id }} onPress={() => select(item.id)} style={[p.shopTab, category === item.id && p.selected]}><Text style={p.shopTabIcon}>{categoryIcons[item.id]}</Text><Text style={p.buttonText}>{item.title}</Text></Pressable>)}</View>;
}
function Shop({ pet, category }: { pet: Pet; category: Category }) {
  const data = pet.data!;
  return <>
    <Text style={[p.stat, { marginBottom: 15 }]}>ϟ {data.bolts} Bolts</Text>
    <Text style={[s.note, { marginBottom: 18 }]}>A little personality for your pocket companion.</Text>
    <View style={p.shopGrid}>
      {catalog.filter(item => item.category === category).map(item => {
        const owned = data.owned.includes(item.id), equipped = isEquipped(data.profile, item);
        return <View key={item.id} style={p.shopTile}>
          <View style={p.shopArt}><CosmeticIcon item={item} /></View>
          <Text style={[p.itemTitle, { textAlign: 'center' }]}>{item.name}</Text><Text style={[owned ? p.badge : s.note, { textAlign: 'center', marginBottom: 12 }]}>{equipped ? 'Equipped' : owned ? 'Owned' : `${item.price} Bolts`}</Text>
          <Button label={owned ? equipped ? item.category === 'color' ? 'Equipped' : 'Unequip' : 'Equip' : `Buy · ${item.price}`} disabled={pet.busy || (!owned && data.bolts < item.price) || (equipped && item.category === 'color')} onPress={() => pet.send({ type: owned ? 'equip' : 'buy', id: item.id })} />
        {!owned && data.bolts < item.price && <Text style={[s.note, { marginTop: 8, textAlign: 'center' }]}>{item.price - data.bolts} more Bolts needed</Text>}</View>;
      })}
    </View>
    <Text style={[s.note, { marginBottom: 20 }]}>Daily visit: +5 Bolts. Seven-day streak: +30. Early charging: +3, at most once per day after a new 10% discharge cycle.</Text>
    <View style={p.item}><Text style={p.itemTitle}>Earn +{pet.ads.amount} Bolts</Text><Text style={[s.note, { marginBottom: 12 }]}>Rewarded ads are coming later. No ads are loaded in this version.</Text><Button label="Watch an ad · unavailable" disabled={!pet.ads.available || pet.busy} onPress={() => { void pet.ads.watch().catch(() => {}); }} /></View>
  </>;
}
function Achievements({ pet }: { pet: Pet }) {
  return <><Text style={[s.note, { marginBottom: 20 }]}>Little milestones for looking after your Buddy. Rewards are added once, automatically.</Text>{achievements.map(item => {
    const date = pet.data!.achievements[item.id];
    const progress = date ? item.target : Math.min(item.target, item.progress(pet.data!, pet.facts));
    return <View style={p.item} key={item.id}><View style={p.itemRow}><Text style={[p.itemTitle, { flex: 1 }]}>{item.title}</Text><Text style={p.badge}>+{item.reward} Bolts</Text></View><Text style={s.note}>{item.description}</Text><View style={p.progress}><View style={[p.progressFill, { width: `${100 * progress / item.target}%` }]} /></View><Text style={[s.note, { marginTop: 9 }]}>{date ? `Unlocked ${new Date(date).toLocaleDateString()}` : `${progress} / ${item.target}`}</Text></View>;
  })}</>;
}
export function BuddyScreens({ screen, pet, mood, close }: { screen: BuddyScreen | null; pet: Pet; mood: BuddyMood; close: () => void }) {
  const [category, setCategory] = useState<Category>('hat');
  if (!screen || !pet.data) return null;
  if (screen === 'customize') return <Modal visible animationType="slide" onRequestClose={close}><SafeAreaView style={p.modal}><Customize pet={pet} mood={mood} close={close} /></SafeAreaView></Modal>;
  return <Modal visible animationType="slide" onRequestClose={close}><SafeAreaView style={p.modal}>
    <View style={p.shopHeader}><View style={p.modalHeader}><Text style={p.title}>{screen === 'shop' ? 'Buddy Shop' : 'Achievements'}</Text><Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={close} style={p.headerIcon}><Text style={p.headerGlyph}>×</Text></Pressable></View>
      {screen === 'shop' && <ShopTabs category={category} select={setCategory} />}
    </View><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[p.modalContent, { paddingTop: 8 }]}>
    {pet.error && <View style={[s.notice, { marginBottom: 15 }]} accessibilityRole="alert"><Text style={s.note}>{pet.error}</Text></View>}
    {screen === 'shop' ? <Shop pet={pet} category={category} /> : <Achievements pet={pet} />}
  </ScrollView></SafeAreaView></Modal>;
}


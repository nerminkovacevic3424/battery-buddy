import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Slider from "@react-native-community/slider";
import { StatusBar } from "expo-status-bar";
import * as DocumentPicker from "expo-document-picker";
import { alarm, AlarmState, Sound } from "./native";
import { s } from "./styles";
import { BuddyCard, BuddyScreen } from './buddy/BuddyCard';
import { BuddyScreens } from './buddy/BuddyScreens';
import { BuddyToolbar } from './buddy/BuddyToolbar';
import { useBuddy } from './buddy/useBuddy';
import { getBuddyMood } from './buddy/buddyState';

const sounds: { id: Sound; icon: string; title: string; subtitle: string }[] = [
  {
    id: "cry",
    icon: "🥺",
    title: "Little cry",
    subtitle: "Cry · A tiny, dramatic electronic sob",
  },
  {
    id: "robot",
    icon: "🤖",
    title: "Sad robot",
    subtitle: "Retro · Low power. Big feelings.",
  },
  {
    id: "chime",
    icon: "🔔",
    title: "Gentle chime",
    subtitle: "Cute · A softer call for a charger",
  },
];

function Home() {
  const [state, setState] = useState<AlarmState | null>(null);
  const pet = useBuddy(state?.buddyRevision);
  const [screen, setScreen] = useState<BuddyScreen | null>(null);
  const scroll = useRef<ScrollView>(null);
  const anchors = useRef({ sounds: 0, alarm: 0 });
  const [threshold, setThreshold] = useState(20);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Sound | null>(null);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editing = useRef(false);
  const operation = useRef(false);
  useEffect(() => {
    if (!alarm) return;
    const receive = (value: AlarmState) => {
      setState(value);
      if (!editing.current) setThreshold(value.threshold);
    };
    const refresh = () =>
      alarm!
        .getState()
        .then(receive)
        .catch((e) => setError(String(e)));
    const sub = alarm.addListener("onChange", receive);
    const appSub = AppState.addEventListener("change", (next) => {
      if (next === "active") void refresh();
      else {
        void alarm!.stopPreview().catch(() => {});
        setPreview(null);
      }
    });
    void refresh();
    return () => {
      sub.remove();
      appSub.remove();
      if (previewTimer.current) clearTimeout(previewTimer.current);
      void alarm!.stopPreview().catch(() => {});
    };
  }, []);
  async function act(task: () => Promise<unknown>) {
    if (operation.current) return;
    operation.current = true;
    setBusy(true);
    setError(null);
    try {
      await task();
      if (alarm) setState(await alarm.getState());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      operation.current = false;
      setBusy(false);
    }
  }
  async function toggle(value: boolean) {
    await act(async () => {
      if (
        value &&
        Platform.OS === "android" &&
        Number(Platform.Version) >= 33
      ) {
        const permission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        if (permission !== PermissionsAndroid.RESULTS.GRANTED)
          Alert.alert(
            "Notification permission",
            "Android may hide the monitoring notification. You can enable notifications in system settings. Monitoring can still run.",
          );
      }
      await alarm!.setEnabled(value);
      setPreview(null);
    });
  }
  async function choose(sound: Sound) {
    await act(async () => {
      await alarm!.configure(threshold, sound);
      setPreview(null);
    });
  }
  async function listen(sound: Sound) {
    await act(async () => {
      if (previewTimer.current) clearTimeout(previewTimer.current);
      if (preview === sound) {
        await alarm!.stopPreview();
        setPreview(null);
      } else {
        await alarm!.preview(sound);
        setPreview(sound);
        previewTimer.current = setTimeout(() => setPreview(null), 4000);
      }
    });
  }
  async function importSound() {
    await act(async () => {
      await alarm!.stopPreview();
      setPreview(null);
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled) return;
      const file = result.assets[0];
      if (file.size && file.size > 20 * 1024 * 1024)
        throw new Error("Choose a sound smaller than 20 MB.");
      await alarm!.importSound(file.uri, file.name);
      await alarm!.configure(threshold, "custom");
    });
  }
  const disabled = !alarm || !state || busy;
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style="dark" />
      <ScrollView
        ref={scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.header}>
          <View>
            <Text style={s.brand}>
              battery buddy<Text style={s.brandDot}>.</Text>
            </Text>
            <Text style={s.tagline}>A little nudge to plug in.</Text>
          </View>
          <View style={s.brandIcon}>
            <Text style={{ fontSize: 23 }}>ϟ</Text>
          </View>
        </View>
        <BuddyToolbar ready={!!pet.data} open={setScreen}
          jump={section => scroll.current?.scrollTo({ y: anchors.current[section], animated: true })} />
        <BuddyCard state={state} data={pet.data} />
        {pet.error && <View style={s.notice} accessibilityRole="alert"><Text style={s.note}>{pet.error}</Text><Pressable accessibilityRole="button" onPress={() => pet.send({type: 'visit'})}><Text style={s.link}>Retry Buddy save</Text></Pressable></View>}
        {!alarm && (
          <View style={s.notice}>
            <Text style={s.noticeTitle}>Android development build needed</Text>
            <Text style={s.note}>
              This app uses a native battery service. Install an Android build
              with npm run android; Expo Go and iPhone cannot run this service.
            </Text>
          </View>
        )}
        {alarm && !state && !error && (
          <ActivityIndicator
            color="#7561A8"
            accessibilityLabel="Loading battery settings"
          />
        )}
        {(error || state?.error) && (
          <View style={s.notice} accessibilityRole="alert">
            <Text style={s.noticeTitle}>Something needs attention</Text>
            <Text style={s.note}>{error || state?.error}</Text>
            <Pressable
              onPress={() =>
                void act(async () => {
                  setState(await alarm!.getState());
                })
              }
            >
              <Text style={s.link}>Refresh status</Text>
            </Pressable>
          </View>
        )}
        {!!state?.enabled && !state.running && (
          <View style={s.notice}>
            <Text style={s.note}>
              Monitoring has stopped. Tap below to restart it.
            </Text>
            <Pressable disabled={busy} onPress={() => void toggle(true)}>
              <Text style={s.link}>Restart monitoring</Text>
            </Pressable>
          </View>
        )}
        <View style={s.monitor} onLayout={event => { anchors.current.alarm = event.nativeEvent.layout.y; }}>
          <View style={s.monitorText}>
            <Text style={s.cardTitle}>Keep an ear out</Text>
            <Text style={s.note}>Cry when my battery needs me</Text>
          </View>
          <Switch
            accessibilityLabel="Enable low battery monitoring"
            value={!!state?.enabled}
            disabled={disabled}
            onValueChange={(v) => void toggle(v)}
            trackColor={{ false: "#DCD7E2", true: "#8470AF" }}
            thumbColor="#FFFFFF"
          />
        </View>
        <View style={[s.monitor, { paddingTop: 0 }]}>
          <View style={s.monitorText}><Text style={s.cardTitle}>Charging hello</Text><Text style={s.note}>A short chime when you plug in</Text></View>
          <Switch accessibilityLabel="Charging connection sound" value={state?.chargingSound ?? true} disabled={disabled} onValueChange={value => void act(() => alarm!.setChargingSound(value))} trackColor={{ false: '#DCD7E2', true: '#8470AF' }} thumbColor="#FFFFFF" />
        </View>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>THE BREAKING POINT</Text>
          <Text style={s.sectionNumber}>01</Text>
        </View>
        <View style={s.card}>
          <View style={s.row}>
            <View>
              <Text style={s.cardTitle}>Start crying at</Text>
              <Text style={s.note}>At or below this battery level</Text>
            </View>
            <Text style={s.threshold}>
              {threshold}
              <Text style={{ fontSize: 20 }}>%</Text>
            </Text>
          </View>
          <Slider
            accessibilityLabel="Low battery percentage"
            accessibilityValue={{
              min: 1,
              max: 99,
              now: threshold,
              text: threshold + " percent",
            }}
            minimumValue={1}
            maximumValue={99}
            step={1}
            value={threshold}
            disabled={disabled}
            minimumTrackTintColor="#8B74B8"
            maximumTrackTintColor="#E9E3F0"
            thumbTintColor="#7960A5"
            onSlidingStart={() => {
              editing.current = true;
            }}
            onValueChange={setThreshold}
            onSlidingComplete={(value) => {
              void act(async () => {
                try {
                  await alarm!.configure(value, state!.sound);
                  setThreshold(value);
                } catch (e) {
                  setThreshold(state!.threshold);
                  throw e;
                } finally {
                  editing.current = false;
                }
              });
            }}
            style={s.slider}
          />
          <View style={s.row}>
            <Text style={s.sliderLabel}>1% · living on the edge</Text>
            <Text style={s.sliderLabel}>99% · just in case</Text>
          </View>
          <View style={s.presets}>
            {[10, 15, 20, 30, 50].map((value) => (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityLabel={"Set threshold to " + value + " percent"}
                accessibilityState={{ selected: threshold === value, disabled }}
                disabled={disabled}
                onPress={() =>
                  void act(async () => {
                    await alarm!.configure(value, state!.sound);
                    setThreshold(value);
                  })
                }
                style={[s.preset, threshold === value && s.presetSelected]}
              >
                <Text
                  style={[
                    s.presetText,
                    threshold === value && s.presetSelectedText,
                  ]}
                >
                  {value}%
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={s.sectionHeader} onLayout={event => { anchors.current.sounds = event.nativeEvent.layout.y; }}>
          <Text style={s.sectionTitle}>BUDDY’S VOICE</Text>
          <Text style={s.sectionNumber}>02</Text>
        </View>
        <View style={s.card}>
          <Text style={s.cardTitle}>Choose Buddy’s voice</Text>
          <Text style={[s.note, { marginBottom: 18 }]}>
            Choose a voice. Tap play for a 4-second preview.
          </Text>
          {[
            ...sounds,
            ...(state?.customName
              ? [
                  {
                    id: "custom" as Sound,
                    icon: "🎵",
                    title: state.customName,
                    subtitle: "Custom · Your own sound",
                  },
                ]
              : []),
          ].map((sound, index) => (
            <View
              key={sound.id}
              style={[s.soundRow, index > 0 && s.soundBorder]}
            >
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{
                  checked: state?.sound === sound.id,
                  disabled,
                }}
                disabled={disabled}
                onPress={() => void choose(sound.id)}
                style={s.soundChoice}
              >
                <View
                  style={[
                    s.soundIcon,
                    state?.sound === sound.id && { backgroundColor: "#EDE5FA" },
                  ]}
                >
                  <Text style={{ fontSize: 24 }}>{sound.icon}</Text>
                </View>
                <View style={s.soundText}>
                  <Text numberOfLines={1} style={s.soundTitle}>
                    {sound.title}
                  </Text>
                  <Text style={s.soundSubtitle}>{sound.subtitle}</Text>
                </View>
                <View
                  style={[
                    s.radio,
                    state?.sound === sound.id && s.radioSelected,
                  ]}
                >
                  {state?.sound === sound.id && <View style={s.radioDot} />}
                </View>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  (preview === sound.id ? "Stop " : "Preview ") + sound.title
                }
                disabled={disabled || !!state?.ringing}
                onPress={() => void listen(sound.id)}
                style={[
                  s.play,
                  (disabled || state?.ringing) && { opacity: 0.4 },
                ]}
              >
                <Text style={s.playText}>
                  {preview === sound.id ? "■" : "▶"}
                </Text>
              </Pressable>
            </View>
          ))}
          <Pressable
            accessibilityRole="button"
            disabled={disabled || !!state?.ringing}
            onPress={() => void importSound()}
            style={s.import}
          >
            <Text style={s.importText}>
              ＋{" "}
              {state?.customName
                ? "Replace your sound"
                : "Bring your own sound"}
            </Text>
            <Text style={s.importHint}>Audio file · up to 20 MB</Text>
          </Pressable>
        </View>
        <View style={s.footer}>
          <View style={s.footerIcon}>
            <Text style={{ fontSize: 20 }}>ϟ</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.footerTitle}>Plug in. Peace restored.</Text>
            <Text style={s.note}>
              The sound stops as soon as power is connected. Works with wired
              and wireless charging.
            </Text>
          </View>
        </View>
        <Text style={s.smallPrint}>
          Uses your alarm volume and respects Android audio restrictions. Keep
          monitoring enabled for background alerts. Reopen after a restart or
          force-stop.
        </Text>
        <Text style={s.signature}>
          A LITTLE DRAMA. A LOT LESS DEAD BATTERY.
        </Text>
      </ScrollView>
      <BuddyScreens screen={screen} pet={pet} mood={getBuddyMood(state?.level ?? -1, !!state?.plugged)} close={() => setScreen(null)} />
    </SafeAreaView>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <Home />
    </SafeAreaProvider>
  );
}

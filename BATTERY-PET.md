# Battery pet update

Implemented incrementally in the existing Battery Buddy project. No packages were added, no dependency versions were changed, and Expo prebuild was not run. The battery receiver, foreground service, threshold controls, voice previews, imported audio, notification permissions, and existing alarm preference keys remain connected.

## Added features

- A saved Buddy profile: name, color, hat, face accessory, outfit, and five personalities.
- One mood helper for eight battery emotions, with external power overriding sadness and 100% while plugged in celebrating.
- Offline personality messages with at least two choices for every mood. Tapping Buddy plays a small React Native Animated bounce and selects a short reaction without repeating the previous one.
- A main Buddy card with battery status, streak, Bolt balance, customization, shop, achievements, and scroll shortcuts to the existing alarm and voice controls.
- Live customization previews. Save commits the profile; Close discards the draft. Only owned items can be equipped.
- A configurable 14-item catalog: five colors, four hats, two face accessories, three outfits. Lavender is free and owned by default.
- Bolts-only purchases with balance checks, persisted ownership, and equip/unequip actions.
- Daily visit rewards (+5), recurring seven-day bonuses (+30), and early charging rewards (+3).
- Five one-time achievements, progress displays, unlock dates, and automatic Bolt rewards.
- A rewarded-ad provider interface. AdMob is not installed, no ad IDs are required, and the button is disabled. A future adapter must report an earned-reward callback; simply opening or closing an ad awards nothing. Receipts prevent duplicate credits.

## Persistence and reward rules

Pet data uses the existing Android SharedPreferences file under separate `buddy-state`, `buddy-facts`, and `buddy-revision` keys. Missing pet data migrates to Buddy, cute personality, lavender body, no accessories, and zero Bolts before the first visit reward. Existing alarm keys are untouched. Unsupported or corrupt save documents surface a pet error rather than silently overwriting the save; the alarm continues independently.

Repository operations are queued. Every write compares the native revision and retries with fresh state after a concurrent update. Native revision comparison and writes are synchronized. This covers purchases, profile edits, rewards, and observations arriving together. Interface state is updated after the save succeeds.

Charging observations run on a native background executor, independently of the React Native runtime while the monitoring service runs. A transition from an observed unplugged state to power qualifies as a connection. Starting the app while already plugged in does not invent a charging event. Early charging qualifies at **10% or above**, at most once per local calendar day. After a connection, a new discharge of at least **10 percentage points** from the session peak is required to rearm. Rapid unplug/replug, app relaunch, and same-day repeated connections do not generate more rewards. Background care credits are reconciled into the wallet when the app next reads pet data.

Daily visits use the device's local calendar date, including month/year boundaries and DST. Same-day visits and clock rollback do not pay again. Missing a calendar day restarts the current streak while preserving the longest. As this is an entirely local system, changing the clock forward or editing application data is not defended against server-side.

Survivor requires **30 continuous days with monitoring active** and battery at least 5%. It uses elapsed time rather than the wall clock. Turning monitoring off, unknown readings, restarting the service/process, or falling below 5% restarts progress. This conservative definition avoids crediting periods the app could not observe. An unlocked achievement stays unlocked.

## Files created

- `src/buddy/types.ts`, `buddyState.ts`, `buddyMessages.ts`, `BuddyAvatar.tsx`, `CosmeticLayers.tsx`, `BuddyCard.tsx`, `BuddyScreens.tsx`, `petStyles.ts`, `useBuddy.ts`
- `src/storage/buddyStorage.ts`, `buddyRepository.ts`
- `src/economy/rewards.ts`, `buddyReducer.ts`
- `src/shop/catalog.ts`
- `src/streaks/streakService.ts`
- `src/achievements/achievements.ts`
- `src/ads/rewardedAds.ts`
- `modules/battery-alarm/android/src/main/java/expo/modules/batteryalarm/BuddyStore.kt`, `BuddyObservationPolicy.kt`
- `modules/battery-alarm/android/src/test/java/expo/modules/batteryalarm/BuddyObservationPolicyTest.kt`
- `__tests__/buddyLogic.test.tsx`
- `BATTERY-PET.md`

## Files modified

- `src/Home.tsx`: integrates the pet card/screens while retaining alarm and sound controls; adds anchor navigation and voice terminology.
- `src/native.ts`: types for pet persistence and revision events.
- Native `AlarmStore.kt`, `BatteryAlarmModule.kt`, `BatteryAlarmService.kt`: pet storage bridge and nonblocking battery observations.
- `__tests__/Home.test.tsx`: preserves alarm regressions and adds pet integration coverage.
- `android/app/build.gradle`, `plugins/with-short-cmake-paths.cjs`: changes the previous, overly small CMake object-path limit from 128 to 240 for the short `C:\b` checkout. No toolchain upgrade.

## Artwork and manual configuration

Cosmetic art is a replaceable set of React Native shape layers in `CosmeticLayers.tsx`, using the existing battery mascot style. Hats, glasses, clothing, and the crown are placeholders; the catalog's asset keys are the replacement boundary. No external art or animation library is needed.

There is no manual setup for pet features beyond building and installing the updated native app. Expo Go or an older installed APK does not include the new persistence bridge. Future rewarded ads require a compatible SDK adapter, its native setup and consent flow, and official development test IDs; none of that is activated here.

## Checks and device acceptance

Verified in this session:

- TypeScript: passed.
- JavaScript and React Native interface tests: **38 passed**.
- Native Kotlin compilation: passed.
- Native unit tests: **8 passed** (5 existing alarm-policy tests and 3 charging-reward policy tests).
- Production Android JavaScript/Hermes export: passed (616 modules).

Full APK packaging was attempted using JDK 17 and the existing toolchain. It stopped because the local NDK `clang.exe` returned **Permission denied** while CMake tested the compiler. No APK is claimed for this update. The previous 128-character CMake limit is now 240 in both the Android file and plugin. Run the build script from your own terminal for packaging, then complete the device checks below. Actual background audio, charger latency, and visual layout have not been tested on a phone in this session.

Run `npm run typecheck`, `npm test -- --runInBand`, and `android\gradlew.bat :battery-alarm:testReleaseUnitTest` from the appropriate working directory. Use `build-test.ps1` for the standalone ARM64 test APK. A final device check is still needed for actual audio, background monitoring, live charger events, and visual layout.

On a device, keep the existing app data when installing the update. Confirm the previous threshold and voice remain selected. Customize and save, force-close/reopen, and confirm the name/personality/outfit persist. Verify plug-in immediately stops the alarm, rapid reconnecting does not add Bolts, and disabling monitoring still removes the notification. Test import, preview, and select for a custom voice. Check shop purchases, insufficient balance, and achievement rewards. Test customization Close without Save and Android Back. Large font and small screen layouts should remain scrollable.

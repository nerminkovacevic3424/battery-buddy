# Battery Buddy shop update — 2026-09-15

Implemented directly in C:\b.

- Main navigation now uses compact icons above Buddy: Customize, Shop, Achievements, Voice, and Settings.
- Shop has category icons at the top and a two-column grid showing the actual cosmetics, prices, ownership, and equipped status.
- A short original three-note chime plays when a charger is connected. The low-battery alarm stops first. Repeated battery broadcasts do not repeat the chime. Charging hello can be disabled in settings. Background chimes require monitoring enabled; foreground chimes work while the app is open.
- First launch of this update adds 10,000 Bolts to the existing saved balance once. Relaunches and concurrent state updates do not repeat the grant. Purchases and other progress are preserved.

Validation: 41 interface/logic tests, 11 Android unit tests, TypeScript, and Android production JavaScript export passed. Physical-device audio/layout verification and a new complete APK build have not been performed for this update.

Rebuild using PowerShell:

    cd C:\b
    .\build-test.ps1

Install C:\b\BatteryBuddy-test.apk over the existing app to retain saved progress. Then open the app to receive the bonus. Do not uninstall or clear app data first.

New files: src/buddy/BuddyToolbar.tsx, src/shop/CosmeticIcon.tsx, scripts/generate-charging-sound.cjs; native ChargingCue.kt, PowerConnectionPolicy.kt, raw/charging.wav, and PowerConnectionPolicyTest.kt.
Modified areas: Home and native bridge, Buddy card/screens/styles, profile hydration/types, economy reducer/rewards, startup repository actions, native audio/service/module/settings, and related tests.
Dependencies added: none. Existing cosmetic artwork remains component-based placeholder artwork. No toolchain versions were changed.

The automatic gift is intended for this personal testing build. Remove the startup claimTestingBonus action before distributing a public build if new installations should not receive it.

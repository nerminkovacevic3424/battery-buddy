# Compact faces, saved colors, and balance reset

- Smaller personality face cards fit three across on standard phone widths.
- Each distinct saved custom color gets a selectable swatch card with its hex value. The previous version's last saved custom color is migrated automatically; older colors that were never retained cannot be recovered. New saved colors are retained across restarts. Switching custom colors still costs 30 Bolts per saved change.
- Customize, Shop, and Achievements use accessible cross-icon Close buttons.
- First launch of this update applies the requested one-time reset to zero Bolts, after the initial daily visit. Inventory, profile, streaks, achievements, and saved colors remain intact. The previous automatic 10,000-Bolt grant is removed from startup and marked consumed. Later earnings are not reset.

Changed: BuddyScreens.tsx, petStyles.ts, BuddyData types, buddyStorage.ts, buddyReducer.ts, useBuddy.ts, and related tests. No dependencies or native changes.

Validation: 51 tests, TypeScript, and Android production JS export passed. Tests include saved palette migration/selection/persistence, concurrent reset protection, and preserving earnings after reset. The test renderer emits a non-failing act warning for a BuddyCard update. Physical-device visual verification has not been performed.

Build from C:\b with .\build-test.ps1, install BatteryBuddy-test.apk over the existing app, and open it to apply the reset. This is source code; a new APK has not been built here.

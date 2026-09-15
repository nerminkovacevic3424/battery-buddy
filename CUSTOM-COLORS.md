# Face choices and custom colors

Personality choices now display face previews instead of text labels, with accessible personality names and selection state. They reflect the current battery mood and body color.

Customize includes RGB sliders and a six-digit hex input for custom body colors. The pinned preview updates immediately. Each saved change to a custom color costs 30 Bolts; previewing, canceling, and keeping the same color are free. Previously owned catalog colors remain free to equip. Switching back to an earlier custom color costs 30 again. The price and balance are visible before saving, and insufficient funds disable Save.

Color and currency updates commit atomically through the existing repository. Existing saves safely default the new customColor field to null. No new dependencies or native changes.

Added: CustomColorPicker.tsx and economy/customColor.ts. Updated: BuddyScreens.tsx, BuddyFace.tsx, BuddyData types, storage hydration, economy reducer, and tests.

Validation: TypeScript, 48 tests, and Android production JS export passed. Coverage includes canceling, persistence, repeated color changes, invalid input, insufficient funds, and concurrent duplicate saves. Physical-device visual verification has not been performed.

From C:\b run .\build-test.ps1 and install BatteryBuddy-test.apk over the existing app to retain your Bolts and inventory.

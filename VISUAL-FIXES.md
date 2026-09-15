# Battery Buddy visual fixes

- Hats now span Buddy's full 100px head width, with larger brims and a geometric crown that renders consistently without relying on a font glyph.
- Owned inventory items now show cosmetic artwork, labels, and selection state. Shop and inventory share the same artwork renderer.
- All eight battery moods now have distinct faces: energetic, happy, tired, worried, crying, panic, charging, and fully charged. Eyes, eyebrows, mouths, and tears update with native battery events. Mouth and eyebrow changes stay visible with sunglasses.

Changed: BuddyAvatar.tsx, CosmeticLayers.tsx, BuddyScreens.tsx, CosmeticIcon.tsx, Home.test.tsx. Added BuddyFace.tsx. No dependencies or native configuration changes.

Validation: TypeScript and 43 interface/logic tests passed, including battery-to-face updates and inventory selection persistence. Physical-device visual verification has not been performed.

From C:\b, run .\build-test.ps1 and install BatteryBuddy-test.apk over the existing app. Keep app data to preserve Bolts and purchased cosmetics.

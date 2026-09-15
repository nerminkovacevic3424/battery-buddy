# Personality faces

BuddyAvatar now passes the saved or previewed personality into BuddyFace. All five personalities modify eyes, brows, cheeks, and/or mouth while preserving the eight battery moods, tears, and charging expressions.

- Cute: bright round eyes and blush.
- Dramatic: taller eyes, raised eyebrows, wider mouth.
- Angry: furrowed thick brows, narrowed eyes, tighter mouth.
- Sarcastic: asymmetric eyes and eyebrow, tilted mouth.
- Chill: relaxed eyelids, flat brows, smaller smile.

Changes appear immediately in customization and persist after Save Buddy and app restart. No dependencies, native code, or saved data format changes.

Validation: TypeScript and 44 tests passed. Tests compare distinct rendered brow/mouth geometry for all 40 mood/personality combinations, including equipped sunglasses, and verify preview and saved personality after remount. Physical-device visual verification has not been performed.

Build from C:\b using .\build-test.ps1. Install BatteryBuddy-test.apk over the existing app to preserve progress.

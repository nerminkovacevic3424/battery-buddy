# Customize layout update

Customize now keeps Buddy's live preview and header outside the scrolling options. Save (checkmark) and close (cross) are adjacent icon buttons at the top with accessible labels and 44px touch targets. Save persists the draft and closes; close discards unsaved changes. Save is disabled for blank names or pending operations and shows a progress indicator while saving.

The compact preview keeps the avatar visible while browsing inventory and personalities. No dependencies, native changes, or data migrations.

Changed: src/buddy/BuddyScreens.tsx, src/buddy/petStyles.ts, and existing Home tests to use accessible button names.

Validation: TypeScript and all 44 tests passed, including saving, restoring, and discarding customization. Phone layout verification has not been performed.

From C:\b, run .\build-test.ps1 and install BatteryBuddy-test.apk over the existing app to preserve progress.

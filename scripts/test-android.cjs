const { spawnSync } = require('node:child_process');
const path = require('node:path');
const result = spawnSync(process.platform === 'win32' ? 'gradlew.bat' : './gradlew', [':battery-alarm:testDebugUnitTest'], {
  cwd: path.join(__dirname, '../android'), stdio: 'inherit', shell: process.platform === 'win32',
});
if (result.error) console.error('Install JDK 17 and the Android SDK, then run npx expo prebuild --platform android first.', result.error.message);
process.exit(result.status ?? 1);

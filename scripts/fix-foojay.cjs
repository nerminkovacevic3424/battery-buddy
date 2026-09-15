// React Native 0.83.10 bundles Foojay 0.5.0, which references an API removed in
// Gradle 9. Foojay 1.0.0 removes that reference. Keep this fix across npm ci.
const fs = require('node:fs');
const path = require('node:path');
const packageFile = require.resolve('@react-native/gradle-plugin/package.json');
const file = path.join(path.dirname(packageFile), 'settings.gradle.kts');
const source = fs.readFileSync(file, 'utf8');
const oldDeclaration = 'id("org.gradle.toolchains.foojay-resolver-convention").version("0.5.0")';
const newDeclaration = 'id("org.gradle.toolchains.foojay-resolver-convention").version("1.0.0")';
if (source.includes(oldDeclaration)) {
  fs.writeFileSync(file, source.replace(oldDeclaration, newDeclaration));
  console.log('Updated React Native Foojay resolver: 0.5.0 -> 1.0.0 (Gradle 9 compatibility).');
} else if (source.includes(newDeclaration)) {
  console.log('Foojay Gradle 9 compatibility fix is already applied.');
} else {
  throw new Error('React Native toolchain configuration changed. Review scripts/fix-foojay.cjs before building.');
}

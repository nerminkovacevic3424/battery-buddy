$ErrorActionPreference = 'Stop'
$env:JAVA_HOME = 'C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot'
if (-not (Test-Path -LiteralPath "$env:JAVA_HOME\bin\java.exe")) {
    throw 'JDK 17 was not found. Update JAVA_HOME in build-test.ps1 to your JDK 17 folder.'
}
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
$env:ANDROID_HOME = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
Push-Location (Join-Path $PSScriptRoot 'android')
try {
    & .\gradlew.bat :app:assembleRelease -PreactNativeArchitectures=arm64-v8a --console=plain
    if ($LASTEXITCODE -ne 0) { throw 'APK build failed. See the error above.' }
    $apk = Join-Path $PSScriptRoot 'BatteryBuddy-test.apk'
    Copy-Item -LiteralPath '.\app\build\outputs\apk\release\app-release.apk' -Destination $apk -Force
    Write-Host "Testing APK ready: $apk" -ForegroundColor Green
} finally {
    Pop-Location
}

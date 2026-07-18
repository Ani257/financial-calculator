# FinCalc — Android Build Instructions

## Prerequisites

| Tool | Version |
|---|---|
| Android Studio | Hedgehog (2023.1.1) or newer |
| JDK | 17 (bundled with Android Studio) |
| Android SDK | API 35 (compileSdk) |
| Node.js | 18+ |

---

## Step 1 — Clone & Install

```bash
git clone <repo-url>
cd fincalc
npm install
```

---

## Step 2 — Production Web Build + Capacitor Sync

These two commands are already done and committed. Run them again only if you
modify any TypeScript / CSS source files:

```bash
npm run build          # Vite production build → dist/
npx cap sync android   # Copies dist/ into android/app/src/main/assets/public/
```

**Current build sizes (gzip):**

| Chunk | Raw | Gzip |
|---|---|---|
| vendor (React + Router + Zustand) | 207.97 kB | **68.0 kB** |
| index (app code + all 8 calculators) | 69.81 kB | **20.4 kB** |
| CSS (all styles) | 27.35 kB | **4.8 kB** |
| state chunk | 0.65 kB | 0.4 kB |
| web chunks (Capacitor) | 10.04 kB | 3.6 kB |
| **Total transferred** | | **≈ 97 kB gzip** |

The installed APK will be larger (raw assets, not gzip), but well under 10 MB.

---

## Step 3 — Open in Android Studio

```bash
npx cap open android
```

Or: **File → Open** → select the `android/` folder.

Let Gradle sync complete (first sync downloads dependencies — takes 2–5 min).

---

## Step 4 — Generate Signed Release APK / AAB

### 4a. Create a keystore (first time only)

**Build → Generate Signed Bundle / APK → APK → Create new…**

Fill in your keystore details and save the `.jks` file somewhere safe.

### 4b. Add signing config to `android/app/build.gradle`

Uncomment and fill in the `signingConfigs` block:

```groovy
android {
    signingConfigs {
        release {
            storeFile     file('/path/to/your/keystore.jks')
            storePassword 'YOUR_STORE_PASSWORD'
            keyAlias      'YOUR_KEY_ALIAS'
            keyPassword   'YOUR_KEY_PASSWORD'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            // minifyEnabled true and shrinkResources true are already set
        }
    }
}
```

> ⚠️ **Never commit credentials to git.** Use Android Studio's keystore wizard
> or store values in `~/.gradle/gradle.properties` and reference them as
> `project.property('KEY_PASSWORD')`.

### 4c. Build

**Build → Generate Signed Bundle / APK → APK → release → Finish**

Or from the terminal:

```bash
cd android
./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

---

## Gradle Configuration Summary

### `android/variables.gradle`
```groovy
minSdkVersion    = 26   // Android 8.0+ — covers >95% of active devices
compileSdkVersion = 35
targetSdkVersion  = 35
```

### `android/app/build.gradle` — release buildType
```groovy
minifyEnabled   true   // R8 shrinks + obfuscates the Java/Kotlin shell
shrinkResources true   // Strips unused Android XML resources
proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'),
              'proguard-rules.pro'
```

### `android/app/proguard-rules.pro`
- Keeps the full Capacitor bridge (`com.getcapacitor.**`) and all `@PluginMethod` annotated methods
- Keeps `@JavascriptInterface` annotated methods (JS→Java calls)
- Keeps Parcelable / Serializable contracts
- Suppresses R8 notes for Capacitor and Kotlin internals
- Stripped of unused Cordova / Firebase Crashlytics rules (not in this project)

---

## Expected APK Size

| Component | Estimate |
|---|---|
| Capacitor WebView shell (Java/Kotlin, post-R8) | ~1.5 MB |
| Web assets (HTML + JS + CSS, uncompressed in APK) | ~0.5 MB |
| AndroidX / support libraries (post-R8) | ~1.5 MB |
| Android framework overhead | ~0.3 MB |
| **Total (unsigned release APK)** | **~4–5 MB** |

With AAB (Android App Bundle) and Play Store delivery, the device-delivered
size drops further because Google Play strips unused ABI / density resources.

---

## Troubleshooting

| Error | Fix |
|---|---|
| `AAPT: error: file not found` | Run `npm run build && npx cap sync android` first |
| `minSdkVersion too low` | `variables.gradle` already sets it to 26 |
| `Duplicate class` packaging error | `packagingOptions.resources.excludes` in `build.gradle` already handles this |
| R8: `Missing class` warning | Add a `-keep` rule to `proguard-rules.pro` for the missing class |
| WebView blank on device | Ensure the device runs Android 8.0+ (API 26); check Logcat for JS errors |

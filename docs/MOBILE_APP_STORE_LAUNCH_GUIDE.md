# Nemo Mobile Launch & Store Automation Guide
**Packaging, Codesigning, and Fully Automated "Goyang Kaki" CI/CD Pipeline for Android & iOS**

---

## 1. Executive Architecture Overview

Nemo is built as a high-performance, offline-first personal workspace using **Vite + React 18 + TypeScript + Dexie 4 (IndexedDB) + Tailwind CSS + GSAP**. To distribute Nemo on mobile devices, three primary architectural pathways exist:

```
                                  ┌───────────────────────────────┐
                                  │   Nemo Vite + React Source    │
                                  └──────────────┬────────────────┘
                                                 │
            ┌────────────────────────────────────┼────────────────────────────────────┐
            ▼                                    ▼                                    ▼
┌───────────────────────┐            ┌───────────────────────┐            ┌───────────────────────┐
│       Option A        │            │       Option B        │            │       Option C        │
│   Capacitor Native    │            │    Google TWA (Web)   │            │   PWA (Home Screen)   │
├───────────────────────┤            ├───────────────────────┤            ├───────────────────────┤
│ • Local web bundle    │            │ • Remote URL wrap     │            │ • Browser-hosted      │
│ • Zero backend needed │            │ • Zero code changes   │            │ • 100% Free ($0)      │
│ • Full Store presence │            │ • Play Store only     │            │ • No store approval   │
│ • iOS & Android       │            │ • Android only        │            │ • iOS & Android       │
└───────────────────────┘            └───────────────────────┘            └───────────────────────┘
```

### Architectural Comparison Matrix

| Feature | Option A: Capacitor | Option B: Trusted Web Activity (TWA) | Option C: Progressive Web App (PWA) |
| :--- | :--- | :--- | :--- |
| **Platforms Supported** | iOS (App Store) + Android (Google Play) | Android (Google Play) only | iOS (Safari) + Android (Chrome) |
| **Asset Location** | Bundled locally inside app binary | Hosted remotely on `nemo.syahmiaof.my` | Hosted remotely on `nemo.syahmiaof.my` |
| **Offline Performance** | Instant cold boot; no network hit required | Dependent on Service Worker caching | Dependent on Service Worker caching |
| **Database (Dexie/IndexedDB)** | Runs in local WebView sandbox; permanent | Shares browser IndexedDB storage | Shares browser IndexedDB storage |
| **Store Distribution** | Apple App Store & Google Play | Google Play Store only | Bypasses App Stores ("Add to Home Screen") |
| **Update Mechanism** | Binary update via Store (or Capgo live) | Instant on web push (zero store review) | Instant on web reload (zero store review) |
| **Push Notifications** | Native APNS + FCM background push | Web Push via Service Worker | Web Push (iOS 16.4+ & Android Chrome) |
| **Initial Financial Cost** | $99/yr (Apple) + $25 one-time (Google) | $25 one-time (Google) | **$0.00 (100% Free)** |

---

## 2. Storage Durability: Dexie & IndexedDB in Mobile WebViews

Nemo relies on Dexie 4.x for its entire domain persistence (`nemoDb.ts`). Ensuring that IndexedDB is not purged is critical for user trust.

### Android WebView (Capacitor & TWA)
- **Engine:** Chromium-based Android System WebView.
- **Location:** Sandboxed in `/data/data/com.nemo.app/app_webview/IndexedDB`.
- **Persistence:** **100% Permanent.** Android does not evict app-private WebView data during low-memory conditions. Data is only cleared if the user uninstalls the app or explicitly navigates to *App Info → Clear Storage*.
- **Verdict:** Dexie works flawlessly out of the box with zero native SQLite bridge needed.

### iOS WKWebView (Capacitor)
- **Engine:** Apple WebKit (`WKWebView`).
- **Origin & Sandbox:** Capacitor serves the local web assets from `capacitor://localhost` (or a custom scheme like `nemo://localhost`).
- **Persistence Reality:** Because the WKWebView runs inside an installed iOS app sandbox container (`/Library/WebKit/WebsiteData/Default/IndexedDB/`), it is treated differently than ephemeral Safari browser tabs.
- **Storage Pressure Safety:** Under extreme OS-level disk pressure (device < 500MB free space), iOS theoretically marks WebKit cache for eviction. To guarantee absolute durability:
  1. Call `navigator.storage.persist()` on app initialization (Nemo already supports this).
  2. For critical backups, Nemo's built-in JSON backup/restore exports directly to device files.
- **Verdict:** For a personal workspace, Dexie in WKWebView is robust, fast, and fully compliant with standard web APIs.

### Deep Linking & Auth Callbacks (Supabase Sync)
In Capacitor, authentication callbacks (e.g. Magic Link / OTP) redirect to a custom scheme rather than an `http://` domain:
- Custom URL Scheme: `nemo://auth/callback`
- App listener using `@capacitor/app`:
  ```typescript
  import { App } from '@capacitor/app';
  import { supabase } from '@/lib/supabase';

  App.addListener('appUrlOpen', (event) => {
    if (event.url.includes('auth/callback')) {
      const hash = event.url.split('#')[1];
      if (hash) {
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        if (accessToken && refreshToken) {
          supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        }
      }
    }
  });
  ```

---

## 3. Option A: Capacitor Implementation Playbook

Capacitor wraps Nemo's production Vite build into native Xcode (iOS) and Android Studio (Android) projects.

### Step 1: Install Dependencies
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios @capacitor/status-bar @capacitor/splash-screen @capacitor/app @capacitor/haptics
npm install -D @capacitor/assets
```

### Step 2: Initialize Capacitor
```bash
npx cap init Nemo com.nemo.app --web-dir dist
```

### Step 3: Configure `capacitor.config.ts`
Create or update `capacitor.config.ts` in the project root:
```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nemo.app',
  appName: 'Nemo',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'nemo',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: '#0A1222',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0A1222',
    },
  },
};

export default config;
```

### Step 4: Asset Generation with `@capacitor/assets`
Create a source folder `assets/` with:
- `assets/icon-only.png` (1024x1024 px, app logo without background padding)
- `assets/icon-foreground.png` (1024x1024 px, Android adaptive icon foreground)
- `assets/icon-background.png` (1024x1024 px, solid `#0A1222`)
- `assets/splash.png` (2732x2732 px, centered logo on `#0A1222`)

Generate all 40+ iOS icons, Android adaptive icons, and splash screens with a single command:
```bash
npx @capacitor/assets generate
```

### Step 5: Add Platforms & Sync
```bash
npx cap add android
npx cap add ios
npm run build
npx cap sync
```

### Step 6: Update `package.json` Scripts
Add convenient shortcuts to `package.json`:
```json
"scripts": {
  "cap:sync": "npm run build && npx cap sync",
  "cap:android": "npm run build && npx cap sync android && npx cap open android",
  "cap:ios": "npm run build && npx cap sync ios && npx cap open ios"
}
```

---

## 4. Option B: Trusted Web Activity (TWA) via Google Bubblewrap

If you want Nemo on Google Play with **zero native code maintenance**, Bubblewrap packages the live PWA into an Android App Bundle (.aab).

### Step 1: Install Bubblewrap CLI
```bash
npm install -g @bubblewrap/cli
```

### Step 2: Initialize from Web Manifest
```bash
bubblewrap init --manifest https://nemo.syahmiaof.my/manifest.webmanifest
```
Bubblewrap prompts for:
- App Name: `Nemo`
- Package ID: `com.nemo.app`
- Display Mode: `standalone`
- Theme Color: `#0A1222`
- Signing Key: prompts to create a new keystore (`nemo-release-key.keystore`)

### Step 3: Digital Asset Links Verification
To remove the Chrome browser URL bar and unlock full native appearance, deploy the Digital Asset Links file to Cloudflare/Vercel:
`public/.well-known/assetlinks.json`:
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.nemo.app",
      "sha256_cert_fingerprints": [
        "YOUR_RELEASE_KEYSTORE_SHA256_FINGERPRINT_HERE"
      ]
    }
  }
]
```

### Step 4: Build Release AAB
```bash
bubblewrap build
```
This produces `app-release-bundle.aab` ready for upload to Google Play Console.

---

## 5. Fastlane & Automated Codesigning ("Goyang Kaki" Setup)

Fastlane automates the tedious parts of mobile deployment: certificate generation, provisioning profiles, building binaries, and uploading to Google Play Internal Testing and Apple TestFlight.

### Directory Structure
```
fastlane/
├── Appfile
├── Fastfile
└── Matchfile
```

### Fastlane Configuration Files

#### `fastlane/Appfile`
```ruby
# iOS Configuration
app_identifier("com.nemo.app")
apple_id(ENV["APPLE_ID"]) # e.g. syahmiaof123@gmail.com
team_id(ENV["APPLE_TEAM_ID"])
itc_team_id(ENV["APPLE_ITC_TEAM_ID"])

# Android Configuration
json_key_file("fastlane/play-service-account.json")
package_name("com.nemo.app")
```

#### `fastlane/Fastfile`
```ruby
default_platform(:all)

platform :android do
  desc "Build and deploy Android release to Google Play Internal track"
  lane :beta do
    gradle(
      task: "bundle",
      build_type: "Release",
      project_dir: "android/"
    )
    upload_to_play_store(
      track: "internal",
      aab: "android/app/build/outputs/bundle/release/app-release.aab",
      skip_waiting_for_build_processing: true
    )
  end

  desc "Build unsigned/self-signed APK for GitHub Releases"
  lane :build_apk do
    gradle(
      task: "assemble",
      build_type: "Release",
      project_dir: "android/"
    )
  end
end

platform :ios do
  desc "Sync certificates, build IPA, and upload to TestFlight"
  lane :beta do
    api_key = app_store_connect_api_key(
      key_id: ENV["APP_STORE_CONNECT_KEY_ID"],
      issuer_id: ENV["APP_STORE_CONNECT_ISSUER_ID"],
      key_content: ENV["APP_STORE_CONNECT_PRIVATE_KEY"],
      is_key_content_base64: true
    )

    match(
      type: "appstore",
      api_key: api_key,
      readonly: is_ci
    )

    increment_build_number(
      build_number: ENV["GITHUB_RUN_NUMBER"] || "1",
      xcodeproj: "ios/App/App.xcodeproj"
    )

    build_app(
      workspace: "ios/App/App.xcworkspace",
      scheme: "App",
      export_method: "app-store"
    )

    upload_to_testflight(
      api_key: api_key,
      skip_waiting_for_build_processing: true
    )
  end
end
```

---

## 6. Hands-Off CI/CD Pipeline (GitHub Actions)

This pipeline builds web assets, generates Android APK + AAB, signs them, builds the iOS IPA, and pushes to TestFlight and Google Play automatically on every Git tag or manual dispatch.

Create `.github/workflows/mobile-release.yml`:

```yaml
name: Mobile Build & Release

on:
  push:
    tags:
      - 'v*.*.*'
  workflow_dispatch:

permissions:
  contents: write
  packages: write

jobs:
  build-web:
    name: Build Web Assets
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Build Web Application
        run: npm run build

      - name: Upload Web Dist Artifact
        uses: actions/upload-artifact@v4
        with:
          name: dist-artifact
          path: dist/
          retention-days: 1

  build-android:
    name: Build & Deploy Android
    needs: build-web
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Download Web Dist
        uses: actions/download-artifact@v4
        with:
          name: dist-artifact
          path: dist/

      - name: Setup Java JDK 17
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      - name: Sync Capacitor Android
        run: npx cap sync android

      - name: Decode Android Keystore
        run: |
          echo "${{ secrets.ANDROID_KEYSTORE_BASE64 }}" | base64 --decode > android/app/release.keystore

      - name: Build Release APK & AAB
        env:
          KEYSTORE_PATH: release.keystore
          KEYSTORE_PASSWORD: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
          KEY_ALIAS: ${{ secrets.ANDROID_KEY_ALIAS }}
          KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}
        run: |
          cd android
          ./gradlew assembleRelease bundleRelease

      - name: Upload APK to GitHub Release
        uses: softprops/action-gh-release@v2
        if: startsWith(github.ref, 'refs/tags/')
        with:
          files: |
            android/app/build/outputs/apk/release/app-release.apk
            android/app/build/outputs/bundle/release/app-release.aab
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Deploy to Google Play Internal Track via Fastlane
        if: env.PLAY_STORE_ENABLED == 'true'
        env:
          PLAY_STORE_ENABLED: ${{ secrets.GOOGLE_PLAY_JSON_KEY != '' }}
        run: |
          echo "${{ secrets.GOOGLE_PLAY_JSON_KEY }}" > fastlane/play-service-account.json
          bundle exec fastlane android beta

  build-ios:
    name: Build & Deploy iOS (TestFlight)
    needs: build-web
    runs-on: macos-14
    if: env.APPLE_DEPLOY_ENABLED == 'true'
    env:
      APPLE_DEPLOY_ENABLED: ${{ secrets.APP_STORE_CONNECT_PRIVATE_KEY != '' }}
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Download Web Dist
        uses: actions/download-artifact@v4
        with:
          name: dist-artifact
          path: dist/

      - name: Select Xcode 15.4
        run: sudo xcode-select -s /Applications/Xcode_15.4.app

      - name: Sync Capacitor iOS
        run: npx cap sync ios

      - name: Install Fastlane & CocoaPods
        run: |
          bundle install || gem install fastlane
          cd ios/App && pod install

      - name: Deploy to TestFlight via Fastlane
        env:
          APP_STORE_CONNECT_KEY_ID: ${{ secrets.APP_STORE_CONNECT_KEY_ID }}
          APP_STORE_CONNECT_ISSUER_ID: ${{ secrets.APP_STORE_CONNECT_ISSUER_ID }}
          APP_STORE_CONNECT_PRIVATE_KEY: ${{ secrets.APP_STORE_CONNECT_PRIVATE_KEY }}
          MATCH_PASSWORD: ${{ secrets.MATCH_PASSWORD }}
          MATCH_GIT_URL: ${{ secrets.MATCH_GIT_URL }}
          FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD: ${{ secrets.FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD }}
        run: bundle exec fastlane ios beta
```

---

## 7. MCP Tools & Agent Automation Integration

To achieve a true **"goyang kaki"** operational environment, you can use Model Context Protocol (MCP) servers and GitHub integration:

1. **GitHub MCP Server (`github`)**:
   - `create_or_update_file`: Update version tags in `package.json` and `capacitor.config.ts`.
   - `create_branch` & `create_pull_request`: Stage releases automatically.
   - `push_files`: Commit generated native artifacts or changelogs.
2. **Cloudflare / Vercel MCP Server**:
   - Verify that `https://nemo.syahmiaof.my/.well-known/assetlinks.json` is healthy and returns HTTP 200 before Google Play verification tests run.
   - Trigger preview deployments for branch testing.
3. **Headless Secret Authentication**:
   - **Apple:** Using the **App Store Connect API Key** (`.p8`) means authentication is **100% headless**—no 2FA SMS, no session timeout every 30 days.
   - **Google:** Using a **Google Cloud Service Account JSON** with Play Console access means deployments upload silently without interactive browser logins.

---

## 8. Step-by-Step Command Playbook

Follow these exact commands to execute the mobile pipeline:

```bash
# 1. Install Capacitor and core plugins
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios @capacitor/status-bar @capacitor/splash-screen @capacitor/app

# 2. Initialize Capacitor project
npx cap init Nemo com.nemo.app --web-dir dist

# 3. Add Android and iOS platforms
npx cap add android
npx cap add ios

# 4. Generate app icons and splash screens
npm install -D @capacitor/assets
npx @capacitor/assets generate

# 5. Build web app and sync native platforms
npm run build
npx cap sync

# 6. Test on Android Emulator / Physical Device
npx cap run android

# 7. Test on iOS Simulator / Physical iPhone (macOS required)
npx cap run ios

# 8. Create release tag to trigger GitHub Actions CI/CD
git tag v1.0.0
git push origin v1.0.0
```

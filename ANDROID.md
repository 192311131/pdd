# AestheticShade AI — Android (Capacitor)

The web app is wrapped with [Capacitor](https://capacitorjs.com). The React
build runs inside a native WebView; YOLO (ONNX/wasm) and Supabase work as-is.

- **App ID:** `com.cielinfitech.aestheticshade`
- **App name:** AestheticShade AI
- **Native project:** `android/` (open this in Android Studio)

## Prerequisites
- Android Studio (includes the Android SDK)
- JDK 17 (already installed)

## Open & run
```bash
npm run android:sync     # vite build + copy web assets into android/
npm run android:open     # opens the project in Android Studio
```
Or open Android Studio manually → **Open** → select the `android/` folder.

In Android Studio: let Gradle sync finish, pick an emulator or a plugged-in
device (USB debugging on), then press **Run ▶**.

## After you change web code
The native app serves a **copied** build, so re-sync after edits:
```bash
npm run android:sync
```
then rebuild/run in Android Studio.

## Notes
- **Env vars** (`VITE_SUPABASE_URL`, etc.) are inlined at `vite build` time, so
  they must be in `.env` when you run `android:sync`. The bundled app then has
  Supabase configured and will show the login screen.
- **Camera:** the in-app "Open Web Camera" uses the WebView's getUserMedia.
  `CAMERA` permission is declared in the manifest; Android prompts on first use.
- **Size:** the APK includes the ONNX model (~11 MB) + wasm (~27 MB), so expect
  a ~45 MB app. It runs fully offline for the restoration feature.
- **Build an APK:** in Android Studio → Build → Build Bundle(s)/APK(s) → Build APK.

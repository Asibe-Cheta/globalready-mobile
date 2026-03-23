# iOS pod install – slow or stuck

## What’s going on

`pod install` can look “stuck” at **Downloading dependencies** because:

1. It downloads two large React Native tarballs from Maven (~100MB+ each) with **no progress output**.
2. On slow or flaky networks that can take 10–20+ minutes or appear to hang.

## Option A: Pre-download tarballs (see progress)

From the **repo root**:

```bash
./scripts/prefetch-ios-tarballs.sh
cd ios
pod install --no-repo-update
```

The script downloads the same tarballs with `curl --progress-bar` so you see progress. After that, `pod install` reuses them and skips the slow step.

## Option B: Use EAS Build (no local pods)

You can avoid running `pod install` on your machine and let EAS do it on their servers (fast network):

```bash
# From repo root; do not commit ios/ if you want EAS to prebuild each time
eas build --platform ios --profile production
```

EAS runs `expo prebuild` and `pod install` in the cloud. If you don’t commit `ios/`, every build does a clean prebuild; if you do commit `ios/`, they use your Podfile.

## Option C: Give pod install more time

If you run `pod install` (or `pod install --no-repo-update`) in your own terminal and leave it running:

- The Maven download can take **5–20 minutes** on a slow connection with no progress.
- After “Downloading dependencies”, “Generating Pods project” and **“Integrating client project”** can take another **10–20 minutes** on first run with no extra output.

Don’t cancel it for at least **20–30 minutes** unless you see an actual error.

## Stuck at “Integrating client project”?

That step often shows **no new lines** for 10–20 minutes while Xcode scripts run. It is usually **not frozen**—just slow.

1. **Use verbose mode** so you see progress (new lines as it works):

   ```bash
   cd ios
   COCOAPODS_DISABLE_STATS=1 pod install --verbose --no-repo-update
   ```

2. **Wait at least 15–20 minutes** at “Integrating client project” before assuming it’s stuck.

3. If you prefer not to wait locally, use **Option B** (EAS Build) and let the cloud do `pod install`.

## One-liner (verbose, from repo root)

```bash
./scripts/prefetch-ios-tarballs.sh && cd ios && COCOAPODS_DISABLE_STATS=1 pod install --verbose --no-repo-update
```

## If it still hangs

- Run `./scripts/prefetch-ios-tarballs.sh` first, then `cd ios && pod install --no-repo-update`.
- Or use **Option B** and rely on EAS Build for iOS.

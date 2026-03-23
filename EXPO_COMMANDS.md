# Expo Commands Reference

## Starting the App

```bash
# Start Expo development server
npx expo start

# Start with cleared cache
npx expo start --clear

# Start on specific platform
npx expo start --ios
npx expo start --android
npx expo start --web
```

## Building

```bash
# Build for iOS (requires EAS)
npx expo build:ios

# Build for Android (requires EAS)
npx expo build:android

# Or use EAS Build (recommended)
npx eas build --platform ios
npx eas build --platform android
```

## Other Useful Commands

```bash
# Install dependencies
npm install

# Run linting
npm run lint

# Check Expo version
npx expo --version

# Clear Expo cache
npx expo start --clear
```

## Environment Variables

For Expo, environment variables should be:
- In `app.json` under `expo.extra`
- Or prefixed with `EXPO_PUBLIC_` in `.env` file
- Then accessed via `Constants.expoConfig?.extra` or `process.env.EXPO_PUBLIC_*`

## Testing on Device

1. Install Expo Go app on your phone
2. Run `npx expo start`
3. Scan QR code with Expo Go (iOS) or Camera app (Android)
4. App will load on your device

---

**Note:** This is an Expo React Native app, so always use `npx expo` commands, not `npm start`.

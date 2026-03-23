# Troubleshooting Guide

## Common Issues & Fixes

### 1. "Route is missing default export" Error

**Solution:** Clear Metro bundler cache:

```bash
# Stop the current Expo server (Ctrl+C), then:
npx expo start --clear
```

Or manually clear cache:
```bash
rm -rf node_modules/.cache
rm -rf .expo
npx expo start --clear
```

### 2. SafeAreaView Deprecation Warning

**Fixed:** Updated `components/ui/screen.tsx` to use `react-native-safe-area-context` instead of deprecated `SafeAreaView` from `react-native`.

### 3. Can't Connect to Expo Dev Server

**Solutions:**

**Option A: Use Tunnel Mode**
```bash
npx expo start --tunnel
```

**Option B: Ensure Same Network**
- Make sure phone and computer are on the same Wi-Fi
- Restart Expo: `npx expo start --clear`

**Option C: Use Development Build**
If Expo Go doesn't work, create a development build:
```bash
eas build --profile development --platform ios
# or
eas build --profile development --platform android
```

### 4. Environment Variables Not Loading

**Check:**
1. Variables are set in Expo dashboard
2. Variables start with `EXPO_PUBLIC_` for client-side access
3. Restart dev server: `npx expo start --clear`

### 5. Syntax Errors

**Common fixes:**
- Check for missing closing tags
- Verify all imports are correct
- Check for typos in component names
- Ensure all files have default exports

### 6. FlashList Not Working

**If you see FlashList errors:**
- Make sure `@shopify/flash-list` is installed: `npm install @shopify/flash-list`
- Restart dev server after installation

---

## Quick Fix Commands

```bash
# Clear all caches and restart
rm -rf node_modules/.cache .expo
npx expo start --clear

# Reinstall dependencies
rm -rf node_modules
npm install
npx expo start --clear

# Check for TypeScript errors
npx tsc --noEmit

# Check for linting errors
npm run lint
```

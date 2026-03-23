# Quick Expo Setup - Step by Step

## ✅ You're Already Logged In
You're logged in as: `justice_asibe`

## Step 1: Create Project in Expo Dashboard

1. Go to https://expo.dev
2. Click **"New project +"** button (top right)
3. Fill in the modal:
   - **Display Name**: `GlobalReady`
   - **Slug**: `globalready` (must match your app.json)
   - **Account**: Select `Justice_Asibe` (or create organization if preferred)
4. Click **"Create"**

**Note:** The warning about using an organization is optional. Personal account works fine for now.

## Step 2: Link Local Project

After creating the project, run:

```bash
eas build:configure
```

This will:
- Create `eas.json` file
- Prompt you to select your newly created "GlobalReady" project
- Link your local code to the Expo project

## Step 3: Set Environment Variables in Expo Dashboard

1. Go to your **GlobalReady** project on https://expo.dev
2. Click **"Environment variables"** in the left sidebar
3. Click **"Add variable"** and add each of these:

### Public Variables (Available in App):
```
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY
```

### Secret Variables (For Builds Only):
```
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
ANTHROPIC_API_KEY
```

**Important:** 
- For variables starting with `EXPO_PUBLIC_`, they'll be available in your app
- For secrets, they're only available during build time
- Get values from your `.env` file (but don't copy the file itself)

## Step 4: Update app.json (Optional for Local Dev)

Your `app.json` already has the correct structure. For local development, your `.env` file will work. For production builds, Expo will use the environment variables you set in the dashboard.

## Step 5: Test the Setup

```bash
# Start development server
npx expo start --clear

# Verify environment variables are loading
npx expo config --type public
```

## Step 6: Configure EAS Build (When Ready)

After `eas build:configure`, edit `eas.json` to add environment variables for production builds:

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "https://your-project.supabase.co",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "your-anon-key",
        "EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY": "pk_live_xxxxx"
      }
    }
  }
}
```

**Note:** For secrets (like `STRIPE_SECRET_KEY`), use EAS secrets instead:
```bash
eas secret:create --scope project --name STRIPE_SECRET_KEY --value "sk_live_xxxxx"
```

## Quick Commands Reference

```bash
# Check login status
npx expo whoami

# Configure EAS (links project)
eas build:configure

# List EAS secrets
eas secret:list

# Create a secret
eas secret:create --scope project --name VARIABLE_NAME --value "value"

# Build for production
eas build --platform ios --profile production
eas build --platform android --profile production
```

## What Gets Set Where?

| Variable | Where to Set | Used For |
|----------|-------------|----------|
| `EXPO_PUBLIC_SUPABASE_URL` | Expo Dashboard → Environment Variables | App runtime |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Expo Dashboard → Environment Variables | App runtime |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Expo Dashboard → Environment Variables | App runtime |
| `STRIPE_SECRET_KEY` | EAS Secrets (`eas secret:create`) | Edge Functions |
| `SUPABASE_SERVICE_ROLE_KEY` | EAS Secrets (`eas secret:create`) | Edge Functions |
| `ANTHROPIC_API_KEY` | EAS Secrets (`eas secret:create`) | Edge Functions |

## Next Steps After Setup

1. ✅ Project created in Expo dashboard
2. ✅ Project linked via `eas build:configure`
3. ✅ Environment variables set in Expo dashboard
4. ✅ Test locally: `npx expo start --clear`
5. ✅ When ready: Build with `eas build`

---

**Need help?** The full guide is in `EXPO_SETUP_GUIDE.md`

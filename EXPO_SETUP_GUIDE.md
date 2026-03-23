# Expo Setup Guide for GlobalReady

## Step 1: Create Expo Project

You have two options:

### Option A: Create via Expo Dashboard (Recommended)
1. Go to https://expo.dev
2. Click "New project +" button
3. Fill in:
   - **Display Name**: `GlobalReady`
   - **Slug**: `globalready` (must match your app.json slug)
   - **Account**: Select your account (or create an organization)
4. Click "Create"

### Option B: Create via CLI
```bash
npx expo init --template blank
# Or just link existing project:
npx expo login
```

## Step 2: Link Your Local Project to Expo

After creating the project in the dashboard:

### Option A: Use EAS CLI (Recommended)
```bash
# Initialize EAS (this will link your project)
eas build:configure
```

This will:
1. Create `eas.json` file
2. Prompt you to select your Expo project
3. Link your local project to the Expo project

### Option B: Manually set project ID
After creating the project, copy the Project ID from the Expo dashboard and add it to `app.json`:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "your-project-id-from-dashboard"
      }
    }
  }
}
```

You can find the Project ID in your Expo dashboard under the project settings.

## Step 3: Set Up Environment Variables in Expo

### Via Expo Dashboard (Recommended)

1. Go to your project on https://expo.dev
2. Navigate to **"Environment variables"** in the left sidebar
3. Add the following variables:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SECRET_KEY=your-secret-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx (or pk_live_xxxxx for production)
STRIPE_SECRET_KEY=sk_test_xxxxx (or sk_live_xxxxx for production)
STRIPE_CV_BUILDER_PRICE_ID=price_xxxxx
STRIPE_CV_TAILORING_PRICE_ID=price_xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

**Note:** These will be available in your app via `process.env.EXPO_PUBLIC_*` or `Constants.expoConfig?.extra`

### Via CLI (Alternative)

```bash
# Set environment variables
npx expo config --type public

# Or use EAS secrets (for build-time only)
eas secret:create --scope project --name SUPABASE_URL --value "https://your-project.supabase.co"
eas secret:create --scope project --name SUPABASE_ANON_KEY --value "your-anon-key"
# ... repeat for all variables
```

## Step 4: Configure EAS Build

### Install EAS CLI (if not already installed)
```bash
npm install -g eas-cli
```

### Login to EAS
```bash
eas login
```

### Initialize EAS
```bash
eas build:configure
```

This creates `eas.json` with build profiles.

### Update eas.json for Production

After running `eas build:configure`, update `eas.json`:

```json
{
  "cli": {
    "version": ">= 5.2.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "https://your-project.supabase.co",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "your-anon-key",
        "EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY": "pk_live_xxxxx"
      },
      "ios": {
        "bundleIdentifier": "com.globalready.app",
        "buildConfiguration": "Release"
      },
      "android": {
        "buildType": "aab",
        "package": "com.globalready.app"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "your-team-id"
      },
      "android": {
        "serviceAccountKeyPath": "./path-to-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

## Step 5: Update app.json with Expo Extra Config

Add environment variables to `app.json` for local development:

```json
{
  "expo": {
    "extra": {
      "supabaseUrl": "process.env.EXPO_PUBLIC_SUPABASE_URL",
      "supabaseAnonKey": "process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY",
      "stripePublishableKey": "process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY"
    }
  }
}
```

**Note:** For local development, use your `.env` file. For production builds, use Expo environment variables.

## Step 6: Verify Setup

### Check if project is linked
```bash
npx expo whoami
npx expo config --type public
```

### Test local development
```bash
npx expo start --clear
```

## Step 7: Build for Production

### iOS Build
```bash
eas build --platform ios --profile production
```

### Android Build
```bash
eas build --platform android --profile production
```

## Environment Variables Reference

### Required for App to Run:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key (public)
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (public)

### Required for Edge Functions:
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (secret)
- `STRIPE_SECRET_KEY` - Stripe secret key (secret)
- `ANTHROPIC_API_KEY` - Anthropic API key (secret)

### Optional:
- `STRIPE_CV_BUILDER_PRICE_ID` - Stripe price ID for CV Builder
- `STRIPE_CV_TAILORING_PRICE_ID` - Stripe price ID for CV Tailoring

## Security Best Practices

1. **Never commit secrets to git** - Use `.gitignore` for `.env`
2. **Use Expo Environment Variables** for production builds
3. **Use Supabase Edge Function Secrets** for server-side keys
4. **Separate test and production keys** - Use different Stripe accounts/keys

## Troubleshooting

### Project not linked?
```bash
npx expo link
```

### Environment variables not loading?
- Check `app.json` extra config
- Verify variables are set in Expo dashboard
- Restart Expo dev server: `npx expo start --clear`

### Build fails?
- Check EAS build logs: `eas build:list`
- Verify all environment variables are set
- Check `eas.json` configuration

---

**Next Steps:**
1. Create project in Expo dashboard
2. Link local project: `npx expo link`
3. Set environment variables in Expo dashboard
4. Run `eas build:configure`
5. Test build: `eas build --platform ios --profile preview`

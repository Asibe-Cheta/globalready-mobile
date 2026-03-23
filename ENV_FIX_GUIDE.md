# Fix Your .env File

## Issues Found

1. **SUPABASE_URL** - You're using the PostgreSQL connection string, but the app needs the HTTP URL
2. **Supabase Keys** - Your Supabase publishable and secret keys are correctly named

## Corrected .env File

Update your `.env` file with these corrections:

```bash
# Supabase Configuration
# Use the HTTP URL (not PostgreSQL connection string)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Additional Supabase Keys (if needed for your setup)
SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key-here
SUPABASE_SECRET_KEY=your-supabase-secret-key-here

# Stripe Configuration (get these from https://dashboard.stripe.com/apikeys)
# Note: These are separate from Supabase keys
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key

# Anthropic API Key (add your key here)
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Paystack Configuration (add your key here if using Paystack)
PAYSTACK_PUBLIC_KEY=pk_test_your-paystack-key-here
```

## Changes Made

1. **SUPABASE_URL**: Changed from PostgreSQL connection string to HTTP URL
   - ❌ `postgresql://postgres:...@db.your-project-id.supabase.co:5432/postgres`
   - ✅ `https://your-project-id.supabase.co`

2. **Supabase Keys**: Kept as `SUPABASE_` prefix (these are your Supabase keys)
   - ✅ `SUPABASE_PUBLISHABLE_KEY` - Your Supabase publishable key
   - ✅ `SUPABASE_SECRET_KEY` - Your Supabase secret key

**Note:** For Stripe payment integration, you'll need separate Stripe keys from your Stripe dashboard (these will have `pk_` and `sk_` prefixes).

## How to Get Correct Supabase URL

1. Go to your Supabase Dashboard
2. Navigate to **Project Settings** → **API**
3. Copy the **Project URL** (starts with `https://`)
4. Use that as your `SUPABASE_URL`

## Next Steps

1. Update your `.env` file with the corrected values above
2. Add your `ANTHROPIC_API_KEY` if you have it
3. Add your `PAYSTACK_PUBLIC_KEY` if you're using Paystack
4. Restart your Expo dev server:
   ```bash
   npx expo start --clear
   ```

## Security Reminder

⚠️ **Never commit your `.env` file to git!**

Make sure `.env` is in your `.gitignore`:
```gitignore
.env
.env.local
.env.*.local
```

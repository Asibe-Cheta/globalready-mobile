# Correct .env File Format

## Your Current .env (Corrected)

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Additional Supabase Keys (your custom Supabase keys)
SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key-here
SUPABASE_SECRET_KEY=your-supabase-secret-key-here

# Anthropic API Key (for AI features in Edge Functions)
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Paystack Configuration (if using Paystack for payments)
PAYSTACK_PUBLIC_KEY=pk_test_your-paystack-key-here

# Stripe Configuration (if using Stripe for payments)
# Get these from: https://dashboard.stripe.com/apikeys
# Note: These are SEPARATE from your Supabase keys
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
```

## Key Differences

### Supabase Keys (What You Have)
- `SUPABASE_URL` - Your Supabase project HTTP URL ✅
- `SUPABASE_ANON_KEY` - Public/anonymous key (JWT) ✅
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (JWT) ✅
- `SUPABASE_PUBLISHABLE_KEY` - Your custom Supabase publishable key ✅
- `SUPABASE_SECRET_KEY` - Your custom Supabase secret key ✅

### Stripe Keys (Separate - Get from Stripe Dashboard)
- `STRIPE_PUBLISHABLE_KEY` - Starts with `pk_test_` or `pk_live_`
- `STRIPE_SECRET_KEY` - Starts with `sk_test_` or `sk_live_`

## What's Already Correct

✅ Your `SUPABASE_URL` is now correct (HTTP URL)  
✅ Your Supabase keys are correctly named with `SUPABASE_` prefix  
✅ Your `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are correct

## What You Still Need

1. **ANTHROPIC_API_KEY** - If you're using AI features
   - Get from: https://console.anthropic.com/

2. **STRIPE Keys** (if using Stripe for payments)
   - Get from: https://dashboard.stripe.com/apikeys
   - These are completely separate from your Supabase keys

3. **PAYSTACK_PUBLIC_KEY** (if using Paystack instead of Stripe)
   - Get from: https://dashboard.paystack.com/#/settings/developer

## Your App Configuration

The app will use:
- `SUPABASE_URL` and `SUPABASE_ANON_KEY` for Supabase client connection
- `SUPABASE_SERVICE_ROLE_KEY` for Edge Functions (set as secret)
- `STRIPE_PUBLISHABLE_KEY` for Stripe payment integration (if using Stripe)
- `ANTHROPIC_API_KEY` for AI features in Edge Functions (set as secret)

## Next Steps

1. ✅ Your Supabase configuration is correct!
2. Add `ANTHROPIC_API_KEY` if you need AI features
3. Add Stripe or Paystack keys if you're implementing payments
4. Restart your Expo dev server: `npx expo start --clear`

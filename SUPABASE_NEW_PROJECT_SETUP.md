# Setting Up New Supabase Project for GlobalReady

## Step 1: Create New Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"** or **"Sign Up"**
3. Sign up with a different email address (or use GitHub/Google with a different account)
4. Verify your email if required

## Step 2: Create New Project

1. Once logged into the new account, click **"New Project"**
2. Fill in the project details:
   - **Name:** `GlobalReady Mobile` (or your preferred name)
   - **Database Password:** Create a strong password (save this securely!)
   - **Region:** Choose closest to your users (e.g., `eu-west-2` for Europe, `us-east-1` for US)
   - **Pricing Plan:** Free tier is fine to start

3. Click **"Create new project"**
4. Wait 2-3 minutes for the project to be provisioned

## Step 3: Get Project Credentials

Once the project is ready:

1. Go to **Project Settings** (gear icon in sidebar)
2. Navigate to **API** section
3. Copy the following:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) - Keep this secret!

4. Navigate to **Database** section
5. Copy the **Connection string** (URI format) if needed

## Step 4: Link Project to Local Development

### Option A: Using Supabase CLI (Recommended)

1. **Logout from current account:**
```bash
supabase logout
```

2. **Login with new account:**
```bash
supabase login
```
   - This will open a browser to authenticate with your new account

3. **Link your project:**
```bash
supabase link --project-ref your-new-project-ref
```
   - Get your project ref from: Project Settings → General → Reference ID

### Option B: Manual Configuration

1. Create/update `.env.local` or `.env` file:
```bash
SUPABASE_URL=https://your-new-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

2. Update `lib/supabase.ts` if needed (should already use env vars)

## Step 5: Set Up Database Schema

1. Go to **SQL Editor** in Supabase Dashboard
2. Run the schema from `NEXT_PROMPT.md` (lines 35-186)
3. Or use the Supabase CLI:
```bash
supabase db push
```

## Step 6: Set Up Storage Buckets

1. Go to **Storage** in Supabase Dashboard
2. Create two buckets:
   - **Bucket Name:** `cv-pdfs`
     - **Public:** No (private)
     - **File size limit:** 10MB
     - **Allowed MIME types:** `application/pdf`
   
   - **Bucket Name:** `uploaded-cvs`
     - **Public:** No (private)
     - **File size limit:** 5MB
     - **Allowed MIME types:** `application/pdf,text/html`

3. Set up storage policies (see `NEXT_PROMPT.md` lines 192-207)

## Step 7: Set Up Edge Functions Secrets

Before deploying edge functions, set your secrets:

```bash
# Make sure you're linked to the new project
supabase link --project-ref your-new-project-ref

# Set secrets
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxxxx
supabase secrets set SUPABASE_URL=https://your-new-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxxxx
```

## Step 8: Deploy Edge Functions

```bash
supabase functions deploy create-payment-intent verify-payment analyze-cv tailor-cv generate-cv-pdf
```

## Step 9: Update Environment Variables

Update your React Native app's environment. The app supports multiple methods:

### Option A: Update app.json (Recommended for Expo)

Edit `app.json` and add to the `expo` object:

```json
{
  "expo": {
    "extra": {
      "supabaseUrl": "https://your-new-project.supabase.co",
      "supabaseAnonKey": "your-anon-key-here"
    }
  }
}
```

### Option B: Use Environment Variables (Development)

Create a `.env` file in the project root (don't commit it!):

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-new-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Then install `dotenv`:
```bash
npm install dotenv
```

And load it in your entry file or `app/_layout.tsx`:
```typescript
import 'dotenv/config';
```

### Option C: Use Expo Constants (Already Configured)

The `lib/supabase.ts` file already supports:
1. `Constants.expoConfig?.extra` (from app.json)
2. `EXPO_PUBLIC_*` environment variables
3. Standard `process.env` variables

**Note:** After updating, restart your Expo dev server:
```bash
npx expo start --clear
```

## Step 10: Verify Connection

Test your connection:

```bash
# Test Supabase connection
npx supabase status

# Or test from your app
# The app should connect to the new project automatically
```

## Switching Between Projects

If you need to work with multiple projects:

1. **List linked projects:**
```bash
supabase projects list
```

2. **Link to different project:**
```bash
supabase link --project-ref different-project-ref
```

3. **Check current project:**
```bash
supabase status
```

## Important Notes

- ⚠️ **Never commit** `.env` files or service role keys to git
- ✅ Use `.env.example` as a template (without real keys)
- ✅ The `anon` key is safe for client-side use
- ⚠️ The `service_role` key has admin access - keep it secret!
- ✅ Free tier includes: 500MB database, 1GB file storage, 2GB bandwidth

## Troubleshooting

### "Project not found"
- Make sure you're logged into the correct Supabase account
- Verify the project ref is correct
- Check you have access to the project

### "Authentication failed"
- Logout and login again: `supabase logout && supabase login`
- Check your Supabase account permissions

### "Function deployment failed"
- Make sure secrets are set: `supabase secrets list`
- Verify you're linked to the correct project
- Check function code for syntax errors

## Next Steps

After setting up the new project:
1. ✅ Run database schema
2. ✅ Create storage buckets
3. ✅ Deploy edge functions
4. ✅ Update app environment variables
5. ✅ Test connection from app
6. ✅ Start development!

---

**Project Setup Complete!** 🎉

You can now use this new Supabase project exclusively for GlobalReady Mobile.

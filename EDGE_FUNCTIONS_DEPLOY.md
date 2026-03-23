# Supabase Edge Functions Deployment Commands

## Prerequisites

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref your-project-ref
```

## Set Environment Secrets

Before deploying, set your secrets:

```bash
# Stripe
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxxxx

# Supabase (for service role access)
supabase secrets set SUPABASE_URL=https://xxxxx.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=xxxxx

# Anthropic (for AI features)
supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxxxx

# SendGrid (email delivery)
supabase secrets set SENDGRID_API_KEY=sg_xxxxx
supabase secrets set SENDGRID_FROM_EMAIL=hello@yourdomain.com
supabase secrets set SENDGRID_FROM_NAME="GlobalReady"
```

## Deploy Edge Functions

### 1. Create Payment Intent
```bash
supabase functions deploy create-payment-intent
```

### 2. Verify Payment
```bash
supabase functions deploy verify-payment
```

### 3. Analyze CV (AI)
```bash
supabase functions deploy analyze-cv
```

### 4. Tailor CV (AI)
```bash
supabase functions deploy tailor-cv
```

### 5. Generate CV PDF
```bash
supabase functions deploy generate-cv-pdf
```

### 6. Send Email (SendGrid)
```bash
supabase functions deploy send-email
```

## Deploy All Functions at Once

```bash
supabase functions deploy create-payment-intent verify-payment analyze-cv tailor-cv generate-cv-pdf send-email
```

## Verify Deployment

Check your functions are deployed:
```bash
supabase functions list
```

## Test Functions Locally

You can test functions locally before deploying:

```bash
# Start local Supabase
supabase start

# Serve functions locally
supabase functions serve

# Test a function
curl -i --location --request POST 'http://localhost:54321/functions/v1/create-payment-intent' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"amount": 500, "cvId": "test-id", "userId": "test-user", "email": "test@example.com"}'
```

## Function Code Location

Create your edge functions in:
```
supabase/functions/
  ├── create-payment-intent/
  │   └── index.ts
  ├── verify-payment/
  │   └── index.ts
  ├── analyze-cv/
  │   └── index.ts
  ├── tailor-cv/
  │   └── index.ts
  ├── generate-cv-pdf/
  │   └── index.ts
  └── send-email/
      └── index.ts
```

## Notes

- Replace `your-project-ref` with your actual Supabase project reference
- Get your project ref from: Supabase Dashboard → Project Settings → General
- Edge functions use Deno runtime, not Node.js
- Functions are serverless and scale automatically
- Check function logs: `supabase functions logs <function-name>`

# GlobalReady Pro Subscription — Web Team Implementation Guide

## Overview

GlobalReady has a **Pro subscription tier at €9.99/month**. iOS users are directed to `globalready.tech` to subscribe (Apple policy prohibits in-app purchase buttons for web services). When a user subscribes on the website, their **Pro status must sync automatically to the mobile app**.

This document tells you exactly what to build.

---

## Current Problem

The pricing page on globalready.tech shows **three wrong tiers** ($0 Free CV, $7 ATS Pro CV, $10 Job-Targeted Rewrite). These are incorrect and the buttons do not function. This must be replaced.

---

## Correct Pricing Structure

There is **one subscription plan**:

| Plan | Price | Period |
|------|-------|--------|
| GlobalReady Pro | **€9.99** | per month |

The free tier remains free (no card needed). There are no $7 or $10 tiers.

---

## What Pro Unlocks (for your pricing page copy)

- Unlimited CV downloads
- Unlimited AI tailoring (no per-download fee)
- Unlimited AI job-fit checks
- Full job listing links
- Cancel anytime

---

## How the Sync Works (Architecture)

```
User on website → Stripe Checkout → Payment succeeds
→ Stripe fires webhook to Supabase Edge Function
→ Edge Function updates `subscriptions` table
→ Mobile app reads from `subscriptions` table on next open
→ User sees Pro status in app ✓
```

The Supabase webhook is **already deployed and live**:
```
https://bwgqzoplcgxguylerqsn.supabase.co/functions/v1/stripe-webhook
```

You just need to point Stripe's webhook at this URL and build the checkout on the website.

---

## Step-by-Step Implementation

### Step 1 — Create the Stripe Product & Price

In Stripe Dashboard → Products → Create product:
- **Name:** GlobalReady Pro
- **Pricing model:** Recurring
- **Price:** €9.99 / month (EUR)
- Save the generated `price_xxx` ID — you'll need it

> If the product already exists from a previous setup, just use that price ID.

### Step 2 — Register the Webhook in Stripe

In Stripe Dashboard → Developers → Webhooks → Add endpoint:
- **Endpoint URL:** `https://bwgqzoplcgxguylerqsn.supabase.co/functions/v1/stripe-webhook`
- **Events to listen for:**
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- Copy the **Webhook Signing Secret** (`whsec_xxx`) — give it to the backend/Supabase team to add as a Supabase Edge Function secret named `STRIPE_WEBHOOK_SECRET`

### Step 3 — Build the Checkout Flow on the Website

When the user clicks "Get Pro" / "Subscribe", create a Stripe Checkout Session via your backend:

```javascript
// Example: Next.js API route or Express endpoint
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  line_items: [
    {
      price: 'price_xxx', // your €9.99/month price ID
      quantity: 1,
    },
  ],
  customer_email: user.email, // pre-fill if user is logged in to your site
  metadata: {
    user_id: user.id, // ⚠️ CRITICAL — must be the Supabase auth user UUID
  },
  subscription_data: {
    metadata: {
      user_id: user.id, // ⚠️ CRITICAL — add here too for subscription events
    },
  },
  success_url: 'https://globalready.tech/upgrade-success',
  cancel_url: 'https://globalready.tech/pricing',
});

// Redirect user to session.url
```

**The `user_id` in metadata is critical.** The webhook uses it to identify which Supabase user to update. Without it, the app will never see the Pro status.

### Step 4 — Handle the "User ID" Problem

The user clicking the button on the website comes from the mobile app. They may not be logged in to your website. You have two options:

#### Option A — Email lookup (recommended if you have auth on the website)
User logs in to `globalready.tech` with the same email as their mobile app account. Your backend looks up the Supabase user by email to get their `user_id`:

```javascript
// On your backend
import { createClient } from '@supabase/supabase-js'
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const { data } = await supabaseAdmin.auth.admin.listUsers()
const match = data.users.find(u => u.email === userEmail)
const userId = match?.id
```

Then pass `userId` in the Stripe metadata as shown in Step 3.

#### Option B — URL parameter (simplest, if no website auth)
When the iOS app opens `globalready.tech`, append the user's ID as a URL parameter:

```typescript
// In billing.tsx (mobile app)
const { data: { user } } = await supabase.auth.getUser();
const url = `https://globalready.tech/upgrade?uid=${user?.id}`;
Linking.openURL(url);
```

Your website reads `uid` from the URL query string, stores it, and passes it in Stripe metadata when creating the checkout session.

> For now, the app sends users to `https://globalready.tech` without a `uid` param. The mobile team can add it once you confirm which option you're using.

---

## What the Webhook Does (Already Deployed — Don't Touch)

The edge function at `stripe-webhook` already handles:

| Stripe Event | What happens |
|---|---|
| `checkout.session.completed` (mode=subscription) | Creates/updates row in `subscriptions` table with `status: 'active'` |
| `customer.subscription.updated` | Updates `status`, `current_period_end`, `cancel_at_period_end` |
| `customer.subscription.deleted` | Sets `status: 'canceled'` |

The `subscriptions` table schema:
```sql
user_id                UUID    -- Supabase auth user
stripe_customer_id     TEXT
stripe_subscription_id TEXT
status                 TEXT    -- 'active' | 'canceled' | 'past_due' | 'inactive'
current_period_end     TIMESTAMPTZ
cancel_at_period_end   BOOLEAN
```

The mobile app reads this table to determine Pro status. Once the row is updated, the app reflects Pro on next open (or foreground).

---

## Pricing Page Copy (Suggested)

Replace the current pricing cards with:

---

**Free**
- Build your CV
- AI job-fit analysis
- Browse jobs
- $0 forever

**Pro — €9.99/month**
- Everything in Free
- Unlimited CV downloads
- Unlimited AI tailoring
- Full job links
- Cancel anytime

[Get Pro →] ← this button triggers Stripe Checkout

---

## Checklist for Web Team

- [ ] Replace $0/$7/$10 pricing cards with Free / Pro (€9.99/month)
- [ ] Create Stripe product + recurring price (€9.99 EUR/month)
- [ ] Register webhook URL in Stripe pointing to the Supabase edge function
- [ ] Share `whsec_xxx` signing secret with Supabase/backend team
- [ ] Build `/upgrade` or `/pricing` page with working Stripe Checkout
- [ ] Pass `user_id` (Supabase UUID) in Stripe session metadata and `subscription_data.metadata`
- [ ] Confirm with mobile team which Option (A or B) to use for passing `user_id`
- [ ] Build `/upgrade-success` page confirming payment and telling user to reopen the app
- [ ] Test end-to-end: subscribe on website → open app → Pro status active

---

## Questions?

Contact the mobile team for:
- The exact `user_id` format (UUID from Supabase auth)
- The Supabase URL and anon key (for admin lookups)
- Whether to add `uid` as a URL param to the `globalready.tech` link in the app

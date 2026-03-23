# Payment Testing Guide

## ✅ Setup Complete

- ✅ StripeProvider added to app layout
- ✅ Payment screen integrated with Stripe CardField
- ✅ Edge Functions deployed
- ✅ Payment flow connected to Supabase

## 🚀 Starting the App

To start testing, run:
```bash
npx expo start --clear
```

Then:
- Scan QR code with Expo Go app (iOS/Android)
- Or press `i` for iOS simulator
- Or press `a` for Android emulator

## 🧪 Testing Checklist

### Test 1: CV Builder Pro Payment

1. **Complete CV Builder Flow:**
   - Navigate through all 6 CV builder steps
   - Fill in personal details, work experience, education, skills, languages, certifications
   - Click "Download CV" or "Save & Continue" on final step

2. **Trigger Payment:**
   - Should navigate to `/complete-purchase` screen
   - See "$5.00" displayed in order summary
   - Payment method "Credit Card" should be selected by default

3. **Enter Test Card:**
   - Card Number: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/25`)
   - CVC: Any 3 digits (e.g., `123`)

4. **Complete Payment:**
   - Click "Pay $5.00 & Download"
   - Should show loading state
   - Should navigate to `/download-cv` screen on success

5. **Verify in Stripe Dashboard:**
   - Go to: https://dashboard.stripe.com/test/payments
   - Should see: `$5.00 USD - Successful`
   - Payment description should include CV ID

6. **Verify in Supabase:**
   ```sql
   SELECT * FROM payments 
   WHERE amount = 500 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```
   - Should see: `status = 'successful'`
   - Should see: `payment_method = 'stripe'`
   - Should see: `reference` (Stripe payment intent ID)

### Test 2: CV Tailoring Payment

1. **Upload CV & Get Match Report:**
   - Navigate to `/tailor-job-input`
   - Upload CV or paste job description
   - Get match report (should be ≥60% to show payment option)

2. **Trigger Payment:**
   - Click "Tailor My CV for This Job" (from GoodFitReport)
   - Should navigate to `/complete-purchase` with:
     - `cvId`: CV ID
     - `amount`: 500
     - `jobDescription`: Job description text
     - `serviceType`: 'cv_tailoring'

3. **Complete Payment:**
   - Enter test card: `4242 4242 4242 4242`
   - Click "Pay $5.00 & Download"
   - Should trigger CV tailoring after payment

4. **Verify CV Tailoring:**
   - Check Supabase `cvs` table:
   ```sql
   SELECT cv_data, job_description, payment_status 
   FROM cvs 
   WHERE id = 'your-cv-id';
   ```
   - `payment_status` should be `'completed'`
   - `job_description` should be set
   - `cv_data` should be updated with tailored content

### Test 3: Payment Failure

1. **Trigger Payment:**
   - Navigate to payment screen
   - Enter decline test card: `4000 0000 0000 0002`
   - Expiry: `12/25`
   - CVC: `123`

2. **Attempt Payment:**
   - Click "Pay $5.00 & Download"
   - Should show error alert: "Your card was declined."

3. **Verify Failure Handling:**
   - Check Supabase payments table:
   ```sql
   SELECT status, metadata 
   FROM payments 
   WHERE reference LIKE 'pi_%' 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```
   - Status might be `'pending'` or `'failed'`
   - User should be able to retry

### Test 4: 3D Secure Card (Optional)

1. **Use 3D Secure Test Card:**
   - Card: `4000 0025 0000 3155`
   - Expiry: `12/25`
   - CVC: `123`

2. **Complete 3D Secure:**
   - Should show 3D Secure authentication modal
   - Complete authentication
   - Payment should succeed

## 📊 Verification Queries

### Check All Payments
```sql
SELECT 
  id,
  user_id,
  cv_id,
  amount,
  currency,
  payment_method,
  status,
  reference,
  created_at
FROM payments
ORDER BY created_at DESC;
```

### Check CV Payment Status
```sql
SELECT 
  id,
  type,
  payment_status,
  job_description,
  created_at
FROM cvs
WHERE payment_status = 'completed'
ORDER BY created_at DESC;
```

### Check Payment Success Rate
```sql
SELECT 
  status,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM payments
GROUP BY status;
```

## 🔍 Stripe Dashboard Verification

### Payments Tab
- Go to: https://dashboard.stripe.com/test/payments
- Filter by date range
- Should see:
  - ✅ `$5.00 USD - Successful` (test cards)
  - ❌ `$5.00 USD - Failed` (decline card)

### Events Tab
- Go to: https://dashboard.stripe.com/test/events
- Should see events:
  - `payment_intent.created`
  - `payment_intent.succeeded` (or `payment_intent.payment_failed`)

## 🐛 Troubleshooting

### "Payment Failed - Not authenticated"
- User needs to be logged in
- Check Supabase auth session

### "Payment Failed - Missing required fields"
- Check that `cvId` and `amount` are passed in route params
- Verify Edge Function is receiving correct data

### "Card not complete"
- Make sure CardField is fully filled
- Check `cardComplete` state

### Payment succeeds but CV not updating
- Check Edge Function logs: `supabase functions logs tailor-cv`
- Verify `jobDescription` is passed correctly
- Check Supabase `cvs` table for updates

### Edge Function errors
- Check logs: `supabase functions logs <function-name>`
- Verify secrets are set: `supabase secrets list`
- Check function code for syntax errors

## ✅ Success Criteria

After testing, you should have:
- ✅ Successful $5 payments in Stripe Dashboard
- ✅ Payment records in Supabase `payments` table
- ✅ CV records with `payment_status = 'completed'`
- ✅ Tailored CVs generated after payment
- ✅ Proper error handling for failed payments
- ✅ Analytics events tracked

## 🚀 Next Steps After Testing

1. Test with real Stripe account (switch to live keys)
2. Add payment retry logic
3. Add payment history screen
4. Add receipt email functionality
5. Test with different currencies if needed

---

**Ready to test!** Use the test cards above and follow the checklist. 🎉

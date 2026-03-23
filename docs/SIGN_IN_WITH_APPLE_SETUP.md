# Sign in with Apple – Setup Guide for GlobalReady

This guide walks you through creating the correct IDs and key in Apple Developer and what to enter in Supabase. Use your **Bundle ID**: `com.globalready.app`.

---

## 1. Where to find your **Team ID** (no creation needed)

- Go to [Apple Developer](https://developer.apple.com/account) → sign in.
- **Team ID** is in the top-right: click your **account name** (or “Membership” in the sidebar).
- You’ll see **Team ID**: a 10-character code like `PVQF78H486` (letters and numbers).
- **Write it down** — you’ll need it in Supabase.

---

## 2. App ID (Bundle ID) – enable Sign in with Apple

Your app already has a Bundle ID: **`com.globalready.app`**. You only need to make sure “Sign in with Apple” is enabled on it.

1. Go to [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/identifiers/list).
2. In the left sidebar, click **Identifiers**.
3. Find **App IDs** (or use the “+” to add one if it doesn’t exist).
4. Find **`com.globalready.app`** in the list and click it (or create it with that exact ID).
5. Under **Capabilities**, find **Sign in with Apple** and **check it**.
6. If you had to create the App ID, choose **App** (not App Clip).
7. Click **Save** / **Continue** and **Register**.

You now have:
- **Bundle ID / App ID**: `com.globalready.app` (this is fixed for GlobalReady).

---

## 3. Create a **Key** (for the .p8 file and Key ID)

This key is used so Supabase can verify Apple sign-in (and for OAuth if you add web later).

1. In [Apple Developer](https://developer.apple.com/account), go to **Certificates, Identifiers & Profiles**.
2. In the left sidebar, click **Keys**.
3. Click the **+** button to create a new key.
4. **Key Name**: e.g. `GlobalReady Sign in with Apple`.
5. Check **Sign in with Apple**.
6. Click **Configure** next to “Sign in with Apple”:
   - **Primary App ID**: select **`com.globalready.app`**.
   - Save.
7. Click **Continue** → **Register**.
8. On the confirmation screen you get **one chance** to download the key:
   - Click **Download**.
   - You get a file like `AuthKey_XXXXXXXXXX.p8` (the `XXXXXXXXXX` is your **Key ID**).
9. **Store the .p8 file safely** (e.g. password manager or secure drive). You cannot download it again. If you lose it, you must create a new key.
10. **Write down the Key ID** shown on that page (e.g. `ABC123XYZ0`). It’s also in the filename: `AuthKey_<KeyID>.p8`.

You now have:
- **Key ID**: e.g. `ABC123XYZ0` (from the page and the `.p8` filename).
- **.p8 file**: `AuthKey_XXXXXXXXXX.p8` (contents will go into Supabase as “Secret” or “Private Key”).

---

## 4. Create a **Services ID** (for Supabase “Client ID”)

Supabase often expects a **Services ID** as the Apple “Client ID”, even for native iOS.

1. Still in [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/identifiers/list).
2. Click **Identifiers**.
3. Click the **+** button.
4. Select **Services IDs** → **Continue**.
5. Fill in:
   - **Description**: e.g. `GlobalReady Sign in with Apple`.
   - **Identifier**: use a reverse-domain style, e.g. **`com.globalready.app.service`** (must be unique; you can use `com.globalready.app.web` if you prefer).
6. Click **Continue** → **Register**.
7. Click the **new Services ID** in the list to open it.
8. Check **Sign in with Apple** → click **Configure**:
   - **Primary App ID**: select **`com.globalready.app`**.
   - **Domains and Subdomains**: for native-only you can add a placeholder, e.g. `globalready.tech`, or your Supabase project URL (e.g. `bwgqzoplcgxguylerqsn.supabase.co`) if Supabase asks for a redirect domain.
   - **Return URLs**: e.g. `https://bwgqzoplcgxguylerqsn.supabase.co/auth/v1/callback` (replace with your Supabase project URL if different).
9. Save → **Continue** → **Save**.

You now have:
- **Services ID**: e.g. `com.globalready.app.service` (this is what you’ll use as **Client ID** in Supabase, unless Supabase’s UI says to use Bundle ID for native).

---

## 5. Generate the **client secret** (from the .p8 key)

Supabase has **no "paste .p8" field** — only **"Secret Key (for OAuth)"**. You must generate a JWT from your Team ID, Key ID, Services ID, and .p8 file, then paste that JWT into Supabase.

**Option A – Supabase generates it**

- If the Supabase Apple provider has a field like “Upload .p8” or “Private key”, paste the **entire contents** of your `AuthKey_XXXXXXXXXX.p8` file (including the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` lines).
**Use the script:** Run `npm install`, then `node scripts/generate-apple-client-secret.js <TeamID> <KeyID> <ServicesID> <path-to-.p8>`. Copy the printed JWT into Supabase → Apple → Secret Key (for OAuth). Expires in 6 months.

**Option B – You generate the secret (e.g. for “Secret” field)**

- Use a generator that never sends your key to a server, e.g.:
  - [Supabase’s Apple client secret generator](https://supabase.com/docs/guides/auth/social-login/auth-apple#configuration) (recommended in their docs).
  - Or: [https://developer.apple.com/documentation/signinwithapplerestapi/generate_and_validate_tokens](https://developer.apple.com/documentation/signinwithapplerestapi/generate_and_validate_tokens).
- You’ll need:
  - **Key ID** (from step 3).
  - **Team ID** (from step 1).
  - **Services ID** (from step 4) as Client ID.
  - **Bundle ID**: `com.globalready.app`.
  - **.p8 file contents** (paste the whole file).
- The generated JWT is valid for a limited time (e.g. 6 months); for OAuth you’ll need to regenerate. For **native-only** iOS, some setups don’t require this; if Supabase still asks for a “Secret”, use this JWT.

---

## 6. Fill in the Supabase Dashboard

1. Open your project in [Supabase Dashboard](https://supabase.com/dashboard) → **Authentication** → **Providers** → **Apple**.
2. Enable **Apple**.
3. Enter the values you collected:

| Supabase field   | What to enter |
|------------------|----------------|
| **Client ID**    | **Services ID** from step 4, e.g. `com.globalready.app.service`. (If the UI says “use Bundle ID for native iOS”, try `com.globalready.app`.) |
| **Secret Key (for OAuth)** | The **JWT** from step 5 (run `node scripts/generate-apple-client-secret.js`). Paste the entire token. Supabase has no "paste .p8" field. |
| **Key ID**       | From step 3 (e.g. `ABC123XYZ0`). |
| **Team ID**      | From step 1 (e.g. `PVQF78H486`). |
| **Bundle ID**    | `com.globalready.app` (if there’s a separate field). |
| **Private Key**  | If asked, paste the **full contents** of your `AuthKey_XXXXXXXXXX.p8` file. |

4. Save.

---

## 7. Quick reference – your IDs

| Name        | Example / Your value |
|------------|-----------------------|
| **Bundle ID (App ID)** | `com.globalready.app` |
| **Team ID**            | (from Developer account, e.g. `PVQF78H486`) |
| **Key ID**             | (from Keys, e.g. `ABC123XYZ0`) |
| **Services ID**        | e.g. `com.globalready.app.service` |
| **.p8 file**           | `AuthKey_<KeyID>.p8` (keep safe) |

---

## 8. If something doesn’t work

- **“Invalid client”**  
  - Use the **Services ID** as Client ID in Supabase (or Bundle ID if Supabase’s Apple docs say so for native).
  - Ensure the Services ID is configured for Sign in with Apple and linked to `com.globalready.app`.

- **“Invalid token” / “Invalid key”**  
  - Key ID, Team ID, and .p8 must match the key created in Apple Developer.
  - For “Secret”, use a freshly generated JWT (Key ID, Team ID, Services ID, Bundle ID, .p8).

- **Button doesn’t appear on iOS**  
  - The app only shows “Sign in with Apple” when `Platform.OS === 'ios'`; it’s hidden on Android.

- **Capability missing**  
  - In Xcode (or EAS build), ensure the **Sign in with Apple** capability is enabled for the target (Expo’s `usesAppleSignIn: true` in `app.json` should do this for new builds).

After this, rebuild the app and test Sign in with Apple on a real device or TestFlight.

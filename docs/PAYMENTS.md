# Payments: Supabase + Stripe Connect

WinKPop takes real money with **Stripe Connect** (Express accounts), and the
money-handling code runs in **Supabase Edge Functions**. Until you add keys,
the app runs in **demo mode**: checkout, payouts and delivery confirmation all
work against local mock data, and no network calls are made.

## How money flows

1. **Buyer pays WinKPop** through Stripe Checkout (Stripe's hosted page). The app
   sends only listing ids. The `create-checkout` function re-prices everything on
   the server: listing prices, bundle discounts (5/10/15%), coupons, and the 5%
   buyer-protection fee. It also reserves the cards for 30 minutes so two people
   can't buy the same one.
2. **Stripe tells us it's paid.** The `stripe-webhook` function verifies Stripe's
   signature and is the only code that ever marks an order `paid`.
3. **Funds are held** on the WinKPop balance while the card ships (buyer
   protection). The seller adds tracking through `mark-shipped`.
4. **Buyer confirms delivery**, then `confirm-delivery` transfers the seller's
   full sale price to their Stripe account. Zero seller fees. It's idempotent, so
   a double tap can't pay twice.
5. **Sellers onboard** through `connect-onboarding` (Stripe Express). Stripe
   handles identity checks (KYC), bank details and tax forms (1099-K).

## Setup

1. Create a Supabase project and a Stripe account (turn on Connect, Express).
2. Apply the schema: `supabase db push` (runs `supabase/migrations/*`).
3. Set function secrets:
   ```bash
   supabase secrets set \
     STRIPE_SECRET_KEY=sk_live_... \
     STRIPE_WEBHOOK_SECRET=whsec_... \
     APP_URL=https://app.winkpop.app \
     ALLOWED_ORIGINS=https://app.winkpop.app,capacitor://localhost,https://localhost
   ```
   (`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided automatically.)
4. Deploy: `supabase functions deploy create-checkout connect-onboarding mark-shipped confirm-delivery stripe-webhook`.
   `supabase/config.toml` already turns off JWT checks for the webhook only.
5. In Stripe → Webhooks, point an endpoint at
   `https://<project>.supabase.co/functions/v1/stripe-webhook` for
   `checkout.session.completed`, `checkout.session.expired`, `account.updated`,
   `charge.refunded`. Turn on "Listen to events on Connected accounts" for `account.updated`.
6. In the app, copy `.env.example` to `.env.local` and fill in the URL and the **anon** key.
7. Optional: schedule `select public.release_stale_reservations();` every 15
   minutes (Supabase cron) as a safety net for abandoned checkouts.

Test end to end with Stripe test keys (`sk_test_…`, card `4242 4242 4242 4242`)
before switching to live keys.

## Security built in

- **No secrets in the app.** Only the Supabase anon key ships. The Stripe secret and
  service-role keys exist only as Edge Function secrets.
- **Row Level Security on every table.** Users can only edit their own profile and
  open listings. They can read only orders they're part of, and can never insert
  or update orders, payout accounts or webhook records. Those are written by the
  functions only.
- **Server-side pricing.** Clients can't change what they pay. The database also
  enforces prices ≥ $1.00 in $0.05 steps.
- **Webhook signatures verified**, and each event is processed once (`stripe_events`).
- **No double sales or double payouts.** Conditional updates reserve listings and
  claim orders atomically. Stripe idempotency keys guard transfers.
- **Open-redirect protection.** Return URLs must be on `ALLOWED_ORIGINS`.
- **CORS** is limited to your web origin and the Capacitor app origins.
- **Before launch:** move the session from localStorage to the iOS Keychain or
  Android Keystore with a secure-storage Capacitor plugin, then do a security
  review and a Stripe test-mode run-through of every path, including refunds.

## Returning to the app on iOS/Android

Stripe returns buyers to `APP_URL/checkout/return`. For the native apps, set up
**Universal Links** (iOS) and **App Links** (Android) for that path so Stripe
opens the app instead of the browser. You'll need `@capacitor/app` to listen for
`appUrlOpen` and route to it.

## App Store / Play Store rules

- Card sales between users are **physical goods**, so Stripe is allowed and Apple/Google
  in-app purchase is not required.
- **WinKPop Plus** (premium tools, watermark-free images) is a **digital
  subscription**. On iOS/Android it must use Apple/Google in-app purchase.
  RevenueCat's Capacitor plugin is a common choice. It isn't wired up yet: the
  Plus toggle is still a demo switch.

## What isn't live yet

Only **listings and orders** are synced to Supabase. Posts, chats, wishlists,
collections, reviews and the other social features still use on-device demo
data. Seed listings (ids like `pc-12`) can't be bought with real money. Listings
you create while signed in to a configured backend can.

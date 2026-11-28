import { callFunction, isBackendConfigured } from "./backend";

/**
 * Payments (§20) — Stripe Connect via Supabase Edge Functions.
 *
 * Model ("separate charges and transfers"):
 *  1. Buyer pays WinKPop through Stripe Checkout. Prices, bundle discounts and
 *     the 5% buyer-protection fee are recomputed on the server — the app only
 *     sends listing ids.
 *  2. The money is held on the platform balance (buyer protection, §20D).
 *  3. When the buyer confirms delivery, the server transfers the seller's full
 *     sale price to their Stripe Express account (zero seller fees, §20C).
 *
 * Card sales are physical goods, so Apple/Google allow an external processor
 * here. The WinKPop Plus subscription is digital and must use in-app purchase
 * on iOS/Android — see docs/PAYMENTS.md.
 *
 * In demo mode (no Supabase env vars) these return `{ demo: true }` and the
 * screens fall back to the local mock checkout.
 */

export type LiveResult<T> = ({ demo: false } & T) | { demo: true };

/** Server-side listings use UUIDs; demo/seed listings ("pc-12") can't be paid for live. */
export const isLiveListingId = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

function returnUrl(path: string): string {
  // Web: back to this origin. Native: configure a universal link to this route
  // (see docs/PAYMENTS.md) so Stripe returns to the app.
  return `${window.location.origin}${path}`;
}

export async function startCheckout(
  listingIds: string[],
  coupon?: string,
): Promise<LiveResult<{ url: string; orderIds: string[] }>> {
  if (!isBackendConfigured()) return { demo: true };
  const live = listingIds.filter(isLiveListingId);
  if (live.length !== listingIds.length) {
    throw new Error("Some cards in your cart are demo listings and can't be bought with real money.");
  }
  const r = await callFunction<{ url: string; order_ids: string[] }>("create-checkout", {
    listing_ids: live,
    coupon: coupon?.trim() || undefined,
    success_url: returnUrl("/checkout/return?status=success&session_id={CHECKOUT_SESSION_ID}"),
    cancel_url: returnUrl("/checkout/return?status=cancelled"),
  });
  return { demo: false, url: r.url, orderIds: r.order_ids };
}

/** Stripe Express onboarding so a seller can receive payouts. */
export async function startPayoutOnboarding(): Promise<LiveResult<{ url: string }>> {
  if (!isBackendConfigured()) return { demo: true };
  const r = await callFunction<{ url: string }>("connect-onboarding", {
    refresh_url: returnUrl("/settings/payments?payouts=refresh"),
    return_url: returnUrl("/settings/payments?payouts=done"),
  });
  return { demo: false, url: r.url };
}

/** Seller adds tracking; buyer is notified. */
export async function markShipped(orderId: string, trackingNumber: string): Promise<LiveResult<{ ok: true }>> {
  if (!isBackendConfigured()) return { demo: true };
  await callFunction("mark-shipped", { order_id: orderId, tracking_number: trackingNumber });
  return { demo: false, ok: true };
}

/** Buyer confirms delivery → server releases the held funds to the seller. */
export async function confirmDelivery(orderId: string): Promise<LiveResult<{ ok: true }>> {
  if (!isBackendConfigured()) return { demo: true };
  await callFunction("confirm-delivery", { order_id: orderId });
  return { demo: false, ok: true };
}

/** Open a Stripe-hosted page (Checkout / onboarding). */
export function openStripe(url: string) {
  // Same-window navigation keeps the WebView on Stripe's page; the return URL
  // brings the user back to the app.
  window.location.assign(url);
}

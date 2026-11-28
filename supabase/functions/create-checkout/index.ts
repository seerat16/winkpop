// POST { listing_ids: string[], coupon?: string, success_url, cancel_url }
// → { url, order_ids }
// Re-prices everything server-side, reserves the listings for 30 minutes,
// creates one order per seller and a Stripe Checkout Session for the total.
import { admin, handler, HttpError, json, requireUser, safeReturnUrl, stripe } from "../_shared/clients.ts";
import { quote } from "../_shared/pricing.ts";

const APP_URL = Deno.env.get("APP_URL") ?? "http://localhost:5173";
const RESERVE_MINUTES = 30;
const UUID = /^[0-9a-f-]{36}$/i;

Deno.serve(
  handler(async (req) => {
    const user = await requireUser(req);
    const body = await req.json().catch(() => ({}));
    const ids: string[] = Array.isArray(body.listing_ids) ? [...new Set(body.listing_ids as string[])] : [];
    if (ids.length === 0 || ids.length > 50 || !ids.every((id) => UUID.test(id))) {
      throw new HttpError(400, "Select between 1 and 50 cards to purchase.");
    }

    // Atomically reserve only listings that are still active and not the buyer's own.
    const until = new Date(Date.now() + RESERVE_MINUTES * 60_000).toISOString();
    const { data: reserved, error } = await admin
      .from("listings")
      .update({ status: "reserved", reserved_until: until })
      .in("id", ids)
      .eq("status", "active")
      .neq("seller_id", user.id)
      .in("intent", ["sale", "both"])
      .select("id, seller_id, price_cents, title");
    if (error) throw error;
    if (!reserved || reserved.length !== ids.length) {
      // Roll back anything we did reserve, then explain.
      if (reserved?.length) await admin.from("listings").update({ status: "active", reserved_until: null }).in("id", reserved.map((r) => r.id));
      throw new HttpError(409, "Some cards are no longer available. Refresh your cart and try again.");
    }

    // Every seller must be able to receive payouts.
    const sellerIds = [...new Set(reserved.map((r) => r.seller_id as string))];
    const { data: accounts } = await admin.from("seller_accounts").select("user_id, payouts_enabled").in("user_id", sellerIds);
    const ready = new Set((accounts ?? []).filter((a) => a.payouts_enabled).map((a) => a.user_id));
    if (sellerIds.some((s) => !ready.has(s))) {
      await admin.from("listings").update({ status: "active", reserved_until: null }).in("id", ids);
      throw new HttpError(409, "One of these sellers hasn't finished payout setup yet.");
    }

    let q;
    try {
      q = quote(
        reserved.map((r) => ({ listingId: r.id, sellerId: r.seller_id, priceCents: r.price_cents, title: r.title })),
        body.coupon,
      );
    } catch (e) {
      await admin.from("listings").update({ status: "active", reserved_until: null }).in("id", ids);
      throw new HttpError(400, (e as Error).message);
    }

    const transferGroup = crypto.randomUUID();
    const orders = q.sellers.map((s) => ({
      buyer_id: user.id,
      seller_id: s.sellerId,
      subtotal_cents: s.subtotalCents,
      discount_cents: s.discountCents,
      buyer_fee_cents: s.buyerFeeCents,
      seller_payout_cents: s.sellerPayoutCents,
      transfer_group: transferGroup,
    }));
    const { data: created, error: oErr } = await admin.from("orders").insert(orders).select("id, seller_id");
    if (oErr) throw oErr;
    const orderBySeller = new Map(created!.map((o) => [o.seller_id as string, o.id as string]));
    await admin.from("order_items").insert(
      q.sellers.flatMap((s) => s.items.map((i) => ({ order_id: orderBySeller.get(s.sellerId), listing_id: i.listingId, price_cents: i.priceCents }))),
    );

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      client_reference_id: user.id,
      expires_at: Math.floor(Date.now() / 1000) + RESERVE_MINUTES * 60,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: q.totalCents,
            product_data: {
              name: `WinKPop order · ${reserved.length} photocard${reserved.length > 1 ? "s" : ""}`,
              description: "Includes bundle discounts and 5% buyer protection. Held until you confirm delivery.",
            },
          },
        },
      ],
      payment_intent_data: { transfer_group: transferGroup },
      metadata: { transfer_group: transferGroup, order_ids: created!.map((o) => o.id).join(",") },
      success_url: safeReturnUrl(body.success_url, `${APP_URL}/checkout/return?status=success&session_id={CHECKOUT_SESSION_ID}`),
      cancel_url: safeReturnUrl(body.cancel_url, `${APP_URL}/checkout/return?status=cancelled`),
    });

    await admin.from("orders").update({ checkout_session_id: session.id }).eq("transfer_group", transferGroup);
    return json(req, { url: session.url, order_ids: created!.map((o) => o.id) });
  }),
);

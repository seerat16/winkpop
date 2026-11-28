// Stripe → WinKPop webhook. Verifies the signature, processes each event once,
// and is the ONLY place an order becomes "paid".
// Configure in Stripe for: checkout.session.completed, checkout.session.expired,
// account.updated, charge.refunded. Deploy with --no-verify-jwt (Stripe has no Supabase JWT).
import Stripe from "npm:stripe@17";
import { admin, stripe } from "../_shared/clients.ts";

const SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const crypto = Stripe.createSubtleCryptoProvider();

Deno.serve(async (req) => {
  const sig = req.headers.get("Stripe-Signature");
  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(raw, sig ?? "", SECRET, undefined, crypto);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  // Idempotency: ignore events we've already handled.
  const { error: dup } = await admin.from("stripe_events").insert({ id: event.id, type: event.type });
  if (dup) return new Response("Already processed", { status: 200 });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        if (s.payment_status !== "paid") break;
        const pi = typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent?.id;
        const intent = pi ? await stripe.paymentIntents.retrieve(pi) : null;
        const charge = typeof intent?.latest_charge === "string" ? intent.latest_charge : intent?.latest_charge?.id;
        const { data: orders } = await admin
          .from("orders")
          .update({ status: "paid", paid_at: new Date().toISOString(), payment_intent_id: pi, charge_id: charge })
          .eq("checkout_session_id", s.id)
          .eq("status", "pending_payment")
          .select("id");
        const ids = (orders ?? []).map((o) => o.id);
        if (ids.length) {
          const { data: items } = await admin.from("order_items").select("listing_id").in("order_id", ids);
          await admin.from("listings").update({ status: "sold", reserved_until: null }).in("id", (items ?? []).map((i) => i.listing_id));
        }
        break;
      }
      case "checkout.session.expired": {
        const s = event.data.object as Stripe.Checkout.Session;
        const { data: orders } = await admin
          .from("orders")
          .update({ status: "cancelled" })
          .eq("checkout_session_id", s.id)
          .eq("status", "pending_payment")
          .select("id");
        const ids = (orders ?? []).map((o) => o.id);
        if (ids.length) {
          const { data: items } = await admin.from("order_items").select("listing_id").in("order_id", ids);
          await admin
            .from("listings")
            .update({ status: "active", reserved_until: null })
            .in("id", (items ?? []).map((i) => i.listing_id))
            .eq("status", "reserved");
        }
        break;
      }
      case "account.updated": {
        const a = event.data.object as Stripe.Account;
        await admin
          .from("seller_accounts")
          .update({ payouts_enabled: Boolean(a.payouts_enabled && a.charges_enabled !== false), updated_at: new Date().toISOString() })
          .eq("stripe_account_id", a.id);
        break;
      }
      case "charge.refunded": {
        const c = event.data.object as Stripe.Charge;
        await admin.from("orders").update({ status: "refunded" }).eq("charge_id", c.id).neq("status", "completed");
        break;
      }
    }
  } catch (e) {
    // Let Stripe retry: forget the event id so the retry is processed.
    await admin.from("stripe_events").delete().eq("id", event.id);
    console.error(e);
    return new Response("Handler error", { status: 500 });
  }
  return new Response("ok", { status: 200 });
});

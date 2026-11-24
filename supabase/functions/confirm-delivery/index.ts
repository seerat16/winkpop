// POST { order_id } — the BUYER confirms the card arrived. Only then are the
// held funds transferred to the seller (buyer protection, §20D).
import { admin, handler, HttpError, json, requireUser, stripe } from "../_shared/clients.ts";

Deno.serve(
  handler(async (req) => {
    const user = await requireUser(req);
    const { order_id } = await req.json().catch(() => ({}));
    if (typeof order_id !== "string") throw new HttpError(400, "Missing order.");

    // Claim the order atomically so a double tap can't pay the seller twice.
    const { data: claimed, error } = await admin
      .from("orders")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", order_id)
      .eq("buyer_id", user.id)
      .in("status", ["paid", "shipped", "delivered"])
      .select("id, seller_id, seller_payout_cents, currency, charge_id, transfer_group")
      .maybeSingle();
    if (error) throw error;
    if (!claimed) throw new HttpError(404, "Order not found or already completed.");

    const { data: acct } = await admin.from("seller_accounts").select("stripe_account_id").eq("user_id", claimed.seller_id).single();
    try {
      const transfer = await stripe.transfers.create(
        {
          amount: claimed.seller_payout_cents,
          currency: claimed.currency,
          destination: acct!.stripe_account_id,
          transfer_group: claimed.transfer_group,
          ...(claimed.charge_id ? { source_transaction: claimed.charge_id } : {}),
          metadata: { order_id: claimed.id },
        },
        { idempotencyKey: `payout-${claimed.id}` },
      );
      await admin.from("orders").update({ transfer_id: transfer.id }).eq("id", claimed.id);
    } catch (e) {
      // Put the order back so the buyer (or support) can retry.
      await admin.from("orders").update({ status: "delivered", completed_at: null }).eq("id", claimed.id);
      throw e;
    }
    return json(req, { ok: true });
  }),
);

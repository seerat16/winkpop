// POST { order_id, tracking_number } — seller marks a paid order as shipped.
import { admin, handler, HttpError, json, requireUser } from "../_shared/clients.ts";

Deno.serve(
  handler(async (req) => {
    const user = await requireUser(req);
    const { order_id, tracking_number } = await req.json().catch(() => ({}));
    if (typeof order_id !== "string") throw new HttpError(400, "Missing order.");
    const tracking = typeof tracking_number === "string" ? tracking_number.trim().slice(0, 64) : "";
    const { data, error } = await admin
      .from("orders")
      .update({ status: "shipped", shipped_at: new Date().toISOString(), tracking_number: tracking || null })
      .eq("id", order_id)
      .eq("seller_id", user.id)
      .eq("status", "paid")
      .select("id");
    if (error) throw error;
    if (!data?.length) throw new HttpError(404, "Order not found or not ready to ship.");
    return json(req, { ok: true });
  }),
);

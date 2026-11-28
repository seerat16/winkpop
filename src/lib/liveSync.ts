import type { Order, OrderStatus, UserListing } from "@/data/types";
import { db, getSession, isBackendConfigured } from "./backend";

/**
 * Bridges the local app stores and the Supabase tables used for payments.
 * Only listings and orders are synced — everything else (social, wishlists,
 * collection) stays local until a full backend migration.
 */

/** Publish a listing so it can be bought with real money. Returns false in demo mode. */
export async function publishListing(l: UserListing): Promise<boolean> {
  if (!isBackendConfigured()) return false;
  const session = await getSession();
  if (!session) throw new Error("Sign in again to publish listings.");
  await db.insert("listings", {
    id: l.id,
    seller_id: session.user.id,
    catalog_id: l.catalogId ?? null,
    title: l.title.slice(0, 140),
    description: l.description.slice(0, 2000),
    condition: l.condition,
    intent: l.intent,
    // Trade-only listings still need a valid price row; they can't be checked out.
    price_cents: Math.max(100, Math.round(l.price * 20) * 5),
  });
  return true;
}

interface RemoteOrder {
  id: string;
  buyer_id: string;
  seller_id: string;
  status: "pending_payment" | "paid" | "shipped" | "delivered" | "completed" | "cancelled" | "refunded";
  subtotal_cents: number;
  discount_cents: number;
  buyer_fee_cents: number;
  seller_payout_cents: number;
  tracking_number: string | null;
  created_at: string;
  order_items: { listing_id: string; price_cents: number }[];
  buyer: { username: string } | null;
  seller: { username: string } | null;
}

const STATUS: Record<RemoteOrder["status"], { status: OrderStatus; step: number } | null> = {
  pending_payment: null, // not paid yet — don't show
  paid: { status: "pending", step: 1 },
  shipped: { status: "in_transit", step: 3 },
  delivered: { status: "delivered", step: 4 },
  completed: { status: "completed", step: 5 },
  cancelled: null,
  refunded: null,
};

/** The signed-in user's real orders, mapped onto the app's Order shape. */
export async function fetchLiveOrders(): Promise<Order[]> {
  if (!isBackendConfigured()) return [];
  const session = await getSession();
  if (!session) return [];
  const rows = await db.select<RemoteOrder>(
    "orders",
    "select=*,order_items(listing_id,price_cents),buyer:profiles!orders_buyer_id_fkey(username),seller:profiles!orders_seller_id_fkey(username)&order=created_at.desc&limit=100",
  );
  const out: Order[] = [];
  for (const r of rows) {
    const s = STATUS[r.status];
    if (!s) continue;
    const buying = r.buyer_id === session.user.id;
    const n = r.order_items.length;
    out.push({
      id: r.id,
      kind: buying ? "buy" : "sell",
      cardIds: r.order_items.map((i) => i.listing_id),
      cardTitle: `${n} photocard${n === 1 ? "" : "s"}`,
      counterparty: (buying ? r.seller?.username : r.buyer?.username) ?? "collector",
      amount: (buying ? r.subtotal_cents - r.discount_cents + r.buyer_fee_cents : r.seller_payout_cents) / 100,
      fee: r.buyer_fee_cents / 100,
      status: s.status,
      step: s.step,
      shippingMethod: "domesticTracked",
      trackingNumber: r.tracking_number ?? "Awaiting label",
      createdAt: r.created_at,
      reviewed: false,
      groupId: "",
    });
  }
  return out;
}

export const isLiveId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

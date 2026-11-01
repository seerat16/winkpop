import { PHOTOCARDS } from "./photocards";
import type { Transaction } from "./types";

/**
 * Seed transaction history for the "track your cards in and out" view
 * (MVP feature #5: transaction tracking). A real backend would return the
 * authenticated user's actual records.
 */
export const TRANSACTIONS: Transaction[] = [
  {
    id: "txn-1",
    kind: "buy",
    cardId: PHOTOCARDS[2]?.id ?? "pc-3",
    cardTitle: PHOTOCARDS[2]?.title ?? "Photocard",
    counterpartyUsername: "seoul_swaps",
    amount: PHOTOCARDS[2]?.price ?? 12,
    status: "shipped",
    createdAt: "2026-10-18",
  },
  {
    id: "txn-2",
    kind: "sell",
    cardId: PHOTOCARDS[5]?.id ?? "pc-6",
    cardTitle: PHOTOCARDS[5]?.title ?? "Photocard",
    counterpartyUsername: "biasbinder",
    amount: PHOTOCARDS[5]?.price ?? 8,
    status: "completed",
    createdAt: "2026-10-10",
  },
  {
    id: "txn-3",
    kind: "trade",
    cardId: PHOTOCARDS[8]?.id ?? "pc-9",
    cardTitle: PHOTOCARDS[8]?.title ?? "Photocard",
    counterpartyUsername: "pcfairy",
    amount: 0,
    status: "pending",
    createdAt: "2026-10-28",
  },
  {
    id: "txn-4",
    kind: "buy",
    cardId: PHOTOCARDS[11]?.id ?? "pc-12",
    cardTitle: PHOTOCARDS[11]?.title ?? "Photocard",
    counterpartyUsername: "kpop_kiosk",
    amount: PHOTOCARDS[11]?.price ?? 20,
    status: "delivered",
    createdAt: "2026-10-05",
  },
];

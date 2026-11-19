import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight } from "lucide-react";
import { Chip, EmptyState } from "@/components/ui";
import { TRANSACTIONS } from "@/data/transactions";
import type { Transaction, TransactionKind, TransactionStatus } from "@/data/types";

type Filter = "all" | TransactionKind;

const STATUS_STYLE: Record<TransactionStatus, { bg: string; fg: string; label: string }> = {
  pending: { bg: "#FFF4E6", fg: "#D98A3D", label: "Pending" },
  paid: { bg: "#F3EDFB", fg: "#7C3AED", label: "Paid" },
  shipped: { bg: "#EDFAF5", fg: "#5CC0A8", label: "Shipped" },
  delivered: { bg: "#EDFAF5", fg: "#5CC0A8", label: "Delivered" },
  completed: { bg: "#EDFAF5", fg: "#2E8B6E", label: "Completed" },
  disputed: { bg: "#FDECEC", fg: "#D9534F", label: "Disputed" },
};

function KindIcon({ kind }: { kind: TransactionKind }) {
  if (kind === "buy") return <ArrowDownLeft size={16} color="#5CC0A8" />;
  if (kind === "sell") return <ArrowUpRight size={16} color="#D4759A" />;
  return <ArrowLeftRight size={16} color="#7C3AED" />;
}

export default function TransactionsScreen() {
  const [filter, setFilter] = useState<Filter>("all");
  const rows = useMemo(
    () => (filter === "all" ? TRANSACTIONS : TRANSACTIONS.filter((t) => t.kind === filter)),
    [filter],
  );

  return (
    <div className="px-4 pt-2">
      <h1 className="mb-4 font-display text-2xl font-extrabold text-wink-ink">Transactions</h1>
      <div className="mb-4 flex gap-2">
        <Chip label="All" active={filter === "all"} onClick={() => setFilter("all")} />
        <Chip label="Buying" active={filter === "buy"} onClick={() => setFilter("buy")} />
        <Chip label="Selling" active={filter === "sell"} onClick={() => setFilter("sell")} />
        <Chip label="Trades" active={filter === "trade"} onClick={() => setFilter("trade")} />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          emoji="📦"
          title="Nothing here yet"
          subtitle="Your buys, sells, and trades will appear here."
        />
      ) : (
        <div className="space-y-3">
          {rows.map((t) => (
            <TransactionRow key={t.id} txn={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function TransactionRow({ txn }: { txn: Transaction }) {
  const status = STATUS_STYLE[txn.status];
  return (
    <div className="flex items-center gap-3 rounded-card border border-wink-pink-border bg-white p-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-card bg-wink-purple-tint">
        <KindIcon kind={txn.kind} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-display font-bold text-wink-ink">{txn.cardTitle}</div>
        <div className="text-xs text-wink-muted">
          {txn.kind === "buy" ? "from" : txn.kind === "sell" ? "to" : "with"} @
          {txn.counterpartyUsername} · {txn.createdAt}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        {txn.kind !== "trade" ? (
          <span className="font-display font-bold text-wink-ink">${txn.amount.toFixed(2)}</span>
        ) : (
          <span className="font-display font-bold text-wink-purple">Trade</span>
        )}
        <span
          className="rounded-pill px-2 py-0.5 text-[10px]"
          style={{ background: status.bg, color: status.fg }}
        >
          {status.label}
        </span>
      </div>
    </div>
  );
}

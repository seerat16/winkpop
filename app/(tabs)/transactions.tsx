import { useMemo, useState } from "react";
import { View } from "react-native";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight } from "lucide-react-native";
import { Chip, EmptyState, Screen, Text } from "@/components";
import { TRANSACTIONS } from "@/data/transactions";
import type { Transaction, TransactionKind, TransactionStatus } from "@/data/types";
import { colors } from "@/theme/colors";

type Filter = "all" | TransactionKind;

const STATUS_STYLE: Record<TransactionStatus, { bg: string; fg: string; label: string }> = {
  pending: { bg: "#FFF4E6", fg: "#D98A3D", label: "Pending" },
  paid: { bg: colors.purpleTint, fg: colors.purple, label: "Paid" },
  shipped: { bg: colors.mintTint, fg: colors.mint, label: "Shipped" },
  delivered: { bg: colors.mintTint, fg: colors.mint, label: "Delivered" },
  completed: { bg: colors.mintTint, fg: "#2E8B6E", label: "Completed" },
  disputed: { bg: "#FDECEC", fg: "#D9534F", label: "Disputed" },
};

function KindIcon({ kind }: { kind: TransactionKind }) {
  if (kind === "buy") return <ArrowDownLeft size={16} color={colors.mint} />;
  if (kind === "sell") return <ArrowUpRight size={16} color={colors.pink} />;
  return <ArrowLeftRight size={16} color={colors.purple} />;
}

/** Transaction tracking (MVP feature #5): all cards going in and out. */
export default function TransactionsScreen() {
  const [filter, setFilter] = useState<Filter>("all");

  const rows = useMemo(
    () => (filter === "all" ? TRANSACTIONS : TRANSACTIONS.filter((t) => t.kind === filter)),
    [filter],
  );

  return (
    <Screen padded={false}>
      <View className="px-4 pt-2">
        <Text className="mb-4 font-display text-2xl text-wink-ink">Transactions</Text>
        <View className="mb-4 flex-row gap-2">
          <Chip label="All" active={filter === "all"} onPress={() => setFilter("all")} />
          <Chip label="Buying" active={filter === "buy"} onPress={() => setFilter("buy")} />
          <Chip label="Selling" active={filter === "sell"} onPress={() => setFilter("sell")} />
          <Chip label="Trades" active={filter === "trade"} onPress={() => setFilter("trade")} />
        </View>

        {rows.length === 0 ? (
          <EmptyState
            emoji="📦"
            title="Nothing here yet"
            subtitle="Your buys, sells, and trades will appear here."
          />
        ) : (
          <View className="gap-3">
            {rows.map((t) => (
              <TransactionRow key={t.id} txn={t} />
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}

function TransactionRow({ txn }: { txn: Transaction }) {
  const status = STATUS_STYLE[txn.status];
  return (
    <View className="flex-row items-center gap-3 rounded-card border border-wink-pink-border bg-white p-3">
      <View className="h-10 w-10 items-center justify-center rounded-card bg-wink-purple-tint">
        <KindIcon kind={txn.kind} />
      </View>
      <View className="flex-1">
        <Text className="font-display text-wink-ink" numberOfLines={1}>
          {txn.cardTitle}
        </Text>
        <Text className="text-xs text-wink-muted">
          {txn.kind === "buy" ? "from" : txn.kind === "sell" ? "to" : "with"} @
          {txn.counterpartyUsername} · {txn.createdAt}
        </Text>
      </View>
      <View className="items-end gap-1">
        {txn.kind !== "trade" ? (
          <Text className="font-display text-wink-ink">${txn.amount.toFixed(2)}</Text>
        ) : (
          <Text className="font-display text-wink-purple">Trade</Text>
        )}
        <View className="rounded-pill px-2 py-0.5" style={{ backgroundColor: status.bg }}>
          <Text style={{ color: status.fg, fontSize: 10 }}>{status.label}</Text>
        </View>
      </View>
    </View>
  );
}

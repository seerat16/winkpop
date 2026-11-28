import { useMemo, useState } from "react";
import { Pressable, TextInput, View } from "@/rn";
import { useLocalSearchParams, useRouter } from "@/rn/router";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button, Card, Chip, EmptyState, Page, Pill, Sheet, StatusPill, Text } from "@/components";
import { CATALOG_CATEGORIES, categoryForType, GROUPS, GROUP_MAP, type OrderStatus } from "@/data";
import { getAnyListing, useAppStore } from "@/data/appStore";
import { colors } from "@/theme/colors";
import { useLiveOrders } from "@/lib/useLiveOrders";

type Kind = "trade" | "sell" | "buy" | "all";
const LABEL: Record<Kind, string> = { trade: "Trades", sell: "Sales", buy: "Purchases", all: "All activity" };

/**
 * Tracking pages (§18A–F): summary card, description search, Group / Idol /
 * Category filters with active count, status filter, and per-item type,
 * status, card, partner, date and amount.
 */
export default function TrackingListScreen() {
  const params = useLocalSearchParams<{ kind?: Kind }>();
  const router = useRouter();
  const kind: Kind = params.kind ?? "all";
  const orders = useAppStore((s) => s.orders);
  useLiveOrders();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | OrderStatus>("all");
  const [groupId, setGroupId] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [filters, setFilters] = useState(false);

  const base = orders.filter((o) => kind === "all" || o.kind === kind);
  const rows = useMemo(
    () =>
      base
        .filter((o) => status === "all" || o.status === status)
        .filter((o) => !query || o.cardTitle.toLowerCase().includes(query.toLowerCase()))
        .filter((o) => {
          const c = getAnyListing(o.cardIds[0]);
          if (groupId && o.groupId !== groupId) return false;
          if (memberId && c?.memberId !== memberId) return false;
          if (category && c && categoryForType(c.type) !== category) return false;
          return true;
        })
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [base, status, query, groupId, memberId, category],
  );
  const activeFilters = [groupId, memberId, category].filter(Boolean).length;
  const total = base.reduce((s, o) => s + o.amount, 0);
  const completed = base.filter((o) => o.status === "completed").length;

  return (
    <Page title={LABEL[kind]}>
      <Card className="mb-3">
        {kind === "buy" ? (
          <Summary items={[["Total spent", `$${total.toFixed(2)}`], ["Purchases", base.length]]} />
        ) : kind === "all" ? (
          <Summary items={[["Card activity", base.length], ["In transit", base.filter((o) => o.status === "in_transit").length], ["Pending", base.filter((o) => o.status === "pending").length]]} />
        ) : (
          <Summary items={[["Total earned", `$${total.toFixed(2)}`], ["Transactions", base.length], ["Completed", completed]]} />
        )}
      </Card>
      <View className="mb-2 flex-row items-center gap-2">
        <View className="flex-1 flex-row items-center gap-2 rounded-card border border-wink-pink-border bg-white px-3 py-2">
          <Search size={14} color={colors.muted} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Search listing descriptions" placeholderTextColor={colors.muted} className="flex-1 text-sm text-wink-ink" />
        </View>
        <Pressable onPress={() => setFilters(true)} className="flex-row items-center gap-1 rounded-card border border-wink-pink-border bg-white px-3 py-2">
          <SlidersHorizontal size={14} color={colors.ink} />
          <Text className="text-xs">Filters{activeFilters ? ` (${activeFilters})` : ""}</Text>
        </Pressable>
      </View>
      <View className="mb-3 flex-row flex-wrap gap-2">
        {(["all", "delivered", "in_transit", "pending"] as const).map((s) => (
          <Chip key={s} label={s === "all" ? "All" : s === "in_transit" ? "In Transit" : s[0].toUpperCase() + s.slice(1)} active={status === s} onPress={() => setStatus(s)} />
        ))}
      </View>
      {rows.length === 0 ? <EmptyState emoji="📦" title={`No matching ${LABEL[kind].toLowerCase()}`} /> : null}
      {rows.map((o) => (
        <Pressable key={o.id} onPress={() => router.push(`/tracking/${o.id}`)} className="mb-3 rounded-card border border-wink-pink-border bg-white p-3">
          <View className="mb-1 flex-row items-center gap-1">
            <Pill label={o.kind === "buy" ? "Purchase" : o.kind === "sell" ? "Sale" : "Trade"} />
            <StatusPill status={o.status} />
          </View>
          <Text className="font-display text-wink-ink" numberOfLines={1}>
            {o.cardTitle}
          </Text>
          <View className="flex-row justify-between">
            <Text className="text-xs text-wink-muted">
              @{o.counterparty} · {o.createdAt.slice(0, 10)}
            </Text>
            <Text className="font-display text-sm" style={{ color: o.kind === "sell" ? colors.mint : o.kind === "buy" ? colors.pink : colors.purple }}>
              {o.kind === "trade" ? "Trade" : `${o.kind === "sell" ? "+" : "–"}$${o.amount.toFixed(2)}`}
            </Text>
          </View>
        </Pressable>
      ))}

      <Sheet visible={filters} onClose={() => setFilters(false)} title="Filters">
        <Text className="mb-2 font-display text-wink-ink">Group</Text>
        <View className="mb-4 flex-row flex-wrap gap-2">
          {GROUPS.map((g) => (
            <Chip key={g.id} label={g.name} active={groupId === g.id} onPress={() => { setGroupId(groupId === g.id ? null : g.id); setMemberId(null); }} />
          ))}
        </View>
        {groupId ? (
          <>
            <Text className="mb-2 font-display text-wink-ink">Idol</Text>
            <View className="mb-4 flex-row flex-wrap gap-2">
              {GROUP_MAP[groupId].members.map((m) => (
                <Chip key={m.id} label={m.name} active={memberId === m.id} onPress={() => setMemberId(memberId === m.id ? null : m.id)} />
              ))}
            </View>
          </>
        ) : null}
        <Text className="mb-2 font-display text-wink-ink">Category type</Text>
        <View className="mb-4 flex-row flex-wrap gap-2">
          {CATALOG_CATEGORIES.map((c) => (
            <Chip key={c} label={c} active={category === c} onPress={() => setCategory(category === c ? null : c)} />
          ))}
        </View>
        <Button title="Reset" variant="secondary" fullWidth onPress={() => { setGroupId(null); setMemberId(null); setCategory(null); }} />
      </Sheet>
    </Page>
  );
}

function Summary({ items }: { items: [string, string | number][] }) {
  return (
    <View className="flex-row justify-around">
      {items.map(([k, v]) => (
        <View key={k} className="items-center">
          <Text className="font-display text-lg text-wink-ink">{v}</Text>
          <Text className="text-xs text-wink-muted">{k}</Text>
        </View>
      ))}
    </View>
  );
}

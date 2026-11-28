import { View } from "@/rn";
import { Button, Card, Chip, Notice, Page, Pill, SectionTitle, Text } from "@/components";
import { GROUP_MAP } from "@/data";
import { getAnyListing, useAppStore } from "@/data/appStore";
import { useUserStore } from "@/data/userStore";
import { colors } from "@/theme/colors";

/**
 * Group orders (BARTER "Group orders & bulk selling"): claim cards without
 * paying until the GO confirms at the seller's threshold, sign up as a Group
 * Order Manager, and see one combined shipment in and out.
 */
export default function GroupOrdersScreen() {
  const me = useUserStore((s) => s.user?.username ?? "");
  const gos = useAppStore((s) => s.groupOrders);
  const claim = useAppStore((s) => s.claimGroupOrder);
  const becomeGom = useAppStore((s) => s.becomeGom);
  return (
    <Page title="Group orders">
      <Notice text="Claim cards now and only pay once the GO reaches its threshold. One combined shipment means cheaper per-card costs." />
      {gos.map((g) => {
        const claimed = Object.keys(g.claims).length;
        const pct = Math.round((claimed / g.cardIds.length) * 100);
        return (
          <Card key={g.id} className="mb-4">
            <View className="flex-row items-center justify-between">
              <Text className="flex-1 font-display text-wink-ink">{g.title}</Text>
              <Pill label={g.status === "confirmed" ? "Confirmed ✓" : `Closes ${g.deadline}`} color={g.status === "confirmed" ? "#2E8B6E" : colors.purple} bg={g.status === "confirmed" ? colors.mintTint : colors.purpleTint} />
            </View>
            <Text className="text-xs text-wink-muted">
              {GROUP_MAP[g.groupId]?.name} · bulk seller @{g.bulkSeller} · {g.gom ? `GOM @${g.gom}` : "needs a GOM"} · ${g.pricePerCard.toFixed(2)}/card
            </Text>
            <View className="mt-2 h-2 overflow-hidden rounded-full bg-wink-purple-tint">
              <View className="h-full bg-wink-pink" style={{ width: `${pct}%` }} />
            </View>
            <Text className="mt-1 text-xs text-wink-muted">
              {claimed}/{g.cardIds.length} claimed ({pct}%) · confirms at {g.thresholdPct}%
            </Text>
            <SectionTitle title="Claim cards" />
            <View className="flex-row flex-wrap gap-2">
              {g.cardIds.map((cid) => {
                const c = getAnyListing(cid);
                const by = g.claims[cid];
                return (
                  <Chip
                    key={cid}
                    label={`${c?.memberName ?? "Card"}${by ? (by === me ? " (you)" : ` · @${by}`) : ""}`}
                    active={by === me}
                    onPress={() => (!by || by === me ? claim(g.id, cid) : undefined)}
                  />
                );
              })}
            </View>
            {!g.gom ? (
              <View className="mt-3">
                <Button size="sm" variant="secondary" title="Host as GOM" onPress={() => becomeGom(g.id)} />
              </View>
            ) : null}
          </Card>
        );
      })}
    </Page>
  );
}

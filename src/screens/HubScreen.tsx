import { Pressable, View } from "@/rn";
import { useRouter } from "@/rn/router";
import { Heart, Search, ShoppingCart } from "lucide-react";
import { Button, Card, ListingGrid, Page, SectionTitle, Text } from "@/components";
import { getPriceStats } from "@/data";
import { allListings } from "@/data/appStore";
import { useUserStore } from "@/data/userStore";
import { colors } from "@/theme/colors";

/** Sales hub (§7AA): shortcuts to Likes and Cart plus recent deals under market price. */
export default function SalesHubScreen() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const deals = allListings()
    .filter((l) => l.available && l.intent !== "trade")
    .map((l) => ({ l, avg: getPriceStats(l.id)?.avg ?? l.price }))
    .filter((x) => x.l.price < x.avg * 0.92)
    .sort((a, b) => a.l.price / a.avg - b.l.price / b.avg)
    .slice(0, 12)
    .map((x) => x.l);
  return (
    <Page title="Sales hub">
      <View className="flex-row gap-3">
        <Shortcut label={`Likes (${user?.likesIds.length ?? 0})`} icon={<Heart size={20} color={colors.pink} />} onPress={() => router.push("/likes")} />
        <Shortcut label={`Cart (${user?.cartIds.length ?? 0})`} icon={<ShoppingCart size={20} color={colors.mint} />} onPress={() => router.push("/cart")} />
      </View>
      <View className="mt-3">
        <Button title="Browse Photocards" fullWidth icon={<Search size={16} color={colors.white} />} onPress={() => router.push("/(tabs)/browse")} />
      </View>
      <SectionTitle title="Recent deals · below average sold price" />
      <ListingGrid cards={deals} />
    </Page>
  );
}

function Shortcut({ label, icon, onPress }: { label: string; icon: React.ReactNode; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="flex-1">
      <Card className="items-center">
        {icon}
        <Text className="mt-1 font-display text-wink-ink">{label}</Text>
      </Card>
    </Pressable>
  );
}

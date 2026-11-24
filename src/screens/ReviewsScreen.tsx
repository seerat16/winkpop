import { useState } from "react";
import { View } from "@/rn";
import { useLocalSearchParams } from "@/rn/router";
import { BadgesRow, Card, Chip, EmptyState, Page, Stars, Text } from "@/components";
import { computeBadges, getCommunityUser, getReviews, summarizeReviews } from "@/data";
import { useAppStore } from "@/data/appStore";
import { useUserStore } from "@/data/userStore";

/** Reviews page (§21A, §21F–G, §21K): average, total, star breakdown, filter by stars. */
export default function ReviewsScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const me = useUserStore((s) => s.user);
  const written = useAppStore((s) => s.reviewsWritten);
  const [stars, setStars] = useState<number | null>(null);
  const [role, setRole] = useState<"all" | "purchase" | "sale" | "trade">("all");
  const all = getReviews(username ?? "", written);
  const summary = summarizeReviews(all);
  const u = getCommunityUser(username ?? "");
  const badges = u
    ? computeBadges({ ...u, averageRating: summary.average })
    : me
      ? computeBadges({ completedTransactions: me.completedTransactions, memberSince: me.memberSince, averageRating: summary.average })
      : [];
  const shown = all.filter((r) => (stars ? r.stars === stars : true) && (role === "all" || r.role === role));

  return (
    <Page title={`Reviews · @${username}`}>
      <Card>
        <View className="flex-row items-center gap-4">
          <View className="items-center">
            <Text className="font-display text-3xl text-wink-ink">{summary.average.toFixed(1)}</Text>
            <Stars value={summary.average} />
            <Text className="text-xs text-wink-muted">{summary.count} reviews</Text>
          </View>
          <View className="flex-1">
            {[5, 4, 3, 2, 1].map((s) => (
              <View key={s} className="flex-row items-center gap-2">
                <Text className="w-3 text-xs text-wink-muted">{s}</Text>
                <View className="h-2 flex-1 overflow-hidden rounded-full bg-wink-purple-tint">
                  <View className="h-full bg-wink-warn" style={{ width: `${summary.count ? (summary.breakdown[s - 1] / summary.count) * 100 : 0}%` }} />
                </View>
                <Text className="w-6 text-right text-xs text-wink-muted">{summary.breakdown[s - 1]}</Text>
              </View>
            ))}
          </View>
        </View>
        <BadgesRow badges={badges} />
      </Card>
      <View className="my-3 flex-row flex-wrap gap-2">
        <Chip label="All stars" active={stars === null} onPress={() => setStars(null)} />
        {[5, 4, 3, 2, 1].map((s) => (
          <Chip key={s} label={`${s}★`} active={stars === s} onPress={() => setStars(s)} />
        ))}
      </View>
      <View className="mb-3 flex-row flex-wrap gap-2">
        {(["all", "purchase", "sale", "trade"] as const).map((r) => (
          <Chip key={r} label={r === "all" ? "All" : r === "purchase" ? "As buyer" : r === "sale" ? "As seller" : "Trades"} active={role === r} onPress={() => setRole(r)} />
        ))}
      </View>
      {shown.length === 0 ? <EmptyState emoji="⭐" title="No reviews match" /> : null}
      {shown.map((r) => (
        <Card key={r.id} className="mb-2">
          <View className="flex-row items-center justify-between">
            <Text className="font-display text-sm text-wink-ink">
              @{r.reviewer} <Text className="text-xs text-wink-muted">· {r.reviewerCountry}</Text>
            </Text>
            <Stars value={r.stars} size={11} />
          </View>
          <Text className="text-xs text-wink-muted">
            {r.cardTitle} · {r.date}
            {r.auto ? " · auto-review" : ""}
          </Text>
          <Text className="mt-1 text-sm text-wink-ink">{r.text}</Text>
          {r.tags.length ? <Text className="mt-1 text-xs text-wink-purple">{r.tags.join(" · ")}</Text> : null}
        </Card>
      ))}
    </Page>
  );
}

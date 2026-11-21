import { useMemo, useState } from "react";
import { Linking, Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { Bell, Columns2, Columns3, Database, Heart, Rows3, Search, ShoppingCart, Users } from "lucide-react-native";
import {
  Chip,
  EmptyState,
  HorizontalCards,
  ListingGrid,
  Logo,
  PostCard,
  Screen,
  StoriesRow,
  Text,
} from "@/components";
import {
  DISCORD_URL,
  GROUP_MAP,
  findWishlistMatches,
  getCommunityUser,
  recommend,
  searchPhotocards,
} from "@/data";
import { allListings, getAnyListing, useAppStore } from "@/data/appStore";
import { useUserStore } from "@/data/userStore";
import { colors } from "@/theme/colors";

type Feed = "suggested" | "new" | "following";

/**
 * Discover (§4): stories, Suggested / New Drops / Following feeds, 1–3 cards
 * per row (remembered), domestic vs. global scope, recently viewed, wishlist
 * matches, new releases and a link to the WinKPop community Discord.
 */
export default function HomeScreen() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const updateUser = useUserStore((s) => s.updateUser);
  const listingsState = useAppStore((s) => s.listings);
  const soldIds = useAppStore((s) => s.soldIds);
  const posts = useAppStore((s) => s.posts);
  const wishlists = useAppStore((s) => s.wishlists);
  const unreadNotifs = useAppStore((s) => s.notifications.filter((n) => !n.read).length);
  const [feed, setFeed] = useState<Feed>("suggested");

  const listings = useMemo(() => allListings({ listings: listingsState, soldIds }), [listingsState, soldIds]);
  const columns = user?.listingsPerRow ?? 2;
  const scope = user?.feedScope ?? "global";

  const scoped = useMemo(() => {
    if (!user || scope === "global") return listings.filter((l) => !user?.blocked.includes(l.sellerUsername));
    return listings.filter((l) => {
      const seller = getCommunityUser(l.sellerUsername);
      return !user.blocked.includes(l.sellerUsername) && (!seller || seller.country === user.country);
    });
  }, [listings, scope, user]);

  const cards = useMemo(() => {
    if (!user) return [];
    if (feed === "new") return searchPhotocards(scoped, { sort: "new" }).slice(0, 24);
    if (feed === "following") return scoped.filter((l) => user.following.includes(l.sellerUsername)).slice(0, 24);
    return recommend(user, scoped, 24);
  }, [feed, scoped, user]);

  const followingPosts = useMemo(
    () => posts.filter((p) => !p.archived && user?.following.includes(p.author)).slice(0, 5),
    [posts, user?.following],
  );
  const matches = useMemo(() => findWishlistMatches(wishlists, scoped).slice(0, 8), [wishlists, scoped]);
  const recent = (user?.recentlyViewedIds ?? []).map(getAnyListing).filter((c): c is NonNullable<typeof c> => Boolean(c));
  const newReleases = useMemo(() => scoped.filter((l) => isNewEra(l.groupId, l.era)).slice(0, 10), [scoped]);

  const cartCount = user?.cartIds.length ?? 0;

  return (
    <Screen padded={false}>
      <View className="px-4 pt-2">
        {/* header */}
        <View className="mb-3 flex-row items-center justify-between">
          <Logo size={40} showWordmark={false} />
          <View className="flex-row items-center gap-4">
            <Pressable testID="notifications" accessibilityLabel="Notifications" onPress={() => router.push("/notifications")} hitSlop={8}>
              <Bell size={21} color={colors.muted} />
              {unreadNotifs > 0 ? <Badge n={unreadNotifs} /> : null}
            </Pressable>
            <Pressable accessibilityLabel="Liked listings" onPress={() => router.push("/likes")} hitSlop={8}>
              <Heart size={21} color={colors.muted} />
            </Pressable>
            <Pressable
              testID="cart"
              accessibilityRole="button"
              accessibilityLabel="cart"
              onPress={() => router.push("/cart")}
              className="relative"
              hitSlop={8}
            >
              <ShoppingCart size={21} color={colors.muted} />
              {cartCount > 0 ? <Badge n={cartCount} /> : null}
            </Pressable>
          </View>
        </View>

        <StoriesRow />

        {/* search entry */}
        <Pressable
          onPress={() => router.push("/(tabs)/browse")}
          className="mb-3 flex-row items-center gap-3 rounded-card border border-wink-pink-border bg-white px-4 py-3"
        >
          <Search size={15} color={colors.muted} />
          <Text className="text-sm text-wink-muted">Search your favorite photocards…</Text>
        </Pressable>

        {/* quick links */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
          <View className="flex-row gap-2">
            <QuickLink label="Browse" onPress={() => router.push("/(tabs)/browse")} icon={<Search size={14} color={colors.pink} />} />
            <QuickLink label="Database" onPress={() => router.push("/database")} icon={<Database size={14} color={colors.pink} />} />
            <QuickLink label="Community" onPress={() => router.push("/community")} icon={<Users size={14} color={colors.pink} />} />
            <QuickLink label="Group orders" onPress={() => router.push("/group-orders")} />
            <QuickLink label="Sales hub" onPress={() => router.push("/hub")} />
            <QuickLink label="Join our Discord 💜" onPress={() => Linking.openURL(DISCORD_URL)} />
          </View>
        </ScrollView>

        {/* wishlist matches */}
        {matches.length ? (
          <Pressable onPress={() => router.push("/wishlists")} className="mb-3 rounded-card bg-wink-mint-tint px-4 py-3">
            <Text className="font-display text-sm" style={{ color: "#2E8B6E" }}>
              ✨ {matches.length} listing{matches.length > 1 ? "s" : ""} match your wishlists
            </Text>
          </Pressable>
        ) : null}

        {/* feed tabs + layout controls */}
        <View className="mb-3 flex-row items-center gap-2">
          <Chip label="Suggested" active={feed === "suggested"} onPress={() => setFeed("suggested")} />
          <Chip label="New Drops" active={feed === "new"} onPress={() => setFeed("new")} />
          <Chip label="Following" active={feed === "following"} onPress={() => setFeed("following")} />
          <View className="flex-1" />
          {([1, 2, 3] as const).map((n) => {
            const Icon = n === 1 ? Rows3 : n === 2 ? Columns2 : Columns3;
            return (
              <Pressable
                key={n}
                accessibilityLabel={`${n} per row`}
                accessibilityState={{ selected: columns === n }}
                onPress={() => updateUser({ listingsPerRow: n })}
                hitSlop={4}
              >
                <Icon size={18} color={columns === n ? colors.pink : colors.muted} />
              </Pressable>
            );
          })}
        </View>
        <View className="mb-3 flex-row gap-2">
          <Chip label="🌍 Global" active={scope === "global"} onPress={() => updateUser({ feedScope: "global" })} />
          <Chip label={`🏠 Domestic (${user?.country ?? "US"})`} active={scope === "domestic"} onPress={() => updateUser({ feedScope: "domestic" })} />
        </View>

        {feed === "following" && followingPosts.length ? (
          <View className="mb-2">
            {followingPosts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </View>
        ) : null}

        {cards.length === 0 ? (
          feed === "following" ? (
            <View>
              <EmptyState emoji="👀" title="Your Following feed is empty" subtitle="Follow collectors to see their latest listings here." />
              <Pressable onPress={() => router.push("/community?tab=collectors")} className="items-center">
                <Text className="font-display text-wink-pink">Browse collectors →</Text>
              </Pressable>
            </View>
          ) : (
            <EmptyState title="Nothing here yet" subtitle="Try switching to Global." />
          )
        ) : (
          <ListingGrid cards={cards} columns={columns} />
        )}

        {/* new releases */}
        {newReleases.length ? (
          <>
            <Text className="mb-2 mt-4 font-display text-wink-ink">New releases</Text>
            <HorizontalCards ids={newReleases.map((c) => c.id)} />
          </>
        ) : null}

        {/* recently viewed */}
        {recent.length ? (
          <>
            <Text className="mb-2 mt-4 font-display text-wink-ink">Recently viewed</Text>
            <HorizontalCards ids={recent.map((c) => c.id)} />
          </>
        ) : null}
      </View>
    </Screen>
  );
}

function isNewEra(groupId: string, era: string) {
  return GROUP_MAP[groupId]?.eras[0] === era;
}

function Badge({ n }: { n: number }) {
  return (
    <View className="absolute -right-2 -top-2 h-4 min-w-4 items-center justify-center rounded-full bg-wink-pink px-1">
      <Text className="font-display text-white" style={{ fontSize: 9 }}>
        {n}
      </Text>
    </View>
  );
}

function QuickLink({ label, onPress, icon }: { label: string; onPress: () => void; icon?: React.ReactNode }) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-1.5 rounded-pill border border-wink-pink-border bg-white px-3 py-1.5">
      {icon}
      <Text className="text-xs text-wink-ink">{label}</Text>
    </Pressable>
  );
}

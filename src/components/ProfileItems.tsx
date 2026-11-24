import { useMemo, useState } from "react";
import { Linking, Pressable, TextInput, View } from "@/rn";
import { useRouter } from "@/rn/router";
import { Heart, Layers, Link2, Plus, Search } from "lucide-react";
import type { Photocard, Post } from "@/data";
import { EMPTY } from "@/data/appStore";
import { useUserStore } from "@/data/userStore";
import { colors } from "@/theme/colors";
import { Chip } from "./ui";
import { intentLabel } from "@/lib/format";
import { PhotocardImage } from "./PhotocardImage";
import { Text } from "./Text";
import { Pill, Tabs } from "./primitives";

type Feed = "posts" | "listings" | "all";
type ItemFilter = "all" | "trade" | "sale" | "available";
type Sort = "date" | "price_asc" | "price_desc" | "group" | "sold";

/**
 * Posts / Listings / All feed on a profile (§23H–J, §23U, §23AA–BB): search,
 * filter by for trade / for sale / available, sort, post-type badges, link
 * icons, slide counts, like buttons, and a "+" tile on your own profile.
 */
export function ProfileItems({ posts, listings, own }: { posts: Post[]; listings: Photocard[]; own: boolean }) {
  const router = useRouter();
  const likes = useUserStore((s) => s.user?.likesIds ?? EMPTY);
  const toggleLike = useUserStore((s) => s.toggleLike);
  const [feed, setFeed] = useState<Feed>("posts");
  const [filter, setFilter] = useState<ItemFilter>("all");
  const [sort, setSort] = useState<Sort>("date");
  const [query, setQuery] = useState("");

  const shownListings = useMemo(() => {
    const q = query.trim().toLowerCase();
    let l = listings.filter((c) => !q || c.title.toLowerCase().includes(q));
    if (filter === "trade") l = l.filter((c) => c.intent !== "sale");
    if (filter === "sale") l = l.filter((c) => c.intent !== "trade");
    if (filter === "available") l = l.filter((c) => c.available);
    const sorted = [...l];
    if (sort === "price_asc") sorted.sort((a, b) => a.price - b.price);
    if (sort === "price_desc") sorted.sort((a, b) => b.price - a.price);
    if (sort === "group") sorted.sort((a, b) => a.groupName.localeCompare(b.groupName));
    if (sort === "sold") sorted.sort((a, b) => Number(a.available) - Number(b.available));
    return sorted;
  }, [listings, query, filter, sort]);
  const shownPosts = posts.filter((p) => !query || p.caption.toLowerCase().includes(query.toLowerCase()));

  const tiles: ({ kind: "post"; post: Post } | { kind: "listing"; card: Photocard })[] =
    feed === "posts"
      ? shownPosts.map((post) => ({ kind: "post" as const, post }))
      : feed === "listings"
        ? shownListings.map((card) => ({ kind: "listing" as const, card }))
        : [...shownPosts.map((post) => ({ kind: "post" as const, post })), ...shownListings.map((card) => ({ kind: "listing" as const, card }))];

  return (
    <View className="mt-4">
      <Tabs
        value={feed}
        onChange={setFeed}
        tabs={[
          { key: "posts", label: "Posts", count: posts.length },
          { key: "listings", label: "Listings", count: listings.length },
          { key: "all", label: "All" },
        ]}
      />
      <View className="mb-2 flex-row items-center gap-2 rounded-card border border-wink-pink-border bg-white px-3 py-2">
        <Search size={14} color={colors.muted} />
        <TextInput value={query} onChangeText={setQuery} placeholder="Search by title" placeholderTextColor={colors.muted} className="flex-1 text-sm text-wink-ink" />
      </View>
      {feed !== "posts" ? (
        <View className="mb-2 flex-row flex-wrap gap-2">
          {(["all", "trade", "sale", "available"] as const).map((f) => (
            <Chip key={f} label={f === "all" ? "All" : f === "trade" ? "For trade" : f === "sale" ? "For sale" : "Available"} active={filter === f} onPress={() => setFilter(f)} />
          ))}
          <Chip
            label={`Sort: ${{ date: "Date", price_asc: "Price ↑", price_desc: "Price ↓", group: "Group", sold: "Sold" }[sort]}`}
            onPress={() => setSort(({ date: "price_asc", price_asc: "price_desc", price_desc: "group", group: "sold", sold: "date" } as const)[sort])}
          />
        </View>
      ) : null}

      <View className="flex-row flex-wrap gap-1">
        {own ? (
          <Pressable
            accessibilityLabel={feed === "posts" ? "New post" : "New listing"}
            onPress={() => router.push(feed === "posts" ? "/post/new" : "/listing/new")}
            className="aspect-[3/4] w-[32.5%] items-center justify-center rounded-card border-2 border-dashed border-wink-pink-border bg-white"
          >
            <Plus size={24} color={colors.muted} />
          </Pressable>
        ) : null}
        {tiles.map((t) =>
          t.kind === "post" ? (
            <Pressable
              key={t.post.id}
              onPress={() => (t.post.link && t.post.media.length === 0 ? Linking.openURL(t.post.link) : router.push(`/post/${t.post.id}`))}
              className="w-[32.5%]"
            >
              <PhotocardImage groupId={t.post.groupTags[0]?.groupId ?? "ive"} memberName={t.post.type.slice(0, 3)} imgSeed={t.post.media[0]?.seed ?? 1} />
              <View className="absolute left-1 top-1">
                <Pill label={t.post.type} color={colors.white} bg="rgba(0,0,0,0.45)" />
              </View>
              <View className="absolute right-1 top-1 flex-row gap-1">
                {t.post.link ? <Link2 size={12} color={colors.white} /> : null}
                {t.post.media.length > 1 ? <Layers size={12} color={colors.white} /> : null}
              </View>
              <Text className="mt-0.5 text-wink-muted" style={{ fontSize: 9 }} numberOfLines={1}>
                {t.post.caption}
              </Text>
            </Pressable>
          ) : (
            <Pressable key={t.card.id} onPress={() => router.push(`/card/${t.card.id}`)} className="w-[32.5%]" style={{ opacity: t.card.available ? 1 : 0.55 }}>
              <PhotocardImage groupId={t.card.groupId} memberName={t.card.memberName} imgSeed={t.card.imgSeed} />
              <View className="absolute left-1 top-1">
                <Pill label={t.card.available ? intentLabel(t.card.intent) : "SOLD"} color={colors.white} bg="rgba(0,0,0,0.45)" />
              </View>
              <Pressable
                accessibilityLabel={likes.includes(t.card.id) ? "Unlike" : "Like"}
                onPress={() => toggleLike(t.card.id)}
                className="absolute right-1 top-1 h-6 w-6 items-center justify-center rounded-full bg-white/90"
              >
                <Heart size={11} color={likes.includes(t.card.id) ? colors.pink : colors.muted} fill={likes.includes(t.card.id) ? colors.pink : "none"} />
              </Pressable>
              <Text className="mt-0.5 font-display text-wink-ink" style={{ fontSize: 11 }}>
                {t.card.intent === "trade" ? "Trade" : `$${t.card.price.toFixed(2)}`}
              </Text>
            </Pressable>
          ),
        )}
      </View>
      {tiles.length === 0 && !own ? <Text className="py-6 text-center text-sm text-wink-muted">Nothing here yet.</Text> : null}
    </View>
  );
}

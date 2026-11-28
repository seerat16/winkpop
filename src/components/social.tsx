import { Pressable, ScrollView, View } from "@/rn";
import { useRouter } from "@/rn/router";
import { Bookmark, Heart, Layers, Link2, MessageCircle, Plus, Send } from "lucide-react";
import { getCommunityUser, GROUP_MAP, type Photocard, type Post } from "@/data";
import { getAnyListing } from "@/data/appStore";
import { useAppStore } from "@/data/appStore";
import { useUserStore } from "@/data/userStore";
import { colors } from "@/theme/colors";
import { PhotocardImage } from "./PhotocardImage";
import { PhotocardTile } from "./PhotocardTile";
import { Text } from "./Text";
import { Avatar, Pill, Verified } from "./primitives";
import { avatarColorFor, timeAgo } from "@/lib/format";


/** Stories row with "Your story" bubble (§14R) and unseen rings (§14U). */
export function StoriesRow() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const stories = useAppStore((s) => s.stories);
  if (!user) return null;
  const live = stories.filter((s) => !s.archived && Date.now() - new Date(s.createdAt).getTime() < 24 * 3600e3);
  const visible = live.filter((s) => !s.hiddenFrom.includes(user.username) && !user.blocked.includes(s.author));
  const authors = [...new Set(visible.map((s) => s.author))].filter((a) => a !== user.username);
  const mine = visible.filter((s) => s.author === user.username);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
      <View className="flex-row gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Your story"
          onPress={() => router.push(mine.length ? `/story/${user.username}` : "/story/new")}
          className="items-center"
        >
          <View>
            <Avatar name={user.displayName} color={user.avatarColor} size={56} ring={mine.length ? colors.pink : undefined} />
            <View className="absolute -bottom-0.5 -right-0.5 h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-wink-pink">
              <Plus size={11} color={colors.white} />
            </View>
          </View>
          <Text className="mt-1 text-wink-ink" style={{ fontSize: 10 }}>
            Your story
          </Text>
        </Pressable>
        {authors.map((a) => {
          const seen = visible.filter((s) => s.author === a).every((s) => s.viewers.includes(user.username));
          return (
            <Pressable key={a} accessibilityLabel={`${a} story`} onPress={() => router.push(`/story/${a}`)} className="items-center">
              <Avatar name={a} color={avatarColorFor(a)} size={56} ring={seen ? "#ddd" : colors.pink} />
              <Text className="mt-1 text-wink-ink" style={{ fontSize: 10 }} numberOfLines={1}>
                {a}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

/** Grid of listings honouring the 1/2/3-per-row preference (§4Q). */
export function ListingGrid({ cards, columns = 2 }: { cards: Photocard[]; columns?: 1 | 2 | 3 }) {
  const width = columns === 1 ? "100%" : columns === 2 ? "48.5%" : "31.5%";
  return (
    <View className="flex-row flex-wrap justify-between">
      {cards.map((card) => (
        <View key={card.id} className="mb-3" style={{ width }}>
          <PhotocardTile card={card} compact={columns === 3} />
        </View>
      ))}
      {columns === 3 && cards.length % 3 === 2 ? <View style={{ width }} /> : null}
    </View>
  );
}

/** Feed post card with like / comment / save / share (§15D, §15N). */
export function PostCard({ post }: { post: Post }) {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const toggleLike = useAppStore((s) => s.toggleLikePost);
  const toggleSave = useAppStore((s) => s.toggleSavePost);
  const me = user?.username ?? "";
  const liked = post.likes.includes(me);
  const saved = post.savedBy.includes(me);
  const author = getCommunityUser(post.author);
  const followedLiker = post.likes.find((l) => user?.following.includes(l));

  return (
    <View className="mb-4 overflow-hidden rounded-card border border-wink-pink-border bg-white">
      <Pressable onPress={() => router.push(`/user/${post.author}`)} className="flex-row items-center gap-2 p-3">
        <Avatar name={post.author} color={avatarColorFor(post.author)} size={32} />
        <View className="flex-1">
          <View className="flex-row items-center gap-1">
            <Text className="font-display text-sm text-wink-ink">{post.author}</Text>
            {author?.verified ? <Verified size={12} /> : null}
            {post.collabWith ? <Text className="text-xs text-wink-muted">& {post.collabWith}</Text> : null}
          </View>
          <Text className="text-wink-muted" style={{ fontSize: 10 }}>
            {post.location ? `${post.location} · ` : ""}
            {timeAgo(post.createdAt)}
          </Text>
        </View>
        <Pill label={post.type} />
      </Pressable>
      <Pressable onPress={() => router.push(`/post/${post.id}`)} accessibilityLabel="Open post">
        <View className="relative">
          <PhotocardImage
            groupId={post.groupTags[0]?.groupId ?? "ive"}
            memberName={post.type}
            imgSeed={post.media[0]?.seed ?? 1}
            aspectRatio={1}
            rounded={false}
          />
          {post.media.length > 1 ? (
            <View className="absolute right-2 top-2 flex-row items-center gap-1 rounded-pill bg-black/50 px-2 py-0.5">
              <Layers size={10} color={colors.white} />
              <Text className="text-white" style={{ fontSize: 10 }}>
                1/{post.media.length}
              </Text>
            </View>
          ) : null}
          {post.link ? (
            <View className="absolute left-2 top-2 rounded-full bg-white/90 p-1">
              <Link2 size={12} color={colors.ink} />
            </View>
          ) : null}
        </View>
      </Pressable>
      <View className="flex-row items-center gap-4 px-3 pt-3">
        <Pressable accessibilityLabel={liked ? "Unlike post" : "Like post"} onPress={() => toggleLike(post.id)} hitSlop={6}>
          <Heart size={20} color={liked ? colors.pink : colors.ink} fill={liked ? colors.pink : "none"} />
        </Pressable>
        {!post.commentsOff ? (
          <Pressable accessibilityLabel="Comments" onPress={() => router.push(`/post/${post.id}`)} hitSlop={6}>
            <MessageCircle size={20} color={colors.ink} />
          </Pressable>
        ) : null}
        <Pressable accessibilityLabel="Share post" onPress={() => router.push(`/share?kind=post&id=${post.id}`)} hitSlop={6}>
          <Send size={19} color={colors.ink} />
        </Pressable>
        <View className="flex-1" />
        <Pressable accessibilityLabel={saved ? "Unsave post" : "Save post"} onPress={() => toggleSave(post.id)} hitSlop={6}>
          <Bookmark size={20} color={saved ? colors.purple : colors.ink} fill={saved ? colors.purple : "none"} />
        </Pressable>
      </View>
      <View className="px-3 pb-3 pt-2">
        {!post.hideLikes ? (
          <Text className="font-display text-sm text-wink-ink">
            {post.likes.length} like{post.likes.length === 1 ? "" : "s"}
            {followedLiker ? <Text className="text-xs text-wink-muted"> · liked by {followedLiker}</Text> : null}
          </Text>
        ) : null}
        <Text className="mt-1 text-sm text-wink-ink" numberOfLines={3}>
          <Text className="font-display">{post.author} </Text>
          {post.caption}
        </Text>
        <View className="mt-1 flex-row flex-wrap gap-1">
          {post.groupTags.map((g) => (
            <Pill key={g.groupId} label={GROUP_MAP[g.groupId]?.name ?? g.groupId} color={colors.pink} bg={colors.pinkTint} />
          ))}
        </View>
        {post.comments.length && !post.commentsOff ? (
          <Pressable onPress={() => router.push(`/post/${post.id}`)}>
            <Text className="mt-1 text-xs text-wink-muted">View all {post.comments.length} comments</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

/** A user row with follow button, used by followers / search / share lists. */
export function UserRow({ username, right, onPress }: { username: string; right?: React.ReactNode; onPress?: () => void }) {
  const router = useRouter();
  const u = getCommunityUser(username);
  return (
    <Pressable
      onPress={onPress ?? (() => router.push(`/user/${username}`))}
      className="flex-row items-center gap-3 border-b border-wink-pink-border py-3"
    >
      <Avatar name={username} color={avatarColorFor(username)} size={40} />
      <View className="flex-1">
        <View className="flex-row items-center gap-1">
          <Text className="font-display text-wink-ink">{username}</Text>
          {u?.verified ? <Verified size={12} /> : null}
        </View>
        <Text className="text-xs text-wink-muted" numberOfLines={1}>
          {u?.displayName ?? ""} {u ? `· ${u.location}` : ""}
        </Text>
      </View>
      {right}
    </Pressable>
  );
}

/** Horizontal strip of small listing thumbnails (new releases, recently viewed, similar). */
export function HorizontalCards({ ids }: { ids: string[] }) {
  const router = useRouter();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View className="flex-row gap-2">
        {ids.map((id) => {
          const c = getAnyListing(id);
          if (!c) return null;
          return (
            <Pressable key={id} onPress={() => router.push(`/card/${id}`)} className="w-24">
              <PhotocardImage groupId={c.groupId} memberName={c.memberName} imgSeed={c.imgSeed} />
              <Text className="mt-1 text-wink-ink" style={{ fontSize: 10 }} numberOfLines={1}>
                {c.memberName} · {c.era}
              </Text>
              <Text className="font-display text-wink-ink" style={{ fontSize: 11 }}>
                ${c.price.toFixed(2)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}



/** Coloured status badge for orders, trades and offers. */
export function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    pending: { bg: "#FFF4E6", fg: "#D98A3D", label: "Pending" },
    accepted: { bg: colors.purpleTint, fg: colors.purple, label: "Accepted" },
    declined: { bg: "#FDECEC", fg: "#D9534F", label: "Declined" },
    shipped: { bg: colors.mintTint, fg: colors.mint, label: "Shipped" },
    in_transit: { bg: colors.mintTint, fg: colors.mint, label: "In transit" },
    delivered: { bg: colors.mintTint, fg: colors.mint, label: "Delivered" },
    completed: { bg: colors.mintTint, fg: "#2E8B6E", label: "Completed" },
    cancelled: { bg: "#FDECEC", fg: "#D9534F", label: "Cancelled" },
  };
  const s = map[status] ?? map.pending;
  return <Pill label={s.label} color={s.fg} bg={s.bg} />;
}

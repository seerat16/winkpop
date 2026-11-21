import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Camera, Info, MessageCircle, Pencil, Search, Settings, Star, Truck, Wallet } from "lucide-react-native";
import {
  Avatar,
  BadgesRow,
  BioText,
  HighlightsRow,
  MenuItem,
  Pill,
  ProfileItems,
  Screen,
  Sheet,
  SocialLinks,
  Stars,
  Text,
  Verified,
} from "@/components";
import {
  AVAILABILITY_LABELS,
  computeBadges,
  getReviews,
  GROUP_MAP,
  shippingSummary,
  summarizeReviews,
} from "@/data";
import { useAppStore } from "@/data/appStore";
import { useUserStore } from "@/data/userStore";
import { colors } from "@/theme/colors";

const AVATAR_COLORS = ["#C9A8E0", "#E880A4", "#7BBFEA", "#5CC0A8", "#F4C06B", "#8E7CC3"];

/**
 * Your profile (§23): header icons (shipping, messages, edit), photo + story
 * options, location / shipping / international badges, rating → reviews,
 * followers / following, bio + About/Rules + links, highlights, Currently
 * Collecting, shortcuts (collection, wishlist, ISO, info) and the Posts /
 * Listings / All feed.
 */
export default function ProfileScreen() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const updateUser = useUserStore((s) => s.updateUser);
  const posts = useAppStore((s) => s.posts);
  const listings = useAppStore((s) => s.listings);
  const stories = useAppStore((s) => s.stories);
  const highlights = useAppStore((s) => s.highlights);
  const reviewsWritten = useAppStore((s) => s.reviewsWritten);
  const deleteStory = useAppStore((s) => s.deleteStory);
  const [storySheet, setStorySheet] = useState(false);
  const [photoSheet, setPhotoSheet] = useState(false);

  const mine = useMemo(() => {
    if (!user) return { posts: [], listings: [] };
    return {
      posts: posts.filter((p) => (p.author === user.username || p.collabWith === user.username) && !p.archived),
      listings: listings.filter((l) => l.sellerUsername === user.username),
    };
  }, [posts, listings, user]);

  if (!user) return null;

  const reviews = summarizeReviews(getReviews(user.username, reviewsWritten));
  const rating = reviews.count ? reviews.average : user.rating;
  const badges = computeBadges({ completedTransactions: user.completedTransactions, memberSince: user.memberSince, proofs: 40, avgShipDays: 2, averageRating: rating });
  const myStories = stories.filter((s) => s.author === user.username && !s.archived && Date.now() - new Date(s.createdAt).getTime() < 24 * 3600e3);
  const myHighlights = highlights.filter((h) => h.owner === user.username);

  return (
    <Screen padded={false}>
      {/* banner */}
      <View className="h-20" style={{ backgroundColor: user.bannerColor ?? colors.pinkTint }} />
      <View className="-mt-16 px-4">
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="font-display text-lg text-wink-ink">@{user.username}</Text>
          <View className="flex-row gap-4">
            <Pressable accessibilityLabel="Shipping settings" onPress={() => router.push("/settings/shipping")} hitSlop={6}>
              <Truck size={20} color={colors.ink} />
            </Pressable>
            <Pressable accessibilityLabel="Messages" onPress={() => router.push("/(tabs)/messages")} hitSlop={6}>
              <MessageCircle size={20} color={colors.ink} />
            </Pressable>
            <Pressable accessibilityLabel="Edit profile" onPress={() => router.push("/edit-profile")} hitSlop={6}>
              <Pencil size={20} color={colors.ink} />
            </Pressable>
            <Pressable accessibilityLabel="Settings" onPress={() => router.push("/settings")} hitSlop={6}>
              <Settings size={20} color={colors.ink} />
            </Pressable>
          </View>
        </View>

        <View className="items-center rounded-card border border-wink-pink-border bg-white p-5">
          <Pressable accessibilityLabel="Your story options" onPress={() => setStorySheet(true)}>
            <Avatar name={user.displayName} color={user.avatarColor} size={84} ring={myStories.length ? colors.pink : undefined} />
            <Pressable
              accessibilityLabel="Change profile photo"
              onPress={() => setPhotoSheet(true)}
              className="absolute bottom-0 right-0 h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-wink-pink"
            >
              <Camera size={13} color={colors.white} />
            </Pressable>
          </Pressable>
          <View className="mt-3 flex-row items-center gap-1.5">
            <Text className="font-display text-lg text-wink-ink">{user.displayName}</Text>
            {user.verifiedSeller || user.completedTransactions >= 100 ? <Verified size={16} /> : null}
          </View>
          <Text className="text-xs text-wink-muted">📍 {user.location} · 🚚 {shippingSummary(user.shipping)}</Text>
          <View className="mt-1 flex-row flex-wrap justify-center gap-1">
            <Pill label={user.internationalTrading ? "🌍 Intl. trades" : "🏠 Domestic only"} />
            {user.availability !== "available" ? <Pill label={AVAILABILITY_LABELS[user.availability]} color="#B5532F" bg="#FFF0E8" /> : null}
            {user.isCollectionAccount ? <Pill label="Collection account" color={colors.mint} bg={colors.mintTint} /> : null}
            {user.isPrivate ? <Pill label="🔒 Private" /> : null}
          </View>

          <Pressable onPress={() => router.push(`/reviews/${user.username}`)} className="mt-2 flex-row items-center gap-1">
            <Stars value={rating} size={13} />
            <Text className="text-xs text-wink-muted">
              {rating.toFixed(1)} · {reviews.count} reviews
            </Text>
          </Pressable>

          <View className="mt-3 w-full flex-row justify-around border-t border-wink-pink-border pt-3">
            <Stat label="Listings" value={mine.listings.length} />
            <Stat label="Followers" value={user.followers.length} onPress={() => router.push(`/follows/${user.username}?tab=followers`)} />
            <Stat label="Following" value={user.following.length} onPress={() => router.push(`/follows/${user.username}?tab=following`)} />
            <Stat label="Trades" value={user.completedTransactions} />
          </View>

          {user.bio ? <BioText text={user.bio} /> : null}
          {user.aboutMe ? (
            <View className="mt-2 w-full rounded-card bg-wink-purple-tint p-3">
              <Text className="text-xs text-wink-muted">About me / Rules</Text>
              <Text className="text-sm text-wink-ink">{user.aboutMe}</Text>
            </View>
          ) : null}
          <SocialLinks link={user.link} socials={user.socials} />
          <BadgesRow badges={badges} />
        </View>

        <HighlightsRow owner={user.username} highlights={myHighlights} own />

        {/* shortcuts */}
        <View className="mt-4 flex-row gap-2">
          <Shortcut label="collection" onPress={() => router.push("/collection")} />
          <Shortcut label="wishlist" onPress={() => router.push("/wishlists")} />
          <Shortcut label="ISO" onPress={() => router.push("/post/new?type=ISO")} />
          <Shortcut label="info" icon={<Info size={12} color={colors.ink} />} onPress={() => router.push("/post/new")} />
        </View>
        <Pressable onPress={() => router.push("/settings/payments")} className="mt-2 flex-row items-center gap-2 rounded-card border border-wink-pink-border bg-white px-4 py-3">
          <Wallet size={16} color={colors.mint} />
          <Text className="flex-1 text-sm text-wink-ink">
            Wallet ${user.walletBalance.toFixed(2)} · {user.points} pts
          </Text>
          <Text className="text-xs text-wink-muted">{user.pendingBalance ? `$${user.pendingBalance.toFixed(2)} pending` : ""}</Text>
        </Pressable>

        {/* currently collecting */}
        <View className="mb-2 mt-5 flex-row items-center justify-between">
          <Text className="font-display text-wink-ink">Currently collecting</Text>
          <Pressable onPress={() => router.push("/edit-collecting")}>
            <Text className="text-sm text-wink-pink">Edit</Text>
          </Pressable>
        </View>
        {user.collectingGroupIds.length === 0 ? (
          <Pressable onPress={() => router.push("/edit-collecting")} className="rounded-card border border-dashed border-wink-pink-border p-4">
            <Text className="text-center text-sm text-wink-muted">Add groups and idols you are currently collecting</Text>
          </Pressable>
        ) : (
          <View className="gap-2">
            {[...user.collectingGroupIds]
              .sort((a, b) => Number(user.priorityGroupIds.includes(b)) - Number(user.priorityGroupIds.includes(a)))
              .map((id) => {
                const g = GROUP_MAP[id];
                if (!g) return null;
                const members = user.collectingMembers?.[id];
                const label =
                  members === undefined
                    ? "No idols selected"
                    : members.length === 0
                      ? "Full group"
                      : members.map((m) => g.members.find((x) => x.id === m)?.name).filter(Boolean).join(", ");
                return (
                  <Pressable key={id} onPress={() => router.push(`/edit-collecting?group=${id}`)} className="flex-row items-center gap-3 rounded-card bg-white p-3">
                    <View className="h-3 w-3 rounded-full" style={{ backgroundColor: g.color }} />
                    <View className="flex-1">
                      <Text className="font-display text-sm text-wink-ink">{g.name}</Text>
                      <Text className="text-xs text-wink-muted">{label}</Text>
                    </View>
                    {user.priorityGroupIds.includes(id) ? <Star size={14} color={colors.warn} fill={colors.warn} /> : null}
                  </Pressable>
                );
              })}
          </View>
        )}

        <Pressable onPress={() => router.push("/(tabs)/browse")} className="mt-4 flex-row items-center gap-2">
          <Search size={14} color={colors.muted} />
          <Text className="text-xs text-wink-muted">Find more cards for your collection</Text>
        </Pressable>

        <ProfileItems posts={mine.posts} listings={mine.listings} own />
      </View>

      {/* story options (§23W) */}
      <Sheet visible={storySheet} onClose={() => setStorySheet(false)} title="Your Story">
        <MenuItem label="Add to story" onPress={() => { setStorySheet(false); router.push("/story/new"); }} />
        {myStories.length ? <MenuItem label="View story" onPress={() => { setStorySheet(false); router.push(`/story/${user.username}`); }} /> : null}
        {myStories.length ? <MenuItem label="Delete story" danger onPress={() => { myStories.forEach((s) => deleteStory(s.id)); setStorySheet(false); }} /> : null}
        <MenuItem label="Cancel" onPress={() => setStorySheet(false)} />
      </Sheet>

      {/* profile photo (§23C, §23K) */}
      <Sheet visible={photoSheet} onClose={() => setPhotoSheet(false)} title="Profile photo">
        <MenuItem label="Take photo" onPress={() => { updateUser({ avatarUri: "camera" }); setPhotoSheet(false); }} />
        <MenuItem label="Choose from library" onPress={() => { updateUser({ avatarUri: "library" }); setPhotoSheet(false); }} />
        <Text className="mb-2 mt-3 text-xs text-wink-muted">Or pick a colour</Text>
        <View className="mb-3 flex-row gap-2">
          {AVATAR_COLORS.map((c) => (
            <Pressable key={c} accessibilityLabel={`Colour ${c}`} onPress={() => updateUser({ avatarColor: c })} className="h-8 w-8 rounded-full" style={{ backgroundColor: c, borderWidth: user.avatarColor === c ? 3 : 0, borderColor: colors.ink }} />
          ))}
        </View>
        <MenuItem label="Remove photo" danger onPress={() => { updateUser({ avatarUri: undefined, avatarColor: colors.purpleSoft }); setPhotoSheet(false); }} />
      </Sheet>
    </Screen>
  );
}

function Stat({ label, value, onPress }: { label: string; value: number; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} className="items-center">
      <Text className="font-display text-lg text-wink-ink">{value}</Text>
      <Text className="text-xs text-wink-muted">{label}</Text>
    </Pressable>
  );
}

function Shortcut({ label, onPress, icon }: { label: string; onPress: () => void; icon?: React.ReactNode }) {
  return (
    <Pressable onPress={onPress} className="flex-1 flex-row items-center justify-center gap-1 rounded-pill border border-wink-pink-border bg-white py-2">
      {icon}
      <Text className="text-xs text-wink-ink">{label}</Text>
    </Pressable>
  );
}

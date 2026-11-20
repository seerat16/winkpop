import { useState } from "react";
import { Pressable, View } from "react-native";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { Lock, MoreHorizontal } from "lucide-react-native";
import {
  Avatar,
  avatarColorFor,
  BadgesRow,
  BioText,
  Button,
  EmptyState,
  HighlightsRow,
  MenuItem,
  Page,
  Pill,
  ProfileItems,
  ReportSheet,
  Sheet,
  Stars,
  Text,
  Verified,
} from "@/components";
import {
  AVAILABILITY_LABELS,
  computeBadges,
  getCommunityUser,
  getReviews,
  GROUP_MAP,
  shippingSummary,
  summarizeReviews,
} from "@/data";
import { allListings, useAppStore } from "@/data/appStore";
import { useUserStore } from "@/data/userStore";
import { colors } from "@/theme/colors";

/**
 * Another collector's profile (§15A–C, §23 "view another collector"): follow /
 * request, message, mutual followers, listings with sort & search, highlights,
 * reviews, badges, block and report.
 */
export default function UserProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const me = useUserStore((s) => s.user);
  const toggleFollow = useUserStore((s) => s.toggleFollow);
  const toggleBlock = useUserStore((s) => s.toggleBlock);
  const posts = useAppStore((s) => s.posts);
  const stories = useAppStore((s) => s.stories);
  const highlights = useAppStore((s) => s.highlights);
  const reviewsWritten = useAppStore((s) => s.reviewsWritten);
  const openConversation = useAppStore((s) => s.openConversation);
  const [menu, setMenu] = useState(false);
  const [report, setReport] = useState(false);
  const [requested, setRequested] = useState(false);

  if (me && username === me.username) return <Redirect href="/(tabs)/profile" />;
  const u = getCommunityUser(username ?? "");
  if (!u) return <Page title={`@${username}`}>{<EmptyState title="This account doesn't exist" />}</Page>;

  const following = me?.following.includes(u.username) ?? false;
  const blocked = me?.blocked.includes(u.username) ?? false;
  const canSee = !u.isPrivate || following;
  const reviews = summarizeReviews(getReviews(u.username, reviewsWritten));
  const badges = computeBadges({ ...u, averageRating: reviews.average });
  const mutuals = u.followers.filter((f) => me?.following.includes(f));
  const live = stories.some((s) => s.author === u.username && !s.archived && Date.now() - new Date(s.createdAt).getTime() < 24 * 3600e3);
  const followerCount = u.followers.length + (following && !u.followers.includes(me?.username ?? "") ? 1 : 0);

  return (
    <Page
      title={`@${u.username}`}
      right={
        <Pressable accessibilityLabel="More options" onPress={() => setMenu(true)} hitSlop={8}>
          <MoreHorizontal size={20} color={colors.ink} />
        </Pressable>
      }
    >
      <View className="items-center rounded-card border border-wink-pink-border bg-white p-5">
        <Pressable disabled={!live} onPress={() => router.push(`/story/${u.username}`)}>
          <Avatar name={u.username} color={avatarColorFor(u.username)} size={80} ring={live ? colors.pink : undefined} />
        </Pressable>
        <View className="mt-2 flex-row items-center gap-1">
          <Text className="font-display text-lg text-wink-ink">{u.displayName}</Text>
          {u.verified ? <Verified size={16} /> : null}
        </View>
        <Text className="text-xs text-wink-muted">
          📍 {u.location} · 🚚 {shippingSummary(u.shipping)}
        </Text>
        <View className="mt-1 flex-row flex-wrap justify-center gap-1">
          <Pill label={u.internationalTrading ? "🌍 Intl. trades" : "🏠 Domestic only"} />
          {u.availability !== "available" ? <Pill label={AVAILABILITY_LABELS[u.availability]} color="#B5532F" bg="#FFF0E8" /> : null}
          {u.isCollectionAccount ? <Pill label="Collection account" color={colors.mint} bg={colors.mintTint} /> : null}
          <Pill label={u.online ? "Active now" : `Active ${u.lastActive}`} color={colors.muted} bg="#f3f3f3" />
        </View>
        <Pressable onPress={() => router.push(`/reviews/${u.username}`)} className="mt-2 flex-row items-center gap-1">
          <Stars value={reviews.average} size={13} />
          <Text className="text-xs text-wink-muted">
            {reviews.average.toFixed(1)} · {reviews.count} reviews · {u.completedTransactions} transactions
          </Text>
        </Pressable>
        <View className="mt-3 w-full flex-row justify-around border-t border-wink-pink-border pt-3">
          <Pressable onPress={() => canSee && router.push(`/follows/${u.username}?tab=followers`)} className="items-center">
            <Text className="font-display text-lg text-wink-ink">{followerCount}</Text>
            <Text className="text-xs text-wink-muted">Followers</Text>
          </Pressable>
          <Pressable onPress={() => canSee && router.push(`/follows/${u.username}?tab=following`)} className="items-center">
            <Text className="font-display text-lg text-wink-ink">{u.following.length}</Text>
            <Text className="text-xs text-wink-muted">Following</Text>
          </Pressable>
        </View>
        {mutuals.length ? <Text className="mt-2 text-xs text-wink-muted">Followed by {mutuals.slice(0, 2).join(", ")}{mutuals.length > 2 ? ` and ${mutuals.length - 2} more` : ""}</Text> : null}
        {u.bio ? <BioText text={u.bio} /> : null}
        <BadgesRow badges={badges} />
        <View className="mt-3 w-full flex-row gap-2">
          <View className="flex-1">
            <Button
              title={blocked ? "Blocked" : following ? "Following" : u.isPrivate ? (requested ? "Requested" : "Request") : "Follow"}
              variant={following || requested ? "secondary" : "primary"}
              fullWidth
              disabled={blocked}
              onPress={() => {
                if (u.isPrivate && !following) {
                  setRequested(!requested);
                  if (!requested) toggleFollow(u.username, false);
                } else toggleFollow(u.username);
              }}
            />
          </View>
          <View className="flex-1">
            <Button
              title="Message"
              variant="secondary"
              fullWidth
              disabled={blocked}
              onPress={() => router.push(`/chat/${openConversation(u.username)}`)}
            />
          </View>
        </View>
      </View>

      {canSee ? (
        <>
          <HighlightsRow owner={u.username} highlights={highlights.filter((h) => h.owner === u.username)} own={false} />
          <View className="mt-3 flex-row flex-wrap gap-1">
            {u.collectingGroupIds.map((g) => (
              <Pill key={g} label={GROUP_MAP[g]?.name ?? g} color={colors.white} bg={GROUP_MAP[g]?.color ?? colors.purple} />
            ))}
          </View>
          <ProfileItems
            posts={posts.filter((p) => (p.author === u.username || p.collabWith === u.username) && !p.archived)}
            listings={allListings().filter((l) => l.sellerUsername === u.username)}
            own={false}
          />
        </>
      ) : (
        <View className="items-center py-10">
          <Lock size={32} color={colors.muted} />
          <Text className="mt-2 font-display text-wink-ink">This account is private</Text>
          <Text className="text-sm text-wink-muted">Follow to see their posts and listings.</Text>
        </View>
      )}

      <Sheet visible={menu} onClose={() => setMenu(false)} title={`@${u.username}`}>
        <MenuItem
          label="Share this profile"
          onPress={() => {
            setMenu(false);
            router.push(`/share?kind=profile&id=${u.username}`);
          }}
        />
        <MenuItem label={blocked ? "Unblock" : "Block"} danger onPress={() => { toggleBlock(u.username); setMenu(false); }} />
        <MenuItem label="Report account" danger onPress={() => { setMenu(false); setReport(true); }} />
      </Sheet>
      <ReportSheet visible={report} onClose={() => setReport(false)} targetKind="user" targetId={u.username} />
    </Page>
  );
}

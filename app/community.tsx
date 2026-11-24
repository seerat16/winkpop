import { useState } from "react";
import { Linking, Pressable, ScrollView, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Button, Chip, EmptyState, Page, PostCard, Tabs, Text, UserRow } from "@/components";
import { COMMUNITY_USERS, DISCORD_URL, GROUPS, getCommunityUser } from "@/data";
import { useAppStore } from "@/data/appStore";
import { useUserStore } from "@/data/userStore";

type Tab = "local" | "display" | "art" | "comebacks" | "collectors";

/**
 * Community (§15S–V, §4E, §4M): local collecting, collection display and art
 * sub-tabs with hashtag filtering, comeback-specific trading spaces, local
 * collector matching, and a link to the WinKPop Discord.
 */
export default function CommunityScreen() {
  const params = useLocalSearchParams<{ tab?: Tab }>();
  const user = useUserStore((s) => s.user);
  const toggleFollow = useUserStore((s) => s.toggleFollow);
  const posts = useAppStore((s) => s.posts);
  const [tab, setTab] = useState<Tab>(params.tab ?? "local");
  const [tag, setTag] = useState<string | null>(null);
  const [comeback, setComeback] = useState<string | null>(null);

  const section = posts.filter((p) => !p.archived && (tab === "local" ? p.community === "local" || !!p.location : tab === "display" ? p.community === "display" : p.community === "art"));
  const hashtags = [...new Set(section.flatMap((p) => p.hashtags))];
  const shown = section.filter((p) => !tag || p.hashtags.includes(tag));
  const comebacks = GROUPS.map((g) => ({ id: g.id, label: `${g.name} · ${g.eras[0]}` }));
  const local = COMMUNITY_USERS.filter((u) => u.username !== user?.username && getCommunityUser(u.username)?.country === user?.country);

  return (
    <Page title="Community">
      <Pressable onPress={() => Linking.openURL(DISCORD_URL)} className="mb-3 rounded-card bg-wink-purple px-4 py-3">
        <Text className="font-display text-white">💜 Join the WinKPop community on Discord</Text>
      </Pressable>
      <Tabs
          value={tab}
          onChange={(t) => { setTab(t); setTag(null); }}
          tabs={[
            { key: "local", label: "Local" },
            { key: "display", label: "Collections" },
            { key: "art", label: "Art" },
            { key: "comebacks", label: "Comebacks" },
            { key: "collectors", label: "Collectors" },
          ]}
      />

      {tab === "comebacks" ? (
        <>
          <Text className="mb-2 text-sm text-wink-muted">Trading spaces for the newest releases.</Text>
          <View className="mb-3 flex-row flex-wrap gap-2">
            {comebacks.map((c) => (
              <Chip key={c.id} label={c.label} active={comeback === c.id} onPress={() => setComeback(c.id)} />
            ))}
          </View>
          {comeback
            ? posts.filter((p) => p.groupTags.some((g) => g.groupId === comeback)).map((p) => <PostCard key={p.id} post={p} />)
            : null}
          {comeback && !posts.some((p) => p.groupTags.some((g) => g.groupId === comeback)) ? <EmptyState emoji="🎤" title="No posts yet — start the space!" /> : null}
        </>
      ) : tab === "collectors" ? (
        <>
          <Text className="mb-2 text-sm text-wink-muted">Collectors near you ({user?.country}) and who share your groups.</Text>
          {[...local, ...COMMUNITY_USERS.filter((u) => !local.includes(u) && u.collectingGroupIds.some((g) => user?.collectingGroupIds.includes(g)))].map((u) => (
            <UserRow
              key={u.username}
              username={u.username}
              right={<Button size="sm" title={user?.following.includes(u.username) ? "Following" : "Follow"} variant={user?.following.includes(u.username) ? "secondary" : "primary"} onPress={() => toggleFollow(u.username, u.isPrivate)} />}
            />
          ))}
        </>
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
            <View className="flex-row gap-2">
              <Chip label="All" active={!tag} onPress={() => setTag(null)} />
              {hashtags.map((h) => (
                <Chip key={h} label={`#${h}`} active={tag === h} onPress={() => setTag(h)} />
              ))}
            </View>
          </ScrollView>
          {shown.length === 0 ? <EmptyState emoji="🫶" title="Nothing here yet" /> : shown.map((p) => <PostCard key={p.id} post={p} />)}
        </>
      )}
    </Page>
  );
}

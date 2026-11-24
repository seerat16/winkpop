import { useState } from "react";
import { TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Search } from "lucide-react-native";
import { Button, EmptyState, Page, Tabs, Text, UserRow } from "@/components";
import { getCommunityUser } from "@/data";
import { useUserStore } from "@/data/userStore";
import { colors } from "@/theme/colors";

/** Followers / following lists with search and follow buttons (§15Q, §23 Followers). */
export default function FollowsScreen() {
  const { username, tab: initial } = useLocalSearchParams<{ username: string; tab?: "followers" | "following" }>();
  const me = useUserStore((s) => s.user);
  const toggleFollow = useUserStore((s) => s.toggleFollow);
  const respond = useUserStore((s) => s.respondFollowRequest);
  const [tab, setTab] = useState<"followers" | "following" | "requests">(initial ?? "followers");
  const [query, setQuery] = useState("");
  const isMe = me?.username === username;
  const other = getCommunityUser(username ?? "");
  const lists = {
    followers: isMe ? (me?.followers ?? []) : (other?.followers ?? []),
    following: isMe ? (me?.following ?? []) : (other?.following ?? []),
    requests: isMe ? (me?.followRequests ?? []) : [],
  };
  const shown = lists[tab].filter((u) => u.includes(query.toLowerCase()));

  return (
    <Page title={`@${username}`}>
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { key: "followers", label: "Followers", count: lists.followers.length },
          { key: "following", label: "Following", count: lists.following.length },
          ...(isMe && me?.isPrivate !== undefined ? [{ key: "requests" as const, label: "Requests", count: lists.requests.length }] : []),
        ]}
      />
      <View className="mb-2 flex-row items-center gap-2 rounded-card border border-wink-pink-border bg-white px-3 py-2">
        <Search size={14} color={colors.muted} />
        <TextInput value={query} onChangeText={setQuery} autoCapitalize="none" placeholder="Search usernames" placeholderTextColor={colors.muted} className="flex-1 text-sm text-wink-ink" />
      </View>
      {shown.length === 0 ? <EmptyState emoji="👥" title="No one here yet" /> : null}
      {shown.map((u) =>
        tab === "requests" ? (
          <UserRow
            key={u}
            username={u}
            right={
              <View className="flex-row gap-2">
                <Button size="sm" title="Accept" onPress={() => respond(u, true)} />
                <Button size="sm" variant="secondary" title="Deny" onPress={() => respond(u, false)} />
              </View>
            }
          />
        ) : (
          <UserRow
            key={u}
            username={u}
            right={
              u === me?.username ? (
                <Text className="text-xs text-wink-muted">You</Text>
              ) : (
                <Button
                  size="sm"
                  title={me?.following.includes(u) ? "Following" : "Follow"}
                  variant={me?.following.includes(u) ? "secondary" : "primary"}
                  onPress={() => toggleFollow(u, getCommunityUser(u)?.isPrivate)}
                />
              )
            }
          />
        ),
      )}
    </Page>
  );
}

import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { CheckCircle2, Circle, Search, X } from "lucide-react-native";
import { Button, Field, Page, Tabs, Text, UserRow } from "@/components";
import { COMMUNITY_USERS } from "@/data";
import { useAppStore } from "@/data/appStore";
import { useUserStore } from "@/data/userStore";
import { colors } from "@/theme/colors";

/** New message (§16B, §16H, §16V): a DM, or a group chat with an optional name. */
export default function NewMessageScreen() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const openConversation = useAppStore((s) => s.openConversation);
  const createGroup = useAppStore((s) => s.createGroupChat);
  const [mode, setMode] = useState<"dm" | "group">("dm");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState("");

  const candidates = COMMUNITY_USERS.map((u) => u.username)
    .filter((u) => !user?.blocked.includes(u))
    .filter((u) => !query || u.includes(query.toLowerCase()))
    .sort((a, b) => Number(user?.following.includes(b)) - Number(user?.following.includes(a)));

  const pick = (u: string) => (mode === "dm" ? setSelected([u]) : setSelected((s) => (s.includes(u) ? s.filter((x) => x !== u) : [...s, u])));

  return (
    <Page
      title="New message"
      footer={
        mode === "dm" ? (
          <Button title="Open Chat" fullWidth disabled={!selected.length} onPress={() => router.replace(`/chat/${openConversation(selected[0])}`)} />
        ) : (
          <Button title="Create Group" fullWidth disabled={selected.length < 2} onPress={() => router.replace(`/chat/${createGroup(name, selected)}`)} />
        )
      }
    >
      <Tabs
        value={mode}
        onChange={(m) => {
          setMode(m);
          setSelected([]);
        }}
        tabs={[
          { key: "dm", label: "New DM" },
          { key: "group", label: "New group chat" },
        ]}
      />
      {mode === "group" ? <Field label="Group name (optional)" value={name} onChangeText={setName} /> : null}
      {mode === "group" && selected.length ? (
        <View className="mb-2 flex-row flex-wrap gap-2">
          {selected.map((u) => (
            <View key={u} className="flex-row items-center gap-1 rounded-pill bg-white px-3 py-1">
              <Text className="text-xs">@{u}</Text>
              <Pressable accessibilityLabel={`Remove ${u}`} onPress={() => pick(u)}>
                <X size={12} color={colors.muted} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
      <View className="mb-2 flex-row items-center gap-2 rounded-card border border-wink-pink-border bg-white px-3 py-2">
        <Search size={14} color={colors.muted} />
        <TextInput value={query} onChangeText={setQuery} autoCapitalize="none" placeholder="Search users" placeholderTextColor={colors.muted} className="flex-1 text-sm text-wink-ink" />
      </View>
      {candidates.map((u) => (
        <UserRow
          key={u}
          username={u}
          onPress={() => pick(u)}
          right={selected.includes(u) ? <CheckCircle2 size={20} color={colors.pink} /> : <Circle size={20} color={colors.muted} />}
        />
      ))}
    </Page>
  );
}

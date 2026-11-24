import { useState } from "react";
import { Share, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Search } from "lucide-react-native";
import { Button, Notice, Page, UserRow } from "@/components";
import { COMMUNITY_USERS, type MessageKind } from "@/data";
import { useAppStore } from "@/data/appStore";
import { colors } from "@/theme/colors";

/**
 * Share a post, listing, story or profile to another account by searching and
 * sending it in a DM (§15H–I, §15X); invites go out via the system share sheet.
 */
export default function ShareScreen() {
  const { kind, id } = useLocalSearchParams<{ kind: string; id: string }>();
  const router = useRouter();
  const openConversation = useAppStore((s) => s.openConversation);
  const sendMessage = useAppStore((s) => s.sendMessage);
  const conversations = useAppStore((s) => s.conversations);
  const groupChats = conversations.filter((c) => c.isGroup);
  const [query, setQuery] = useState("");
  const [sent, setSent] = useState<string[]>([]);

  if (kind === "invite") {
    return (
      <Page title="Invite to WinKPop">
        <Notice text={`Invite @${id} — they'll get a link to join and follow you.`} />
        <Button title="Share invite link" fullWidth onPress={() => Share.share({ message: "Join me on WinKPop, the photocard marketplace 💜 https://winkpop.app" })} />
      </Page>
    );
  }

  const msgKind: MessageKind = kind === "listing" ? "listing" : kind === "profile" ? "profile" : "post";
  const sendTo = (convId: string, key: string) => {
    sendMessage(convId, kind === "story" ? { kind: "text", text: "Shared a story with you ✨" } : { kind: msgKind, refId: id });
    setSent((s) => [...s, key]);
  };
  const users = COMMUNITY_USERS.map((u) => u.username).filter((u) => u.includes(query.toLowerCase()));

  return (
    <Page title="Send to…" footer={<Button title="Done" fullWidth onPress={() => router.back()} />}>
      <View className="mb-2 flex-row items-center gap-2 rounded-card border border-wink-pink-border bg-white px-3 py-2">
        <Search size={14} color={colors.muted} />
        <TextInput value={query} onChangeText={setQuery} autoCapitalize="none" placeholder="Search accounts" placeholderTextColor={colors.muted} className="flex-1 text-sm text-wink-ink" />
      </View>
      {groupChats.map((c) => (
        <UserRow key={c.id} username={c.name ?? "Group"} onPress={() => undefined} right={<Button size="sm" title={sent.includes(c.id) ? "Sent" : "Send"} disabled={sent.includes(c.id)} onPress={() => sendTo(c.id, c.id)} />} />
      ))}
      {users.map((u) => (
        <UserRow key={u} username={u} onPress={() => undefined} right={<Button size="sm" title={sent.includes(u) ? "Sent" : "Send"} disabled={sent.includes(u)} onPress={() => sendTo(openConversation(u), u)} />} />
      ))}
    </Page>
  );
}

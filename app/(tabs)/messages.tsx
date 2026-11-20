import { useMemo, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { BellOff, ChevronDown, Flag, Pin, Search, SquarePen } from "lucide-react-native";
import { Avatar, avatarColorFor, Button, Chip, conversationTitle as titleOf, EmptyState, MenuItem, Screen, Sheet, Tabs, Text, timeAgo } from "@/components";
import { getCommunityUser, type Conversation, type ConversationCategory } from "@/data";
import { useAppStore } from "@/data/appStore";
import { useUserStore } from "@/data/userStore";
import { colors } from "@/theme/colors";

type Filter = "all" | ConversationCategory;
const FILTER_LABEL: Record<Filter, string> = { all: "All", sale: "Sales", trade: "Trades", purchase: "Purchases", community: "Community" };
const FOLDERS = ["Sale", "Buy", "Trade", "Community", "GO", "On the way", "Received"];

/**
 * Messages (§16): account switcher, compose, search, All / Sales / Trades /
 * Purchases / Community with Pending / Completed, folders, message requests,
 * online status, previews, unread counts; long-press to pin / mute / mark
 * unread / flag / move / delete.
 */
export default function MessagesScreen() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const logout = useUserStore((s) => s.logout);
  const conversations = useAppStore((s) => s.conversations);
  const update = useAppStore((s) => s.updateConversation);
  const remove = useAppStore((s) => s.deleteConversation);
  const respond = useAppStore((s) => s.respondMessageRequest);
  const [filter, setFilter] = useState<Filter>("all");
  const [deal, setDeal] = useState<"pending" | "completed">("pending");
  const [folder, setFolder] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [manage, setManage] = useState<Conversation | null>(null);
  const [accounts, setAccounts] = useState(false);
  const me = user?.username ?? "";

  const unreadCount = (c: Conversation) => c.messages.filter((m) => !m.readBy.includes(me)).length || (c.markedUnread ? 1 : 0);
  const requests = conversations.filter((c) => c.isRequest);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return conversations
      .filter((c) => !c.isRequest)
      .filter((c) => !c.participants.some((p) => user?.blocked.includes(p)))
      .filter((c) => filter === "all" || c.category === filter)
      .filter((c) => filter === "all" || filter === "community" || c.dealStatus === deal)
      .filter((c) => !folder || (folder === "Unread" ? unreadCount(c) > 0 : c.folder === folder || (folder === "Sale" && c.category === "sale") || (folder === "Buy" && c.category === "purchase") || (folder === "Trade" && c.category === "trade")))
      .filter((c) => !q || titleOf(c, me).toLowerCase().includes(q) || c.messages.some((m) => m.text?.toLowerCase().includes(q)))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || lastAt(b).localeCompare(lastAt(a)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, filter, deal, folder, query, me, user?.blocked]);

  return (
    <Screen padded={false}>
      <View className="px-4 pt-2">
        <View className="mb-3 flex-row items-center justify-between">
          <Pressable accessibilityLabel="Switch accounts" onPress={() => setAccounts(true)} className="flex-row items-center gap-1">
            <Text className="font-display text-xl text-wink-ink">@{me}</Text>
            <ChevronDown size={18} color={colors.ink} />
          </Pressable>
          <Pressable accessibilityLabel="New message" onPress={() => router.push("/chat/new")} hitSlop={8}>
            <SquarePen size={22} color={colors.ink} />
          </Pressable>
        </View>

        <View className="mb-3 flex-row items-center gap-2 rounded-card border border-wink-pink-border bg-white px-3 py-2.5">
          <Search size={15} color={colors.muted} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Search messages" placeholderTextColor={colors.muted} className="flex-1 text-sm text-wink-ink" />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
          <View className="flex-row gap-2">
            {(Object.keys(FILTER_LABEL) as Filter[]).map((f) => (
              <Chip key={f} label={FILTER_LABEL[f]} active={filter === f} onPress={() => setFilter(f)} />
            ))}
          </View>
        </ScrollView>
        {filter !== "all" && filter !== "community" ? (
          <Tabs
            value={deal}
            onChange={setDeal}
            tabs={[
              { key: "pending", label: "Pending" },
              { key: "completed", label: "Completed" },
            ]}
          />
        ) : null}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
          <View className="flex-row gap-2">
            {[...FOLDERS, "Unread"].map((f) => (
              <Pressable key={f} onPress={() => setFolder(folder === f ? null : f)} className={`rounded-pill px-3 py-1 ${folder === f ? "bg-wink-purple" : "bg-white"}`}>
                <Text className={`text-xs ${folder === f ? "text-white" : "text-wink-muted"}`}>📁 {f}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {requests.length ? (
          <View className="mb-3 rounded-card border border-wink-pink-border bg-white p-3">
            <Text className="mb-2 font-display text-sm text-wink-ink">Message requests ({requests.length})</Text>
            {requests.map((c) => (
              <View key={c.id} className="flex-row items-center gap-2 py-1">
                <Text className="flex-1 text-sm text-wink-ink" numberOfLines={1}>
                  {titleOf(c, me)}: {c.messages[c.messages.length - 1]?.text}
                </Text>
                <Button size="sm" title="Accept" onPress={() => respond(c.id, true)} />
                <Button size="sm" variant="secondary" title="Decline" onPress={() => respond(c.id, false)} />
              </View>
            ))}
          </View>
        ) : null}

        {rows.length === 0 ? (
          <EmptyState
            emoji="💌"
            title={filter === "all" || filter === "community" ? "No messages" : `No ${deal} ${FILTER_LABEL[filter].toLowerCase()} messages`}
          />
        ) : (
          rows.map((c) => {
            const other = c.participants.find((p) => p !== me) ?? me;
            const u = getCommunityUser(other);
            const last = c.messages[c.messages.length - 1];
            const unread = unreadCount(c);
            return (
              <Pressable
                key={c.id}
                onPress={() => router.push(`/chat/${c.id}`)}
                onLongPress={() => setManage(c)}
                className="flex-row items-center gap-3 border-b border-wink-pink-border py-3"
              >
                <View>
                  <Avatar name={c.isGroup ? (c.name ?? "GC") : other} color={c.isGroup ? colors.purple : avatarColorFor(other)} size={48} />
                  {!c.isGroup && u?.online ? <View className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-wink-mint" /> : null}
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-1">
                    <Text className={`text-wink-ink ${unread ? "font-display" : ""}`} numberOfLines={1}>
                      {titleOf(c, me)}
                    </Text>
                    {c.pinned ? <Pin size={11} color={colors.muted} /> : null}
                    {c.muted ? <BellOff size={11} color={colors.muted} /> : null}
                    {c.flagged ? <Flag size={11} color={colors.pink} /> : null}
                  </View>
                  <Text className="text-xs text-wink-muted" numberOfLines={1}>
                    {last ? preview(last, me) : "Send a message"}
                  </Text>
                  {!c.isGroup ? <Text className="text-wink-muted" style={{ fontSize: 10 }}>{u?.online ? "Active now" : (u?.lastActive ?? "")}</Text> : null}
                </View>
                <View className="items-end gap-1">
                  <Text className="text-wink-muted" style={{ fontSize: 10 }}>
                    {last ? timeAgo(last.at) : ""}
                  </Text>
                  {unread ? (
                    <View className="h-5 min-w-5 items-center justify-center rounded-full bg-wink-pink px-1">
                      <Text className="font-display text-white" style={{ fontSize: 10 }}>
                        {unread}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            );
          })
        )}
      </View>

      <Sheet visible={!!manage} onClose={() => setManage(null)} title={manage ? titleOf(manage, me) : ""}>
        {manage ? (
          <>
            <MenuItem label={manage.pinned ? "Unpin" : "Pin"} onPress={() => { update(manage.id, { pinned: !manage.pinned }); setManage(null); }} />
            <MenuItem label={manage.muted ? "Unmute" : "Mute"} onPress={() => { update(manage.id, { muted: !manage.muted }); setManage(null); }} />
            <MenuItem label="Mark as unread" onPress={() => { update(manage.id, { markedUnread: true }); setManage(null); }} />
            <MenuItem label={manage.flagged ? "Unflag" : "Flag"} onPress={() => { update(manage.id, { flagged: !manage.flagged }); setManage(null); }} />
            <Text className="mb-1 mt-3 text-xs text-wink-muted">Move to folder</Text>
            <View className="flex-row flex-wrap gap-2">
              {FOLDERS.map((f) => (
                <Chip key={f} label={f} active={manage.folder === f} onPress={() => { update(manage.id, { folder: f }); setManage(null); }} />
              ))}
            </View>
            <MenuItem label="Delete chat" danger onPress={() => { remove(manage.id); setManage(null); }} />
          </>
        ) : null}
      </Sheet>

      <Sheet visible={accounts} onClose={() => setAccounts(false)} title="Switch account">
        <MenuItem label={`@${me}`} sub="Current account ✓" onPress={() => setAccounts(false)} />
        <MenuItem label="Log in to another account" onPress={() => { setAccounts(false); logout(); }} />
      </Sheet>
    </Screen>
  );
}

function lastAt(c: Conversation): string {
  return c.messages[c.messages.length - 1]?.at ?? "";
}

function preview(m: Conversation["messages"][number], me: string): string {
  const who = m.from === me ? "You: " : "";
  if (m.kind === "listing") return `${who}Shared a listing`;
  if (m.kind === "post") return `${who}Shared a post`;
  if (m.kind === "voice") return `${who}🎤 Voice message`;
  if (m.kind === "photo") return `${who}📷 Photo`;
  if (m.kind === "video") return `${who}🎬 Video`;
  if (m.kind === "offer") return `${who}💸 ${m.text ?? "Offer"}`;
  if (m.kind === "profile") return `${who}Shared a profile`;
  return `${who}${m.text ?? ""}`;
}

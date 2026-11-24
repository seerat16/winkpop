import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Camera, Check, CheckCheck, Heart, Image as ImageIcon, Mic, Plus, Send, Settings2, Tag, Video, X } from "lucide-react-native";
import {
  Avatar,
  avatarColorFor,
  Button,
  conversationTitle,
  EmptyState,
  Field,
  MenuItem,
  Page,
  PhotocardImage,
  ReportSheet,
  Sheet,
  Text,
  UserRow,
} from "@/components";
import { COMMUNITY_USERS, type ChatMessage } from "@/data";
import { getAnyListing, listingName, useAppStore } from "@/data/appStore";
import { useUserStore } from "@/data/userStore";
import { colors } from "@/theme/colors";

/**
 * Chat (§16G–W): text, voice, photo, video, shared listings/posts; double-tap
 * to like, reply to a message, delete your own, read receipts and exact
 * timestamps; respond to offers; open shared listings; group settings
 * (rename, add/remove members, mute, leave, delete).
 */
export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const me = useUserStore((s) => s.user?.username ?? "");
  const conv = useAppStore((s) => s.conversations.find((c) => c.id === id));
  const listings = useAppStore((s) => s.listings);
  const offers = useAppStore((s) => s.offers);
  const posts = useAppStore((s) => s.posts);
  const send = useAppStore((s) => s.sendMessage);
  const markRead = useAppStore((s) => s.markRead);
  const toggleLike = useAppStore((s) => s.toggleMessageLike);
  const deleteMessage = useAppStore((s) => s.deleteMessage);
  const update = useAppStore((s) => s.updateConversation);
  const leave = useAppStore((s) => s.leaveConversation);
  const setMembers = useAppStore((s) => s.setGroupMembers);
  const respondOffer = useAppStore((s) => s.respondOffer);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [selected, setSelected] = useState<ChatMessage | null>(null);
  const [attach, setAttach] = useState(false);
  const [settings, setSettings] = useState(false);
  const [report, setReport] = useState(false);
  const [rename, setRename] = useState("");
  const lastTap = useRef<{ id: string; t: number } | null>(null);

  useEffect(() => {
    if (conv) markRead(conv.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conv?.messages.length]);

  if (!conv) return <Page title="Chat">{<EmptyState title="Conversation not found" />}</Page>;
  const title = conversationTitle(conv, me);
  const other = conv.participants.find((p) => p !== me) ?? me;

  const submit = (msg: Partial<ChatMessage> & { kind: ChatMessage["kind"] }) => {
    send(conv.id, { ...msg, replyToId: replyTo?.id });
    setReplyTo(null);
  };

  const onTap = (m: ChatMessage) => {
    const now = Date.now();
    if (lastTap.current && lastTap.current.id === m.id && now - lastTap.current.t < 300) {
      toggleLike(conv.id, m.id);
      lastTap.current = null;
      return;
    }
    lastTap.current = { id: m.id, t: now };
    if (m.kind === "listing" && m.refId) router.push(`/card/${m.refId}`);
    if (m.kind === "post" && m.refId) router.push(`/post/${m.refId}`);
    if (m.kind === "profile" && m.refId) router.push(`/user/${m.refId}`);
  };

  const myListings = listings.filter((l) => l.sellerUsername === me);
  const pendingOffer = offers.find((o) => o.direction === "sent" && o.counterparty === other && o.status === "countered");

  return (
    <Page
      title={title}
      scroll={false}
      right={
        <View className="flex-row items-center gap-3">
          {!conv.isGroup ? (
            <Pressable accessibilityLabel="View profile" onPress={() => router.push(`/user/${other}`)}>
              <Avatar name={other} color={avatarColorFor(other)} size={30} />
            </Pressable>
          ) : null}
          <Pressable accessibilityLabel="Chat settings" onPress={() => { setRename(conv.name ?? ""); setSettings(true); }}>
            <Settings2 size={20} color={colors.ink} />
          </Pressable>
        </View>
      }
      footer={
        <View>
          {replyTo ? (
            <View className="mb-2 flex-row items-center rounded-card bg-wink-purple-tint px-3 py-2">
              <Text className="flex-1 text-xs text-wink-muted" numberOfLines={1}>
                Replying to {replyTo.from}: {replyTo.text ?? replyTo.kind}
              </Text>
              <Pressable accessibilityLabel="Cancel reply" onPress={() => setReplyTo(null)}>
                <X size={14} color={colors.muted} />
              </Pressable>
            </View>
          ) : null}
          <View className="flex-row items-center gap-2">
            <Pressable accessibilityLabel="Attach" onPress={() => setAttach(true)} className="h-10 w-10 items-center justify-center rounded-full bg-wink-purple-tint">
              <Plus size={18} color={colors.purple} />
            </Pressable>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Message…"
              placeholderTextColor={colors.muted}
              className="flex-1 rounded-pill border border-wink-pink-border px-4 py-2.5 text-wink-ink"
            />
            {text.trim() ? (
              <Pressable
                accessibilityLabel="Send"
                onPress={() => {
                  submit({ kind: "text", text: text.trim() });
                  setText("");
                }}
                className="h-10 w-10 items-center justify-center rounded-full bg-wink-pink"
              >
                <Send size={16} color={colors.white} />
              </Pressable>
            ) : (
              <Pressable accessibilityLabel="Send voice message" onPress={() => submit({ kind: "voice", text: "0:07" })} className="h-10 w-10 items-center justify-center rounded-full bg-wink-pink">
                <Mic size={16} color={colors.white} />
              </Pressable>
            )}
          </View>
        </View>
      }
    >
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 16 }}>
        {pendingOffer ? (
          <View className="mb-3 rounded-card border border-wink-pink-border bg-white p-3">
            <Text className="text-sm text-wink-ink">
              @{other} countered your ${pendingOffer.amount.toFixed(2)} offer with <Text className="font-display">${pendingOffer.counterAmount?.toFixed(2)}</Text>
            </Text>
            <View className="mt-2 flex-row gap-2">
              <Button size="sm" title="Accept" onPress={() => respondOffer(pendingOffer.id, "accept")} />
              <Button size="sm" variant="secondary" title="Decline" onPress={() => respondOffer(pendingOffer.id, "decline")} />
            </View>
          </View>
        ) : null}
        {conv.messages.length === 0 ? <EmptyState emoji="👋" title={`Send a message to ${title}`} /> : null}
        {conv.messages.map((m, i) => {
          const mine = m.from === me;
          const reply = m.replyToId ? conv.messages.find((x) => x.id === m.replyToId) : undefined;
          const isLast = i === conv.messages.length - 1;
          const seen = mine && m.readBy.some((r) => r !== me);
          return (
            <View key={m.id} className={`mb-2 ${mine ? "items-end" : "items-start"}`}>
              {conv.isGroup && !mine ? <Text className="mb-0.5 ml-2 text-wink-muted" style={{ fontSize: 10 }}>{m.from}</Text> : null}
              <Pressable
                onPress={() => onTap(m)}
                onLongPress={() => setSelected(m)}
                className={`max-w-[80%] rounded-card px-3 py-2 ${mine ? "bg-wink-pink" : "bg-white"}`}
              >
                {reply ? (
                  <Text className={`mb-1 text-xs ${mine ? "text-white/80" : "text-wink-muted"}`} numberOfLines={1}>
                    ↪ {reply.from}: {reply.text ?? reply.kind}
                  </Text>
                ) : null}
                <MessageBody m={m} mine={mine} listingTitle={m.refId ? (() => { const l = getAnyListing(m.refId!); return l ? listingName(l) : undefined; })() : undefined} postCaption={posts.find((p) => p.id === m.refId)?.caption} />
              </Pressable>
              <View className="mt-0.5 flex-row items-center gap-1">
                {m.likedBy.length ? <Heart size={10} color={colors.pink} fill={colors.pink} /> : null}
                <Text className="text-wink-muted" style={{ fontSize: 9 }}>
                  {new Date(m.at).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </Text>
                {mine && isLast ? (seen ? <CheckCheck size={11} color={colors.mint} /> : <Check size={11} color={colors.muted} />) : null}
                {mine && isLast ? <Text className="text-wink-muted" style={{ fontSize: 9 }}>{seen ? "Seen" : "Sent"}</Text> : null}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <Sheet visible={!!selected} onClose={() => setSelected(null)} title="Message">
        {selected ? (
          <>
            <MenuItem label={selected.likedBy.includes(me) ? "Unlike" : "Like ♥"} onPress={() => { toggleLike(conv.id, selected.id); setSelected(null); }} />
            <MenuItem label="Reply" onPress={() => { setReplyTo(selected); setSelected(null); }} />
            {selected.from === me ? <MenuItem label="Delete message" danger onPress={() => { deleteMessage(conv.id, selected.id); setSelected(null); }} /> : null}
            {selected.from !== me ? <MenuItem label="Report message" danger onPress={() => { setSelected(null); setReport(true); }} /> : null}
          </>
        ) : null}
      </Sheet>

      <Sheet visible={attach} onClose={() => setAttach(false)} title="Send">
        <MenuItem icon={<Camera size={18} color={colors.ink} />} label="Photo" onPress={() => { submit({ kind: "photo" }); setAttach(false); }} />
        <MenuItem icon={<Video size={18} color={colors.ink} />} label="Video" onPress={() => { submit({ kind: "video" }); setAttach(false); }} />
        <MenuItem icon={<Mic size={18} color={colors.ink} />} label="Voice message" onPress={() => { submit({ kind: "voice", text: "0:12" }); setAttach(false); }} />
        <Text className="mb-1 mt-3 text-xs text-wink-muted">Your listings</Text>
        {myListings.length === 0 ? <Text className="text-xs text-wink-muted">No listings yet.</Text> : null}
        {myListings.map((l) => (
          <MenuItem key={l.id} icon={<Tag size={16} color={colors.pink} />} label={l.title} sub={`$${l.price.toFixed(2)}`} onPress={() => { submit({ kind: "listing", refId: l.id }); setAttach(false); }} />
        ))}
      </Sheet>

      <Sheet visible={settings} onClose={() => setSettings(false)} title={conv.isGroup ? "Group settings" : "Chat settings"}>
        {conv.isGroup ? (
          <>
            {conv.owner === me ? (
              <>
                <Field label="Group name" value={rename} onChangeText={setRename} />
                <Button size="sm" title="Rename" onPress={() => update(conv.id, { name: rename.trim() || undefined })} />
              </>
            ) : null}
            <Text className="mb-1 mt-3 text-xs text-wink-muted">Members ({conv.participants.length})</Text>
            {conv.participants.filter((p) => p !== me).map((p) => (
              <UserRow
                key={p}
                username={p}
                right={<Button size="sm" variant="secondary" title="Remove" onPress={() => setMembers(conv.id, conv.participants.filter((x) => x !== p && x !== me))} />}
              />
            ))}
            <Text className="mb-1 mt-3 text-xs text-wink-muted">Add people</Text>
            {COMMUNITY_USERS.filter((u) => !conv.participants.includes(u.username)).map((u) => (
              <UserRow key={u.username} username={u.username} right={<Button size="sm" title="Add" onPress={() => setMembers(conv.id, [...conv.participants.filter((x) => x !== me), u.username])} />} />
            ))}
          </>
        ) : null}
        <MenuItem label={conv.muted ? "Unmute" : "Mute"} onPress={() => update(conv.id, { muted: !conv.muted })} />
        <MenuItem label={conv.pinned ? "Unpin" : "Pin"} onPress={() => update(conv.id, { pinned: !conv.pinned })} />
        <MenuItem label="Mark completed" sub="Moves it to Completed in Sales / Trades / Purchases" onPress={() => update(conv.id, { dealStatus: "completed" })} />
        {!conv.isGroup ? <MenuItem label={`View @${other}`} onPress={() => { setSettings(false); router.push(`/user/${other}`); }} /> : null}
        <MenuItem label={conv.isGroup ? "Leave group" : "Delete chat"} danger onPress={() => { leave(conv.id); router.back(); }} />
      </Sheet>
      <ReportSheet visible={report} onClose={() => setReport(false)} targetKind="message" targetId={conv.id} />
    </Page>
  );
}

function MessageBody({ m, mine, listingTitle, postCaption }: { m: ChatMessage; mine: boolean; listingTitle?: string; postCaption?: string }) {
  const fg = mine ? "text-white" : "text-wink-ink";
  if (m.kind === "listing") {
    const l = m.refId ? getAnyListing(m.refId) : undefined;
    return (
      <View className="w-44">
        {l ? <PhotocardImage groupId={l.groupId} memberName={l.memberName} imgSeed={l.imgSeed} /> : null}
        <Text className={`mt-1 text-xs ${fg}`}>View listing: {listingTitle ?? "Listing"}</Text>
      </View>
    );
  }
  if (m.kind === "post") return <Text className={`text-xs ${fg}`}>📌 Shared post: {postCaption?.slice(0, 60) ?? ""}</Text>;
  if (m.kind === "profile") return <Text className={`text-xs ${fg}`}>👤 @{m.refId}</Text>;
  if (m.kind === "photo") return <View className="h-32 w-32 items-center justify-center rounded bg-black/10"><ImageIcon size={28} color={mine ? colors.white : colors.muted} /></View>;
  if (m.kind === "video") return <View className="h-32 w-32 items-center justify-center rounded bg-black/10"><Video size={28} color={mine ? colors.white : colors.muted} /></View>;
  if (m.kind === "voice") return <Text className={`text-sm ${fg}`}>🎤 ▶︎ ▁▂▃▅▂▁ {m.text}</Text>;
  if (m.kind === "offer") return <Text className={`text-sm ${fg}`}>💸 {m.text}</Text>;
  return <Text className={`text-sm ${fg}`}>{m.text}</Text>;
}

import { useEffect } from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Bell, Heart, MessageCircle, Package, Repeat, Sparkles, Tag, UserPlus } from "lucide-react-native";
import { Avatar, avatarColorFor, conversationTitle, EmptyState, Page, SectionTitle, Text, timeAgo } from "@/components";
import type { NotificationKind } from "@/data";
import { useAppStore } from "@/data/appStore";
import { useUserStore } from "@/data/userStore";
import { colors } from "@/theme/colors";

const ICON: Record<NotificationKind, typeof Bell> = {
  wishlist_match: Sparkles,
  smart_trade: Repeat,
  smart_sale: Tag,
  group: Bell,
  offer: Tag,
  order: Package,
  follow: UserPlus,
  comment: Heart,
  system: Bell,
};

/** Notifications and messages in one place (§17). */
export default function NotificationsScreen() {
  const router = useRouter();
  const me = useUserStore((s) => s.user?.username ?? "");
  const notifications = useAppStore((s) => s.notifications);
  const markRead = useAppStore((s) => s.markNotificationsRead);
  const conversations = useAppStore((s) => s.conversations);
  const unreadChats = conversations.filter((c) => c.messages.some((m) => !m.readBy.includes(me)));

  useEffect(() => {
    return () => markRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Page title="Notifications" right={<Pressable onPress={() => router.push("/settings/notifications")}><Text className="text-sm text-wink-pink">Settings</Text></Pressable>}>
      {unreadChats.length ? (
        <>
          <SectionTitle title="Unread messages" />
          {unreadChats.map((c) => (
            <Pressable key={c.id} onPress={() => router.push(`/chat/${c.id}`)} className="mb-2 flex-row items-center gap-3 rounded-card bg-white p-3">
              <Avatar name={conversationTitle(c, me)} color={avatarColorFor(conversationTitle(c, me))} size={34} />
              <Text className="flex-1 text-sm text-wink-ink" numberOfLines={1}>
                {conversationTitle(c, me)}: {c.messages[c.messages.length - 1]?.text ?? "New message"}
              </Text>
              <MessageCircle size={16} color={colors.pink} />
            </Pressable>
          ))}
        </>
      ) : null}
      <SectionTitle title="Activity" />
      {notifications.length === 0 ? <EmptyState emoji="🔔" title="You're all caught up" /> : null}
      {notifications.map((n) => {
        const Icon = ICON[n.kind];
        return (
          <Pressable
            key={n.id}
            onPress={() => {
              markRead([n.id]);
              if (n.href) router.push(n.href);
            }}
            className="mb-2 flex-row items-center gap-3 rounded-card p-3"
            style={{ backgroundColor: n.read ? colors.white : colors.pinkTint }}
          >
            <View className="h-9 w-9 items-center justify-center rounded-full bg-wink-purple-tint">
              <Icon size={16} color={colors.purple} />
            </View>
            <Text className="flex-1 text-sm text-wink-ink">{n.text}</Text>
            <Text className="text-xs text-wink-muted">{timeAgo(n.at)}</Text>
          </Pressable>
        );
      })}
    </Page>
  );
}

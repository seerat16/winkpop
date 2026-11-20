import { useState } from "react";
import { Pressable, View } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { ArrowLeftRight, Compass, Image as ImageIcon, MessageCircle, Plus, Tag, User } from "lucide-react-native";
import { MenuItem, Sheet, Text } from "@/components";
import { useAppStore } from "@/data/appStore";
import { useUserStore } from "@/data/userStore";
import { colors } from "@/theme/colors";

/**
 * Primary bottom-tab navigation (§2A): Discover, Transactions, Upload (+),
 * Messages, Profile. Browse and the legacy "My Cards" screen stay routable but
 * are reached from Discover / Profile instead of the tab bar.
 */
export default function TabsLayout() {
  const router = useRouter();
  const [uploadOpen, setUploadOpen] = useState(false);
  const me = useUserStore((s) => s.user?.username);
  const unread = useAppStore((s) =>
    s.conversations.filter(
      (c) => !c.isRequest && (c.markedUnread || c.messages.some((m) => me && !m.readBy.includes(me))),
    ).length,
  );

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.pink,
          tabBarInactiveTintColor: colors.muted,
          tabBarStyle: {
            backgroundColor: colors.white,
            borderTopColor: colors.pinkBorder,
            height: 62,
            paddingBottom: 8,
            paddingTop: 6,
          },
          tabBarLabelStyle: { fontSize: 10 },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Discover",
            tabBarIcon: ({ color, size }: { color: string; size: number }) => <Compass color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="transactions"
          options={{
            title: "Transactions",
            tabBarIcon: ({ color, size }: { color: string; size: number }) => <ArrowLeftRight color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="upload"
          options={{
            title: "",
            tabBarAccessibilityLabel: "Upload",
            tabBarIcon: () => (
              <View className="h-11 w-11 items-center justify-center rounded-full bg-wink-pink" style={{ marginTop: 10 }}>
                <Plus size={24} color={colors.white} />
              </View>
            ),
          }}
          listeners={{
            tabPress: (e: { preventDefault: () => void }) => {
              e.preventDefault();
              setUploadOpen(true);
            },
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: "Messages",
            tabBarBadge: unread > 0 ? unread : undefined,
            tabBarIcon: ({ color, size }: { color: string; size: number }) => <MessageCircle color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }: { color: string; size: number }) => <User color={color} size={size} />,
          }}
        />
        <Tabs.Screen name="browse" options={{ href: null, title: "Browse" }} />
        <Tabs.Screen name="wishlist" options={{ href: null, title: "My Cards" }} />
      </Tabs>

      {/* "What would you like to upload?" sheet (§5) */}
      <Sheet visible={uploadOpen} onClose={() => setUploadOpen(false)} title="What would you like to upload?">
        <MenuItem
          icon={<ImageIcon size={20} color={colors.purple} />}
          label="Upload Post"
          sub="Share an ISO, DWAYOR, collection drop, art & more"
          onPress={() => {
            setUploadOpen(false);
            router.push("/post/new");
          }}
        />
        <MenuItem
          icon={<Tag size={20} color={colors.pink} />}
          label="Upload Listing"
          sub="List a photocard for sale or trade"
          onPress={() => {
            setUploadOpen(false);
            router.push("/listing/new");
          }}
        />
        <Pressable onPress={() => setUploadOpen(false)} className="mt-4 items-center">
          <Text className="text-sm text-wink-muted">Cancel</Text>
        </Pressable>
      </Sheet>
    </>
  );
}

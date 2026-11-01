import { View } from "react-native";
import { useRouter } from "expo-router";
import { BadgeCheck, LogOut, Settings, Star } from "lucide-react-native";
import { Button, Screen, Text } from "@/components";
import { GROUP_MAP } from "@/data/groups";
import { useUserStore } from "@/data/userStore";
import { colors } from "@/theme/colors";

export default function ProfileScreen() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const logout = useUserStore((s) => s.logout);

  if (!user) return null;

  const stats = [
    { label: "Listings", value: 12 },
    { label: "Sales", value: user.completedTransactions },
    { label: "Wishlist", value: user.wishlistIds.length },
  ];

  return (
    <Screen>
      {/* header card */}
      <View className="mt-2 items-center rounded-card border border-wink-pink-border bg-white p-5">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-wink-purple-soft">
          <Text className="font-display text-2xl text-white">
            {user.displayName.slice(0, 2).toUpperCase()}
          </Text>
        </View>
        <View className="mt-3 flex-row items-center gap-1.5">
          <Text className="font-display text-lg text-wink-ink">{user.displayName}</Text>
          {user.verifiedSeller ? <BadgeCheck size={16} color={colors.mint} /> : null}
        </View>
        <Text className="text-sm text-wink-muted">@{user.username}</Text>
        {user.rating > 0 ? (
          <View className="mt-1 flex-row items-center gap-1">
            <Star size={13} color={colors.warn} fill={colors.warn} />
            <Text className="text-xs text-wink-muted">
              {user.rating.toFixed(1)} · {user.completedTransactions} transactions
            </Text>
          </View>
        ) : null}
        {user.bio ? (
          <Text className="mt-2 text-center text-sm text-wink-ink">{user.bio}</Text>
        ) : null}

        <View className="mt-4 w-full flex-row justify-around border-t border-wink-pink-border pt-4">
          {stats.map((s) => (
            <View key={s.label} className="items-center">
              <Text className="font-display text-lg text-wink-ink">{s.value}</Text>
              <Text className="text-xs text-wink-muted">{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* collecting groups */}
      <Text className="mb-2 mt-5 font-display text-wink-ink">Currently collecting</Text>
      {user.collectingGroupIds.length === 0 ? (
        <Text className="text-sm text-wink-muted">You haven&apos;t picked any groups yet.</Text>
      ) : (
        <View className="flex-row flex-wrap gap-2">
          {user.collectingGroupIds.map((id) => {
            const g = GROUP_MAP[id];
            if (!g) return null;
            return (
              <View
                key={id}
                className="rounded-pill px-3 py-1.5"
                style={{ backgroundColor: g.color }}
              >
                <Text className="text-xs text-white">{g.name}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* actions */}
      <View className="mt-6 gap-3">
        <Button
          title="Settings"
          variant="secondary"
          fullWidth
          icon={<Settings size={16} color={colors.ink} />}
          onPress={() => router.push("/settings")}
        />
        <Button
          title="Log out"
          variant="ghost"
          fullWidth
          icon={<LogOut size={16} color={colors.pink} />}
          onPress={logout}
        />
      </View>
    </Screen>
  );
}

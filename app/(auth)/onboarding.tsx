import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { Check } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Text } from "@/components";
import { GROUPS } from "@/data/groups";
import { useUserStore } from "@/data/userStore";
import { colors } from "@/theme/colors";

/**
 * First-run group selection. Mirrors the research's onboarding goal: "select
 * which groups you currently collect / want to collect" so the feed and
 * wishlist matching can personalise from day one.
 */
export default function OnboardingScreen() {
  const router = useRouter();
  const setCollectingGroups = useUserStore((s) => s.setCollectingGroups);
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <SafeAreaView className="flex-1 bg-wink-purple-tint">
      <View className="flex-1 px-5 pt-6">
        <Text className="font-display text-2xl text-wink-ink">Who do you collect?</Text>
        <Text className="mb-5 mt-1 text-sm text-wink-muted">
          Pick your groups — we&apos;ll tune your feed and wishlist matches.
        </Text>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 16 }}
        >
          <View className="flex-row flex-wrap gap-3">
            {GROUPS.map((g) => {
              const on = selected.includes(g.id);
              return (
                <Pressable
                  key={g.id}
                  onPress={() => toggle(g.id)}
                  className="w-[48%] rounded-card border bg-white p-4"
                  style={{ borderColor: on ? g.color : colors.pinkBorder }}
                >
                  <View className="mb-2 flex-row items-center justify-between">
                    <View
                      className="h-10 w-10 items-center justify-center rounded-card"
                      style={{ backgroundColor: g.color }}
                    >
                      <Text className="font-display text-white" style={{ fontSize: 10 }}>
                        {g.abbr}
                      </Text>
                    </View>
                    {on ? (
                      <View
                        className="h-6 w-6 items-center justify-center rounded-full"
                        style={{ backgroundColor: g.color }}
                      >
                        <Check size={14} color={colors.white} />
                      </View>
                    ) : null}
                  </View>
                  <Text className="font-display text-wink-ink">{g.name}</Text>
                  <Text className="text-xs text-wink-muted">
                    {g.company} · {g.generation}G
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View className="py-4">
          <Button
            title={
              selected.length
                ? `Continue with ${selected.length} group${selected.length > 1 ? "s" : ""}`
                : "Skip for now"
            }
            fullWidth
            onPress={() => {
              setCollectingGroups(selected);
              router.replace("/(tabs)/home");
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

import { View } from "react-native";
import { Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Screen, Text } from "@/components";
import { colors } from "@/theme/colors";

const SECTIONS: { title: string; items: string[] }[] = [
  {
    title: "Account",
    items: ["Edit profile", "Shipping options", "Payment methods", "Collecting groups"],
  },
  { title: "Preferences", items: ["International trading", "Notifications", "Dark mode"] },
  { title: "Trust & safety", items: ["Verification", "Reviews", "Blocked users"] },
  { title: "About", items: ["Open-source licenses", "Privacy policy", "Help"] },
];

export default function SettingsScreen() {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-wink-purple-tint" edges={["top"]}>
      <View className="flex-row items-center gap-3 px-4 py-2">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full bg-white"
        >
          <ChevronLeft size={20} color={colors.ink} />
        </Pressable>
        <Text className="font-display text-lg text-wink-ink">Settings</Text>
      </View>
      <Screen>
        {SECTIONS.map((section) => (
          <View key={section.title} className="mb-5">
            <Text className="mb-2 text-xs uppercase tracking-wide text-wink-muted">
              {section.title}
            </Text>
            <View className="overflow-hidden rounded-card border border-wink-pink-border bg-white">
              {section.items.map((item, i) => (
                <Pressable
                  key={item}
                  className={`px-4 py-3.5 ${i > 0 ? "border-t border-wink-pink-border" : ""} active:bg-wink-purple-tint`}
                >
                  <Text className="text-wink-ink">{item}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
        <Text className="text-center text-xs text-wink-muted">
          WinKPop v0.1.0 · MIT licensed · Built with Expo
        </Text>
      </Screen>
    </SafeAreaView>
  );
}

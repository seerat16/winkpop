import { View } from "react-native";
import { Text } from "./Text";

/** Friendly empty-state used across lists (no results, empty cart, etc.). */
export function EmptyState({
  emoji = "🔍",
  title,
  subtitle,
}: {
  emoji?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <View className="items-center justify-center py-20">
      <Text style={{ fontSize: 44 }}>{emoji}</Text>
      <Text className="mt-3 font-display text-wink-ink">{title}</Text>
      {subtitle ? (
        <Text className="mt-1 text-center text-sm text-wink-muted">{subtitle}</Text>
      ) : null}
    </View>
  );
}

import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ScreenProps {
  children: ReactNode;
  /** Wrap content in a ScrollView (default true). */
  scroll?: boolean;
  /** Horizontal padding on the content (default true). */
  padded?: boolean;
}

/**
 * Consistent page frame: safe-area aware, tinted background, optional scroll.
 * Every screen renders inside this so layout is uniform across platforms.
 */
export function Screen({ children, scroll = true, padded = true }: ScreenProps) {
  const content = <View className={padded ? "px-4" : ""}>{children}</View>;
  return (
    <SafeAreaView className="flex-1 bg-wink-purple-tint" edges={["top"]}>
      {scroll ? (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      ) : (
        <View className="flex-1">{content}</View>
      )}
    </SafeAreaView>
  );
}

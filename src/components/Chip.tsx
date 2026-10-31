import { Pressable } from "react-native";
import { Text } from "./Text";

interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  /** When active, use this background instead of the default pink. */
  activeColor?: string;
}

/**
 * Pill-shaped filter chip — used for group/member/era/type/sort selectors.
 * Appears dozens of times across Browse, so it is a shared primitive.
 */
export function Chip({ label, active = false, onPress, activeColor }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      className={`rounded-pill border px-3 py-1.5 ${active ? "border-transparent bg-wink-pink" : "border-wink-pink-border bg-white"}`}
      style={active && activeColor ? { backgroundColor: activeColor } : undefined}
    >
      <Text className={`text-xs ${active ? "font-display text-white" : "text-wink-ink"}`}>
        {label}
      </Text>
    </Pressable>
  );
}

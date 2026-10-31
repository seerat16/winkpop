import { View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { GROUP_MAP } from "@/data/groups";
import { Text } from "./Text";

interface PhotocardImageProps {
  groupId: string;
  memberName: string;
  imgSeed: number;
  aspectRatio?: number;
  rounded?: boolean;
}

/**
 * Deterministic placeholder artwork for a photocard.
 *
 * We have no licensed card scans, so each card renders a stable two-tone
 * gradient (seeded by the group color + imgSeed) with the member initial. This
 * keeps the catalogue visually varied, legally clean, and fully offline — and
 * it is the single swap point for real images once a storage backend exists.
 */
export function PhotocardImage({
  groupId,
  memberName,
  imgSeed,
  aspectRatio = 3 / 4,
  rounded = true,
}: PhotocardImageProps) {
  const base = GROUP_MAP[groupId]?.color ?? "#C9A8E0";
  // Rotate hue deterministically from the seed for per-card variety.
  const tint = shiftColor(base, (imgSeed % 7) * 12 - 24);
  const gradId = `g-${groupId}-${imgSeed}`;

  return (
    <View
      className={`w-full overflow-hidden ${rounded ? "rounded-card" : ""}`}
      style={{ aspectRatio }}
    >
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={base} />
            <Stop offset="1" stopColor={tint} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${gradId})`} />
      </Svg>
      <View className="absolute inset-0 items-center justify-center">
        <Text className="font-display text-white" style={{ fontSize: 34, opacity: 0.92 }}>
          {initials(memberName)}
        </Text>
      </View>
    </View>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Lighten/darken a hex color by `amount` (−100…100). */
function shiftColor(hex: string, amount: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const r = clamp(((n >> 16) & 0xff) + amount);
  const g = clamp(((n >> 8) & 0xff) + amount);
  const b = clamp((n & 0xff) + amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

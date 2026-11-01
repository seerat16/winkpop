import { View } from "react-native";
import Svg, { Circle, Path, Ellipse } from "react-native-svg";
import { colors } from "@/theme/colors";
import { Text } from "./Text";

/**
 * WinKPop logo — the winking eye + "winkpop" wordmark, rebuilt as an SVG so it
 * scales crisply on every platform. Matches the brand mark: a kawaii eye with a
 * heart pupil and a winking brow.
 */
export function Logo({
  size = 120,
  showWordmark = true,
}: {
  size?: number;
  showWordmark?: boolean;
}) {
  const eye = size * 0.46;
  return (
    <View className="items-center">
      <Svg width={eye * 2.1} height={eye} viewBox="0 0 210 100">
        {/* open winking eye (left) */}
        <Ellipse cx="55" cy="55" rx="34" ry="42" fill={colors.ink} />
        <Circle cx="44" cy="40" r="9" fill={colors.white} />
        {/* heart pupil */}
        <Path
          d="M55 72c-12-8-20-15-20-24 0-6 5-10 10-10 4 0 7 2 10 6 3-4 6-6 10-6 5 0 10 4 10 10 0 9-8 16-20 24z"
          fill={colors.purpleSoft}
        />
        {/* lashes */}
        <Path
          d="M24 22l6 14M38 14l3 15M54 12l0 15"
          stroke={colors.ink}
          strokeWidth={3}
          strokeLinecap="round"
        />
        {/* winking brow/eye (right) */}
        <Path
          d="M120 52c18-14 46-16 70-4-6 10-20 16-34 15 6 3 11 8 13 14-10-4-18-11-22-19-9 1-18 1-27-6z"
          fill={colors.ink}
        />
      </Svg>
      {showWordmark && (
        <Text
          className="font-display text-wink-ink"
          style={{ fontSize: size * 0.3, marginTop: size * 0.04 }}
        >
          winkpop
        </Text>
      )}
    </View>
  );
}

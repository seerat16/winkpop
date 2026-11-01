import { ActivityIndicator, Pressable, View, type PressableProps } from "react-native";
import { Text } from "./Text";
import { colors } from "@/theme/colors";

type Variant = "primary" | "secondary" | "mint" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends Omit<PressableProps, "children"> {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  /** Optional leading icon element. */
  icon?: React.ReactNode;
}

const containerByVariant: Record<Variant, string> = {
  primary: "bg-wink-pink",
  secondary: "bg-white border border-wink-pink-border",
  mint: "bg-wink-mint",
  ghost: "bg-transparent",
};

const textByVariant: Record<Variant, string> = {
  primary: "text-white",
  secondary: "text-wink-ink",
  mint: "text-white",
  ghost: "text-wink-pink",
};

const padBySize: Record<Size, string> = {
  sm: "px-3 py-2",
  md: "px-4 py-3",
  lg: "px-5 py-4",
};

const textSizeBySize: Record<Size, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-base",
};

/**
 * Primary app button. One component, used on every screen and every platform —
 * the backbone of the reusable design system.
 */
export function Button({
  title,
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  icon,
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      className={`flex-row items-center justify-center gap-2 rounded-card ${padBySize[size]} ${containerByVariant[variant]} ${fullWidth ? "w-full" : ""} ${isDisabled ? "opacity-50" : "active:opacity-80"}`}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "secondary" || variant === "ghost" ? colors.pink : colors.white}
        />
      ) : (
        <>
          {icon ? <View>{icon}</View> : null}
          <Text className={`font-display ${textByVariant[variant]} ${textSizeBySize[size]}`}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

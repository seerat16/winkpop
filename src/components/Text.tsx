import { Text as RNText, type TextProps } from "react-native";

/**
 * Thin wrapper over RN Text that applies our default ink color and lets every
 * screen use NativeWind `className`. Centralising it means a single place to
 * set the default font / color across all platforms.
 */
export function Text({ className = "", ...props }: TextProps & { className?: string }) {
  return <RNText className={`text-wink-ink ${className}`} {...props} />;
}

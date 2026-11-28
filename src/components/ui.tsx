import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "mint" | "ghost";
type Size = "sm" | "md" | "lg";

const variantClass: Record<Variant, string> = {
  primary: "bg-wink-pink text-white",
  secondary: "bg-white border border-wink-pink-border text-wink-ink",
  mint: "bg-wink-mint text-white",
  ghost: "bg-transparent text-wink-pink",
};

const sizeClass: Record<Size, string> = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-3",
  lg: "px-5 py-4",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  icon?: ReactNode;
  /** Label, as an alternative to children. */
  title?: string;
  /** Alias for onClick (used by screens shared with the native code). */
  onPress?: () => void;
  loading?: boolean;
  accessibilityLabel?: string;
}

/** Shared button used across every screen. */
export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  icon,
  className = "",
  children,
  disabled,
  title,
  onPress,
  onClick,
  loading,
  accessibilityLabel,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      aria-label={accessibilityLabel}
      onClick={onClick ?? (onPress ? () => onPress() : undefined)}
      className={`inline-flex items-center justify-center gap-2 rounded-card font-display font-bold transition active:opacity-80 disabled:opacity-50 ${sizeClass[size]} ${variantClass[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {loading ? "…" : icon}
      {children ?? title}
    </button>
  );
}

/** Pill-shaped filter chip for group / member / era / type / sort selectors. */
export function Chip({
  label,
  active,
  onClick,
  onPress,
  activeColor,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  /** Alias for onClick (used by screens shared with the native code). */
  onPress?: () => void;
  activeColor?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick ?? onPress}
      className={`whitespace-nowrap rounded-pill border px-3 py-1.5 text-xs transition ${
        active ? "border-transparent text-white" : "border-wink-pink-border bg-white text-wink-ink"
      }`}
      style={active ? { background: activeColor ?? "#D4759A" } : undefined}
    >
      {active && !activeColor ? <span className="font-bold">{label}</span> : label}
    </button>
  );
}

/** Friendly empty state for lists. */
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
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <span className="text-5xl">{emoji}</span>
      <p className="mt-3 font-display font-bold text-wink-ink">{title}</p>
      {subtitle && <p className="mt-1 max-w-[260px] text-sm text-wink-muted">{subtitle}</p>}
    </div>
  );
}

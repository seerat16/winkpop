import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "mint" | "ghost";

const variantClass: Record<Variant, string> = {
  primary: "bg-wink-pink text-white",
  secondary: "bg-white border border-wink-pink-border text-wink-ink",
  mint: "bg-wink-mint text-white",
  ghost: "bg-transparent text-wink-pink",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
  icon?: ReactNode;
}

/** Shared button used across every screen. */
export function Button({
  variant = "primary",
  fullWidth,
  icon,
  className = "",
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-card px-4 py-3 font-display font-bold transition active:opacity-80 disabled:opacity-50 ${variantClass[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}

/** Pill-shaped filter chip for group / member / era / type / sort selectors. */
export function Chip({
  label,
  active,
  onClick,
  activeColor,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  activeColor?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
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

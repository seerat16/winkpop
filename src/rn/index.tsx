/**
 * Tiny React-Native-style primitives for the web/Capacitor build.
 *
 * The feature screens were first written against React Native's API
 * (View / Text / Pressable / ScrollView / TextInput / Modal). Instead of
 * maintaining two UI codebases, these components render those primitives as
 * plain DOM elements styled with Tailwind, so the same screens run in the
 * browser and inside the Capacitor WebView on iOS and Android.
 *
 * Only the props the app actually uses are supported. Keep it that way —
 * this is a thin adapter, not a re-implementation of react-native-web.
 */
import {
  useEffect,
  useRef,
  type ChangeEvent,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type UIEvent,
} from "react";

export type StyleProp = CSSProperties | undefined | false | null | (CSSProperties | undefined | false | null)[];

function flatten(style: StyleProp): CSSProperties | undefined {
  if (!style) return undefined;
  if (Array.isArray(style)) return Object.assign({}, ...style.filter(Boolean));
  return style;
}

/** RN Views are flex columns by default; keep that so layouts carry over. */
function flexBase(className = ""): string {
  if (/(^|\s)(hidden|absolute-hidden)(\s|$)/.test(className)) return className;
  const dir = /(^|\s)flex-row(\s|$)/.test(className) ? "flex" : "flex flex-col";
  // RN views are position:relative by default, so absolute children anchor to them.
  const pos = /(^|\s)(absolute|fixed|sticky)(\s|$)/.test(className) ? "" : "relative";
  return `${dir} ${pos} min-w-0 ${className}`.trim();
}

interface A11yProps {
  accessibilityLabel?: string;
  accessibilityRole?: string;
  accessibilityState?: { selected?: boolean; checked?: boolean; disabled?: boolean };
  testID?: string;
}

function a11y({ accessibilityLabel, accessibilityRole, accessibilityState, testID }: A11yProps) {
  const role =
    accessibilityRole === "tab" || accessibilityRole === "checkbox" || accessibilityRole === "switch" || accessibilityRole === "link"
      ? accessibilityRole
      : accessibilityRole === "button"
        ? "button"
        : undefined;
  return {
    "aria-label": accessibilityLabel,
    role,
    "aria-selected": accessibilityRole === "tab" ? accessibilityState?.selected : undefined,
    "aria-checked":
      accessibilityRole === "checkbox" || accessibilityRole === "switch" ? accessibilityState?.checked : undefined,
    "aria-disabled": accessibilityState?.disabled,
    "data-testid": testID,
  };
}

export interface ViewProps extends A11yProps {
  className?: string;
  style?: StyleProp;
  children?: ReactNode;
  pointerEvents?: "none" | "auto";
}

export function View({ className, style, children, pointerEvents, ...rest }: ViewProps) {
  return (
    <div className={flexBase(className)} style={{ ...flatten(style), pointerEvents }} {...a11y(rest)}>
      {children}
    </div>
  );
}

export interface TextProps extends A11yProps {
  className?: string;
  style?: StyleProp;
  children?: ReactNode;
  numberOfLines?: number;
  onPress?: () => void;
}

export function Text({ className = "", style, children, numberOfLines, onPress, ...rest }: TextProps) {
  const clamp: CSSProperties | undefined = numberOfLines
    ? numberOfLines === 1
      ? { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }
      : { display: "-webkit-box", WebkitLineClamp: numberOfLines, WebkitBoxOrient: "vertical", overflow: "hidden" }
    : undefined;
  return (
    <span
      className={className}
      style={{ ...clamp, ...flatten(style), cursor: onPress ? "pointer" : undefined }}
      onClick={onPress}
      {...a11y(rest)}
    >
      {children}
    </span>
  );
}

export interface PressableProps extends ViewProps {
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  hitSlop?: number;
}

/** A focusable, keyboard-accessible tap target (div[role=button]). */
export function Pressable({ className, style, children, onPress, onLongPress, disabled, hitSlop: _hs, ...rest }: PressableProps) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longFired = useRef(false);
  const start = () => {
    if (!onLongPress) return;
    longFired.current = false;
    timer.current = setTimeout(() => {
      longFired.current = true;
      onLongPress();
    }, 500);
  };
  const cancel = () => {
    if (timer.current) clearTimeout(timer.current);
  };
  const ally = a11y(rest);
  return (
    <div
      {...ally}
      role={ally.role ?? "button"}
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      className={`${flexBase(className)} ${disabled ? "opacity-50" : "cursor-pointer"} select-none`}
      style={flatten(style)}
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onContextMenu={(e: MouseEvent) => {
        if (onLongPress) {
          e.preventDefault();
          onLongPress();
        }
      }}
      onClick={(e: MouseEvent) => {
        e.stopPropagation();
        if (disabled || longFired.current) return;
        onPress?.();
      }}
      onKeyDown={(e: KeyboardEvent) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onPress?.();
        }
      }}
    >
      {children}
    </div>
  );
}

export interface ScrollViewProps extends ViewProps {
  horizontal?: boolean;
  pagingEnabled?: boolean;
  contentContainerStyle?: StyleProp;
  showsHorizontalScrollIndicator?: boolean;
  showsVerticalScrollIndicator?: boolean;
  keyboardShouldPersistTaps?: string;
  onMomentumScrollEnd?: (e: { nativeEvent: { contentOffset: { x: number }; layoutMeasurement: { width: number } } }) => void;
}

export function ScrollView({
  horizontal,
  pagingEnabled,
  className = "",
  style,
  contentContainerStyle,
  children,
  onMomentumScrollEnd,
  showsHorizontalScrollIndicator: _h,
  showsVerticalScrollIndicator: _v,
  keyboardShouldPersistTaps: _k,
  ...rest
}: ScrollViewProps) {
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onScroll = (e: UIEvent<HTMLDivElement>) => {
    if (!onMomentumScrollEnd) return;
    const el = e.currentTarget;
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(
      () => onMomentumScrollEnd({ nativeEvent: { contentOffset: { x: el.scrollLeft }, layoutMeasurement: { width: el.clientWidth } } }),
      120,
    );
  };
  return (
    <div
      className={`${horizontal ? "overflow-x-auto overflow-y-hidden no-scrollbar" : "min-h-0 overflow-y-auto"} ${className}`}
      style={{ ...flatten(style), scrollSnapType: pagingEnabled ? "x mandatory" : undefined, WebkitOverflowScrolling: "touch" }}
      onScroll={onScroll}
      {...a11y(rest)}
    >
      <div
        className={horizontal ? "flex w-max flex-row" : "flex flex-col"}
        style={{ ...flatten(contentContainerStyle) }}
      >
        {pagingEnabled
          ? (Array.isArray(children) ? children : [children]).flat().map((c, i) => (
              <div key={i} style={{ scrollSnapAlign: "start" }}>
                {c}
              </div>
            ))
          : children}
      </div>
    </div>
  );
}

export interface TextInputProps extends A11yProps {
  value?: string;
  onChangeText?: (t: string) => void;
  onSubmitEditing?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  placeholderTextColor?: string;
  className?: string;
  style?: StyleProp;
  multiline?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "number-pad" | "decimal-pad" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoComplete?: string;
  maxLength?: number;
  editable?: boolean;
}

const INPUT_MODE: Record<string, "text" | "email" | "numeric" | "decimal" | "tel"> = {
  default: "text",
  "email-address": "email",
  "number-pad": "numeric",
  "decimal-pad": "decimal",
  "phone-pad": "tel",
};

export function TextInput({
  value,
  onChangeText,
  onSubmitEditing,
  onFocus,
  onBlur,
  placeholder,
  placeholderTextColor: _p,
  className = "",
  style,
  multiline,
  secureTextEntry,
  keyboardType = "default",
  autoCapitalize,
  autoComplete,
  maxLength,
  editable = true,
  ...rest
}: TextInputProps) {
  const common = {
    value,
    placeholder,
    maxLength,
    disabled: !editable,
    onFocus,
    onBlur,
    autoCapitalize: autoCapitalize === "none" ? "off" : autoCapitalize,
    autoComplete,
    className: `outline-none placeholder:text-wink-muted ${className}`,
    style: flatten(style),
    ...a11y(rest),
  };
  if (multiline) {
    return <textarea {...common} rows={4} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChangeText?.(e.target.value)} />;
  }
  return (
    <input
      {...common}
      type={secureTextEntry ? "password" : keyboardType === "email-address" ? "email" : "text"}
      inputMode={INPUT_MODE[keyboardType]}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onChangeText?.(e.target.value)}
      onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") onSubmitEditing?.();
      }}
    />
  );
}

/** Full-screen overlay; children decide their own layout (sheets etc.). */
export function Modal({
  visible,
  children,
  onRequestClose,
}: {
  visible: boolean;
  children: ReactNode;
  transparent?: boolean;
  animationType?: string;
  onRequestClose?: () => void;
}) {
  useEffect(() => {
    if (!visible || !onRequestClose) return;
    const onKey = (e: globalThis.KeyboardEvent) => e.key === "Escape" && onRequestClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, onRequestClose]);
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-[100] mx-auto flex max-w-md flex-col" role="dialog" aria-modal="true">
      {children}
    </div>
  );
}

export function ActivityIndicator({ color }: { color?: string }) {
  return (
    <span
      role="progressbar"
      className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent"
      style={{ color }}
    />
  );
}

/** Safe-area aware column; `--sat` / `--sab` come from global.css. */
export function SafeAreaView({ className = "", style, children, edges }: ViewProps & { edges?: ("top" | "bottom")[] }) {
  const e = edges ?? ["top", "bottom"];
  return (
    <div
      className={flexBase(`h-full ${className}`)}
      style={{
        paddingTop: e.includes("top") ? "var(--sat)" : undefined,
        paddingBottom: e.includes("bottom") ? "var(--sab)" : undefined,
        ...flatten(style),
      }}
    >
      {children}
    </div>
  );
}

/** App column width (the shell is capped at max-w-md = 448px). */
export const Dimensions = {
  get: (_w: "window") => ({ width: Math.min(typeof window === "undefined" ? 390 : window.innerWidth, 448) }),
};

export const Linking = {
  openURL: (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
    return Promise.resolve();
  },
};

export const Share = {
  share: async ({ message }: { message: string }) => {
    const nav = navigator as Navigator & { share?: (d: { text: string }) => Promise<void> };
    if (nav.share) {
      await nav.share({ text: message }).catch(() => undefined);
    } else {
      await navigator.clipboard?.writeText(message).catch(() => undefined);
    }
  },
};

import { Modal, Pressable, SafeAreaView, ScrollView, TextInput, type TextInputProps, View } from "@/rn";
import type { ReactNode } from "react";
import { useRouter } from "@/rn/router";
import { BadgeCheck, ChevronLeft, Star, X } from "lucide-react";
import { colors } from "@/theme/colors";
import { Text } from "./Text";

/**
 * Small shared primitives used across the feature screens. Keeping them in one
 * module makes it easy to restyle the whole app from a single place.
 */

/** Page with a back-arrow header (§2C) and optional right-side actions. */
export function Page({
  title,
  right,
  children,
  scroll = true,
  footer,
  onBack,
}: {
  title: string;
  right?: ReactNode;
  children: ReactNode;
  scroll?: boolean;
  footer?: ReactNode;
  onBack?: () => void;
}) {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-wink-purple-tint" edges={["top"]}>
      <View className="flex-row items-center gap-3 px-4 py-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onBack ?? (() => router.back())}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full bg-white"
        >
          <ChevronLeft size={20} color={colors.ink} />
        </Pressable>
        <Text className="flex-1 font-display text-lg text-wink-ink" numberOfLines={1}>
          {title}
        </Text>
        {right}
      </View>
      {scroll ? (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingLeft: 16, paddingRight: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View className="flex-1">{children}</View>
      )}
      {footer ? <View className="border-t border-wink-pink-border bg-white px-4 pb-8 pt-3">{footer}</View> : null}
    </SafeAreaView>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <View className={`rounded-card border border-wink-pink-border bg-white p-4 ${className}`}>{children}</View>;
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View className="mb-2 mt-5 flex-row items-center justify-between">
      <Text className="font-display text-wink-ink">{title}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8} accessibilityRole="button">
          <Text className="text-sm text-wink-pink">{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Underlined tab strip with optional counts, e.g. "Incoming (2)" (§9C). */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { key: T; label: string; count?: number }[];
  value: T;
  onChange: (k: T) => void;
}) {
  return (
    <View className="mb-3 flex-row rounded-pill bg-white p-1">
      {tabs.map((t) => {
        const on = t.key === value;
        return (
          <Pressable
            key={t.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(t.key)}
            className={`flex-1 items-center rounded-pill py-2 ${on ? "bg-wink-pink" : ""}`}
          >
            <Text className={`text-xs ${on ? "font-display text-white" : "text-wink-muted"}`} numberOfLines={1}>
              {t.label}
              {t.count != null ? ` (${t.count})` : ""}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Toggle({ value, onChange, label, sub }: { value: boolean; onChange: (v: boolean) => void; label: string; sub?: string }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      onPress={() => onChange(!value)}
      className="flex-row items-center justify-between py-2.5"
    >
      <View className="flex-1 pr-3">
        <Text className="text-wink-ink">{label}</Text>
        {sub ? <Text className="text-xs text-wink-muted">{sub}</Text> : null}
      </View>
      <View className="h-6 w-11 rounded-full p-0.5" style={{ backgroundColor: value ? colors.pink : "#ddd" }}>
        <View className="h-5 w-5 rounded-full bg-white" style={{ marginLeft: value ? 20 : 0 }} />
      </View>
    </Pressable>
  );
}

interface FieldProps {
  label?: string;
  error?: string | null;
  hint?: string;
  counter?: { value: number; max: number };
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: TextInputProps["keyboardType"];
  autoCapitalize?: TextInputProps["autoCapitalize"];
  secureTextEntry?: boolean;
  maxLength?: number;
  onSubmitEditing?: () => void;
  testID?: string;
  accessibilityLabel?: string;
}

export function Field({ label, error, hint, counter, ...props }: FieldProps) {
  return (
    <View className="mb-3">
      {label ? (
        <View className="mb-1 flex-row justify-between">
          <Text className="text-xs text-wink-muted">{label}</Text>
          {counter ? (
            <Text className={`text-xs ${counter.value > counter.max ? "text-wink-pink" : "text-wink-muted"}`}>
              {counter.value}/{counter.max}
            </Text>
          ) : null}
        </View>
      ) : null}
      <TextInput
        placeholderTextColor={colors.muted}
        className="rounded-card border bg-white px-4 py-3 text-wink-ink"
        style={{ borderColor: error ? colors.pink : colors.pinkBorder, minHeight: props.multiline ? 80 : undefined }}
        {...props}
      />
      {error ? <Text className="mt-1 text-xs text-wink-pink">{error}</Text> : null}
      {!error && hint ? <Text className="mt-1 text-xs text-wink-muted">{hint}</Text> : null}
    </View>
  );
}

export function Avatar({ name, color, size = 40, ring }: { name: string; color?: string; size?: number; ring?: string }) {
  return (
    <View
      className="items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        backgroundColor: color ?? colors.purpleSoft,
        borderWidth: ring ? 2.5 : 0,
        borderColor: ring,
      }}
    >
      <Text className="font-display text-white" style={{ fontSize: size * 0.36 }}>
        {name.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase() || "?"}
      </Text>
    </View>
  );
}

export function Stars({ value, size = 12 }: { value: number; size?: number }) {
  return (
    <View className="flex-row" accessibilityLabel={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} color={colors.warn} fill={i <= Math.round(value) ? colors.warn : "none"} />
      ))}
    </View>
  );
}

export function Pill({ label, color = colors.purple, bg = colors.purpleTint }: { label: string; color?: string; bg?: string }) {
  return (
    <View className="rounded-pill px-2 py-0.5" style={{ backgroundColor: bg }}>
      <Text style={{ color, fontSize: 10 }}>{label}</Text>
    </View>
  );
}

export function Verified({ size = 14 }: { size?: number }) {
  return <BadgeCheck size={size} color={colors.mint} aria-label="Verified" />;
}

/** Bottom sheet modal used for menus, pickers and confirmations. */
export function Sheet({
  visible,
  onClose,
  title,
  children,
  full,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  full?: boolean;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <Pressable className="flex-1" onPress={onClose} accessibilityLabel="Close" />
        <View className="overflow-hidden rounded-t-3xl bg-white px-5 pb-10 pt-5" style={{ maxHeight: full ? "92%" : "80%" }}>
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="font-display text-lg text-wink-ink">{title ?? ""}</Text>
            <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Close sheet">
              <X size={20} color={colors.muted} />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/** One tappable row inside a sheet/menu. */
export function MenuItem({
  label,
  onPress,
  icon,
  danger,
  sub,
}: {
  label: string;
  onPress: () => void;
  icon?: ReactNode;
  danger?: boolean;
  sub?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="flex-row items-center gap-3 border-b border-wink-pink-border py-3.5 active:opacity-70"
    >
      {icon}
      <View className="flex-1">
        <Text className={danger ? "text-wink-pink" : "text-wink-ink"}>{label}</Text>
        {sub ? <Text className="text-xs text-wink-muted">{sub}</Text> : null}
      </View>
    </Pressable>
  );
}

/** Inline notice used for errors, tips and confirmations. */
export function Notice({ text, tone = "info" }: { text: string; tone?: "info" | "error" | "success" }) {
  const map = {
    info: { bg: colors.purpleTint, fg: colors.purple },
    error: { bg: colors.pinkTint, fg: colors.pink },
    success: { bg: colors.mintTint, fg: "#2E8B6E" },
  }[tone];
  return (
    <View className="my-2 rounded-card px-4 py-3" style={{ backgroundColor: map.bg }}>
      <Text className="text-sm" style={{ color: map.fg }}>
        {text}
      </Text>
    </View>
  );
}

/** Horizontal step progress bar for multi-step flows (§1X, §12B). */
export function Progress({ step, total }: { step: number; total: number }) {
  return (
    <View className="mb-4 h-1.5 flex-row overflow-hidden rounded-full bg-white" accessibilityLabel={`Step ${step} of ${total}`}>
      <View className="h-full rounded-full bg-wink-pink" style={{ width: `${(step / total) * 100}%` }} />
    </View>
  );
}



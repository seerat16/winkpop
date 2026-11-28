import { Pressable, View } from "@/rn";
import { useRouter } from "@/rn/router";
import { ChevronRight } from "lucide-react";
import { Page, Text, Toggle } from "@/components";
import { useAppStore } from "@/data/appStore";
import { useUserStore } from "@/data/userStore";
import { colors } from "@/theme/colors";

/** Settings (§20, §23, Mercari-style account / preference / payment / selling tools). */
export default function SettingsScreen() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const updateUser = useUserStore((s) => s.updateUser);
  const logout = useUserStore((s) => s.logout);
  const reset = useAppStore((s) => s.reset);
  if (!user) return null;

  const sections: { title: string; items: { label: string; href?: string; onPress?: () => void; sub?: string }[] }[] = [
    {
      title: "Account",
      items: [
        { label: "Edit profile", href: "/edit-profile" },
        { label: "Collecting groups", href: "/edit-collecting" },
        { label: "Shipping options & address", href: "/settings/shipping" },
        { label: "Payments, wallet & points", href: "/settings/payments", sub: `$${user.walletBalance.toFixed(2)} · ${user.points} pts` },
        { label: "Highlights", href: "/highlights" },
        { label: "Invite friends", href: "/invite", sub: "Share your invite link — you both earn points" },
      ],
    },
    {
      title: "Preferences",
      items: [
        { label: "Notifications & smart matches", href: "/settings/notifications" },
        { label: "Tutorial, glossary & packing guide", href: "/tutorial" },
      ],
    },
    {
      title: "Trust & safety",
      items: [
        { label: "Safety centre & fake card database", href: "/safety" },
        { label: "Your reviews", href: `/reviews/${user.username}` },
        { label: "Blocked users", href: "/settings/blocked", sub: `${user.blocked.length} blocked` },
      ],
    },
    {
      title: "About",
      items: [
        { label: "Join the WinKPop Discord", href: "/community" },
        { label: "Open-source licenses" },
        { label: "Privacy policy" },
        { label: "Reset demo data", onPress: () => reset() },
      ],
    },
  ];

  return (
    <Page title="Settings">
      <View className="mb-5 overflow-hidden rounded-card border border-wink-pink-border bg-white px-4">
        <Toggle label="International trading" sub="Show and accept listings from other countries" value={user.internationalTrading} onChange={(v) => updateUser({ internationalTrading: v })} />
        <Toggle label="Vacation mode" sub="Pauses your listings and shows 'Vacation mode' on your profile" value={user.availability === "vacation"} onChange={(v) => updateUser({ availability: v ? "vacation" : "available" })} />
        <Toggle label="Private account" value={user.isPrivate} onChange={(v) => updateUser({ isPrivate: v })} />
        <Toggle label="Liking a listing also adds it to my cart" value={user.likeAddsToCart} onChange={(v) => updateUser({ likeAddsToCart: v })} />
        <Toggle label="Dark mode" sub="Beta — status bar and backgrounds" value={user.darkMode} onChange={(v) => updateUser({ darkMode: v })} />
      </View>
      {sections.map((section) => (
        <View key={section.title} className="mb-5">
          <Text className="mb-2 text-xs uppercase tracking-wide text-wink-muted">{section.title}</Text>
          <View className="overflow-hidden rounded-card border border-wink-pink-border bg-white">
            {section.items.map((item, i) => (
              <Pressable
                key={item.label}
                onPress={item.onPress ?? (item.href ? () => router.push(item.href!) : undefined)}
                className={`flex-row items-center px-4 py-3.5 ${i > 0 ? "border-t border-wink-pink-border" : ""} active:bg-wink-purple-tint`}
              >
                <View className="flex-1">
                  <Text className="text-wink-ink">{item.label}</Text>
                  {item.sub ? <Text className="text-xs text-wink-muted">{item.sub}</Text> : null}
                </View>
                {item.href ? <ChevronRight size={16} color={colors.muted} /> : null}
              </Pressable>
            ))}
          </View>
        </View>
      ))}
      <Pressable onPress={logout} className="mb-3 items-center rounded-card border border-wink-pink-border bg-white py-3.5">
        <Text className="text-wink-pink">Log out</Text>
      </Pressable>
      <Pressable onPress={() => { reset(); logout(); }} className="mb-4 items-center">
        <Text className="text-xs text-wink-muted">Close account</Text>
      </Pressable>
      <Text className="text-center text-xs text-wink-muted">WinKPop v0.2.0 · MIT licensed · Built with Expo</Text>
    </Page>
  );
}

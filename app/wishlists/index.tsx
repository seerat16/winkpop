import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { Star } from "lucide-react-native";
import { Button, Chip, EmptyState, Page, Pill, SectionTitle, Text } from "@/components";
import { CATALOG, findWishlistMatches, GROUP_MAP, type PriorityLevel, type WishlistTag } from "@/data";
import { allListings, useAppStore, EMPTY } from "@/data/appStore";
import { useUserStore } from "@/data/userStore";
import { colors } from "@/theme/colors";

/**
 * Wishlists (§12): saved count with priority lists first, folders, priority
 * levels, WTT / WTB / ISO tags, group filter, pre-made templates, live match
 * counts, and the first-wishlist prompt.
 */
export default function WishlistsScreen() {
  const router = useRouter();
  const wishlists = useAppStore((s) => s.wishlists);
  const createWishlist = useAppStore((s) => s.createWishlist);
  const collecting = useUserStore((s) => s.user?.collectingGroupIds ?? EMPTY);
  const [folder, setFolder] = useState<string | null>(null);
  const [level, setLevel] = useState<PriorityLevel | null>(null);
  const [tag, setTag] = useState<WishlistTag | null>(null);
  const [group, setGroup] = useState<string | null>(null);

  const listings = useMemo(() => allListings(), []);
  const folders = [...new Set(wishlists.map((w) => w.folder).filter(Boolean) as string[])];
  const shown = wishlists
    .filter((w) => (!folder || w.folder === folder) && (!level || w.level === level) && (!tag || w.tag === tag) && (!group || w.groupId === group))
    .sort((a, b) => Number(b.priority) - Number(a.priority) || ({ high: 0, medium: 1, low: 2 }[a.level] - { high: 0, medium: 1, low: 2 }[b.level]));

  const templates = collecting.flatMap((g) => {
    const grp = GROUP_MAP[g];
    if (!grp) return [];
    return [
      { label: `${grp.name} · ${grp.eras[0]} full album set`, groupId: g, ids: CATALOG.filter((c) => c.groupId === g && c.era === grp.eras[0] && c.category === "Album").map((c) => c.id) },
      { label: `${grp.name} · all POBs`, groupId: g, ids: CATALOG.filter((c) => c.groupId === g && c.category === "Pre-order Benefit").map((c) => c.id) },
    ];
  });

  return (
    <Page title="Wishlists" right={<Button size="sm" title="+ New" onPress={() => router.push("/wishlists/new")} />}>
      <Text className="mb-3 text-sm text-wink-muted">{wishlists.length} saved wishlists</Text>

      {wishlists.length === 0 ? (
        <>
          <EmptyState emoji="💜" title="Build your first wishlist" subtitle="We'll alert you the moment a card on it is listed." />
          <Button title="Create a wishlist" fullWidth onPress={() => router.push("/wishlists/new")} />
        </>
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
            <View className="flex-row gap-2">
              {folders.map((f) => (
                <Chip key={f} label={`📁 ${f}`} active={folder === f} onPress={() => setFolder(folder === f ? null : f)} />
              ))}
              {(["high", "medium", "low"] as PriorityLevel[]).map((l) => (
                <Chip key={l} label={`${l} prio`} active={level === l} onPress={() => setLevel(level === l ? null : l)} />
              ))}
              {(["WTB", "WTT", "ISO"] as WishlistTag[]).map((t) => (
                <Chip key={t} label={t} active={tag === t} onPress={() => setTag(tag === t ? null : t)} />
              ))}
              {[...new Set(wishlists.map((w) => w.groupId))].map((g) => (
                <Chip key={g} label={GROUP_MAP[g]?.name ?? g} active={group === g} onPress={() => setGroup(group === g ? null : g)} />
              ))}
            </View>
          </ScrollView>
          {shown.map((w) => {
            const matches = findWishlistMatches([w], listings).length;
            return (
              <Pressable key={w.id} onPress={() => router.push(`/wishlists/${w.id}`)} className="mb-3 rounded-card border border-wink-pink-border bg-white p-4">
                <View className="flex-row items-center gap-2">
                  {w.priority ? <Star size={14} color={colors.warn} fill={colors.warn} /> : null}
                  <Text className="flex-1 font-display text-wink-ink">{w.name}</Text>
                  {w.tag ? <Pill label={w.tag} /> : null}
                </View>
                <Text className="text-xs text-wink-muted">
                  {GROUP_MAP[w.groupId]?.name} · {w.cardIds.length + w.descriptions.length} cards · {w.level} priority{w.folder ? ` · 📁 ${w.folder}` : ""}
                </Text>
                {matches ? <Text className="mt-1 text-xs" style={{ color: "#2E8B6E" }}>✨ {matches} listed now</Text> : null}
              </Pressable>
            );
          })}
        </>
      )}

      {templates.length ? (
        <>
          <SectionTitle title="Start from a template" />
          {templates.map((t) => (
            <Pressable
              key={t.label}
              onPress={() => {
                const id = createWishlist({ name: t.label.slice(0, 40), groupId: t.groupId, cardIds: t.ids, descriptions: [], priority: false, level: "medium", tag: "WTB", showOnProfile: false });
                router.push(`/wishlists/${id}`);
              }}
              className="mb-2 flex-row items-center justify-between rounded-card bg-white px-4 py-3"
            >
              <Text className="text-sm text-wink-ink">{t.label}</Text>
              <Text className="text-xs text-wink-muted">{t.ids.length} cards · edit after</Text>
            </Pressable>
          ))}
        </>
      ) : null}
    </Page>
  );
}

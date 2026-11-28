import { Pressable, View } from "@/rn";
import { useRouter } from "@/rn/router";
import { Bookmark } from "lucide-react";
import { Button, EmptyState, Page, PhotocardImage, PostCard, SectionTitle, Text } from "@/components";
import type { Photocard } from "@/data";
import { getAnyListing, useAppStore } from "@/data/appStore";
import { useUserStore } from "@/data/userStore";
import { colors } from "@/theme/colors";

/** Saved listings and saved posts / folders (§7J, §15K–L). */
export default function SavesScreen() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const toggleSave = useUserStore((s) => s.toggleSave);
  const posts = useAppStore((s) => s.posts);
  const folders = useAppStore((s) => s.savedFolders);
  const cards = (user?.savedIds ?? []).map(getAnyListing).filter((c): c is Photocard => Boolean(c));
  const savedPosts = posts.filter((p) => p.savedBy.includes(user?.username ?? ""));

  return (
    <Page title="Saved" right={<Pressable onPress={() => router.push("/saved-folders")}><Text className="text-sm text-wink-pink">Folders</Text></Pressable>}>
      <Text className="mb-2 text-sm text-wink-muted">{cards.length} saved listings</Text>
      {cards.length === 0 ? (
        <>
          <EmptyState emoji="🔖" title="No saved listings" />
          <Button title="Browse listings" fullWidth onPress={() => router.push("/(tabs)/browse")} />
        </>
      ) : (
        cards.map((c) => (
          <Pressable key={c.id} onPress={() => router.push(`/card/${c.id}`)} className="mb-2 flex-row items-center gap-3 rounded-card border border-wink-pink-border bg-white p-3">
            <View className="w-12">
              <PhotocardImage groupId={c.groupId} memberName={c.memberName} imgSeed={c.imgSeed} />
            </View>
            <View className="flex-1">
              <Text className="font-display text-wink-ink">{c.memberName} · {c.era}</Text>
              <Text className="text-xs text-wink-muted">${c.price.toFixed(2)} · @{c.sellerUsername}</Text>
            </View>
            <Pressable accessibilityLabel="Remove from saves" onPress={() => toggleSave(c.id)} hitSlop={8}>
              <Bookmark size={18} color={colors.purple} fill={colors.purple} />
            </Pressable>
          </Pressable>
        ))
      )}
      <SectionTitle title={`Saved posts (${savedPosts.length})`} />
      {savedPosts.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
      {Object.keys(folders).length ? (
        <Text className="text-xs text-wink-muted">{Object.keys(folders).length} folders · manage them under Folders</Text>
      ) : null}
    </Page>
  );
}

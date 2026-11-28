import { Pressable, ScrollView, View } from "@/rn";
import { Linking } from "@/rn/platform";
import { useRouter } from "@/rn/router";
import { Plus } from "lucide-react";
import type { Badge, Highlight } from "@/data";
import { colors } from "@/theme/colors";
import { PhotocardImage } from "./PhotocardImage";
import { Text } from "./Text";

/** Heart-shaped highlight bubbles shown under the bio (§14P). */
export function HighlightsRow({ owner, highlights, own }: { owner: string; highlights: Highlight[]; own: boolean }) {
  const router = useRouter();
  if (!own && highlights.length === 0) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
      <View className="flex-row gap-3">
        {highlights.map((h) => (
          <Pressable key={h.id} accessibilityLabel={`${h.title} highlight`} onPress={() => router.push(`/story/${owner}?highlight=${h.id}`)} className="items-center">
            <View className="h-14 w-14 items-center justify-center">
              <Text style={{ fontSize: 52, lineHeight: 58, color: colors.pinkBorder, position: "absolute" }}>♥</Text>
              <View className="h-9 w-9 overflow-hidden rounded-full">
                <PhotocardImage groupId="ive" memberName="" imgSeed={h.coverSeed} aspectRatio={1} />
              </View>
            </View>
            <Text className="text-wink-ink" style={{ fontSize: 10 }}>
              {h.title}
            </Text>
          </Pressable>
        ))}
        {own ? (
          <Pressable accessibilityLabel="New highlight" onPress={() => router.push("/highlights")} className="items-center">
            <View className="h-14 w-14 items-center justify-center rounded-full border border-dashed border-wink-pink-border">
              <Plus size={18} color={colors.muted} />
            </View>
            <Text className="text-wink-muted" style={{ fontSize: 10 }}>
              New
            </Text>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}

export function BadgesRow({ badges }: { badges: Badge[] }) {
  return (
    <View className="mt-2 flex-row flex-wrap justify-center gap-1">
      {badges.map((b) => (
        <View key={b.id} className="rounded-pill bg-wink-purple-tint px-2 py-0.5">
          <Text style={{ fontSize: 10 }} className="text-wink-purple">
            {b.emoji} {b.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function SocialLinks({ link, socials }: { link?: string; socials: { instagram?: string; tiktok?: string; youtube?: string } }) {
  const items = [
    link ? { label: link.replace(/^https?:\/\//, ""), url: link } : null,
    socials.instagram ? { label: `IG @${socials.instagram}`, url: `https://instagram.com/${socials.instagram}` } : null,
    socials.tiktok ? { label: `TikTok @${socials.tiktok}`, url: `https://tiktok.com/@${socials.tiktok}` } : null,
    socials.youtube ? { label: `YouTube ${socials.youtube}`, url: `https://youtube.com/@${socials.youtube}` } : null,
  ].filter(Boolean) as { label: string; url: string }[];
  if (!items.length) return null;
  return (
    <View className="mt-1 flex-row flex-wrap justify-center gap-2">
      {items.map((i) => (
        <Pressable key={i.url} onPress={() => Linking.openURL(i.url)}>
          <Text className="text-xs text-wink-purple">{i.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Render a bio with tappable @mentions (§23O). */
export function BioText({ text }: { text: string }) {
  const router = useRouter();
  const parts = text.split(/(@[a-z0-9._]+)/gi);
  return (
    <Text className="mt-2 text-center text-sm text-wink-ink">
      {parts.map((p, i) =>
        p.startsWith("@") ? (
          <Text key={i} className="text-wink-purple" onPress={() => router.push(`/user/${p.slice(1)}`)}>
            {p}
          </Text>
        ) : (
          p
        ),
      )}
    </Text>
  );
}

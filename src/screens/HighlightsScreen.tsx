import { useState } from "react";
import { Pressable, ScrollView, View } from "@/rn";
import { useRouter } from "@/rn/router";
import { Check } from "lucide-react";
import { Button, Card, Chip, EmptyState, Field, Page, PhotocardImage, SectionTitle, Text } from "@/components";
import { useAppStore } from "@/data/appStore";
import { useUserStore } from "@/data/userStore";
import { colors } from "@/theme/colors";

/**
 * Manage highlights (§14L–Q): create from any posted (incl. archived) story,
 * hold as many stories as you like, edit which stories are in it, rename,
 * re-cover, delete — e.g. a single "Proofs" highlight.
 */
export default function HighlightsScreen() {
  const router = useRouter();
  const me = useUserStore((s) => s.user?.username ?? "");
  const allStories = useAppStore((s) => s.stories);
  const allHighlights = useAppStore((s) => s.highlights);
  const stories = allStories.filter((x) => x.author === me);
  const highlights = allHighlights.filter((h) => h.owner === me);
  const create = useAppStore((s) => s.createHighlight);
  const update = useAppStore((s) => s.updateHighlight);
  const remove = useAppStore((s) => s.deleteHighlight);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [title, setTitle] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [cover, setCover] = useState<number | undefined>();

  const start = (id: string | "new") => {
    const h = highlights.find((x) => x.id === id);
    setEditing(id);
    setTitle(h?.title ?? "Proofs");
    setSelected(h?.storyIds ?? []);
    setCover(h?.coverSeed);
  };

  return (
    <Page title="Highlights">
      {editing ? (
        <>
          <Field label="Title" value={title} onChangeText={setTitle} />
          <Text className="mb-2 text-xs text-wink-muted">{selected.length} stories selected · tap to add/remove, long-press to set cover</Text>
          <View className="flex-row flex-wrap gap-2">
            {stories.map((s) => {
              const on = selected.includes(s.id);
              return (
                <Pressable
                  key={s.id}
                  onPress={() => setSelected((x) => (on ? x.filter((y) => y !== s.id) : [...x, s.id]))}
                  onLongPress={() => setCover(s.seed)}
                  className="w-[31%]"
                >
                  <PhotocardImage groupId="ive" memberName={cover === s.seed ? "★" : ""} imgSeed={s.seed} aspectRatio={9 / 16} />
                  {on ? (
                    <View className="absolute right-1 top-1 h-6 w-6 items-center justify-center rounded-full bg-wink-pink">
                      <Check size={14} color={colors.white} />
                    </View>
                  ) : null}
                  <Text className="text-wink-muted" style={{ fontSize: 9 }} numberOfLines={1}>
                    {s.text ?? new Date(s.createdAt).toLocaleDateString()}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {stories.length === 0 ? <EmptyState emoji="📸" title="Post a story first" /> : null}
          <View className="mt-4 gap-2">
            <Button
              title="Save highlight"
              fullWidth
              disabled={!title.trim() || !selected.length}
              onPress={() => {
                if (editing === "new") create(title.trim(), selected);
                else update(editing, { title: title.trim(), storyIds: selected, coverSeed: cover ?? stories.find((s) => s.id === selected[0])?.seed ?? 1 });
                setEditing(null);
              }}
            />
            {editing !== "new" ? <Button title="Delete highlight" variant="ghost" fullWidth onPress={() => { remove(editing); setEditing(null); }} /> : null}
            <Button title="Cancel" variant="secondary" fullWidth onPress={() => setEditing(null)} />
          </View>
        </>
      ) : (
        <>
          <Button title="+ New highlight" fullWidth onPress={() => start("new")} />
          <SectionTitle title="Your highlights" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-3">
              {highlights.map((h) => (
                <Card key={h.id} className="w-32 items-center">
                  <Pressable onPress={() => router.push(`/story/${me}?highlight=${h.id}`)}>
                    <View className="h-16 w-16 overflow-hidden rounded-full">
                      <PhotocardImage groupId="ive" memberName="♥" imgSeed={h.coverSeed} aspectRatio={1} />
                    </View>
                  </Pressable>
                  <Text className="mt-1 font-display text-sm text-wink-ink">{h.title}</Text>
                  <Text className="text-xs text-wink-muted">{h.storyIds.length} stories</Text>
                  <Chip label="Edit" onPress={() => start(h.id)} />
                </Card>
              ))}
            </View>
          </ScrollView>
        </>
      )}
    </Page>
  );
}

import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { Camera, Image as ImageIcon, X } from "lucide-react-native";
import { Button, Chip, Field, Page, PhotocardImage, SectionTitle, Text, Toggle } from "@/components";
import { COMMUNITY_USERS } from "@/data";
import { useAppStore, EMPTY } from "@/data/appStore";
import { useUserStore } from "@/data/userStore";
import { colors } from "@/theme/colors";

const FILTERS = ["None", "Soft", "Vivid", "Mono", "Pastel"];

/**
 * Create stories (§14A–F, §14J): several photos/videos at once, music, text,
 * drawing, filters, collage, trim/resize/mute, tagging, Close Friends or hide
 * from specific accounts, and cancel before posting.
 */
export default function NewStoryScreen() {
  const router = useRouter();
  const addStories = useAppStore((s) => s.addStories);
  const closeFriends = useUserStore((s) => s.user?.closeFriends ?? EMPTY);
  const [items, setItems] = useState<{ seed: number; video: boolean }[]>([]);
  const [text, setText] = useState("");
  const [song, setSong] = useState("");
  const [filter, setFilter] = useState("None");
  const [drawing, setDrawing] = useState(false);
  const [collage, setCollage] = useState(false);
  const [muted, setMuted] = useState(false);
  const [trim, setTrim] = useState("15");
  const [tags, setTags] = useState("");
  const [cf, setCf] = useState(false);
  const [hidden, setHidden] = useState<string[]>([]);

  const add = (video: boolean) => setItems((i) => [...i, { seed: Math.floor(Math.random() * 9000) + 1000, video }]);
  const post = () => {
    addStories(
      (collage ? items.slice(0, 1) : items).map((it) => ({
        seed: it.seed,
        text: [text, collage ? `collage of ${items.length}` : "", drawing ? "✏️" : ""].filter(Boolean).join(" ") || undefined,
        song: song || undefined,
        filter: filter === "None" ? undefined : filter,
        closeFriends: cf,
        hiddenFrom: hidden,
        taggedAccounts: tags.split(/\s+/).map((t) => t.replace("@", "")).filter(Boolean),
      })),
    );
    router.back();
  };

  return (
    <Page
      title="New story"
      footer={
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button title="Cancel" variant="secondary" fullWidth onPress={() => router.back()} />
          </View>
          <View className="flex-1">
            <Button title={cf ? "Share to Close Friends" : "Share to story"} fullWidth disabled={!items.length} onPress={post} />
          </View>
        </View>
      }
    >
      <View className="mb-3 flex-row gap-2">
        <View className="flex-1">
          <Button title="Camera" variant="secondary" fullWidth icon={<Camera size={16} color={colors.ink} />} onPress={() => add(false)} />
        </View>
        <View className="flex-1">
          <Button title="Camera roll" variant="secondary" fullWidth icon={<ImageIcon size={16} color={colors.ink} />} onPress={() => { add(false); add(true); }} />
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2">
          {items.map((it, i) => (
            <View key={i} className="w-24">
              <PhotocardImage groupId="ive" memberName={it.video ? "▶" : "📷"} imgSeed={it.seed} aspectRatio={9 / 16} />
              {text ? <Text className="absolute bottom-3 left-1 right-1 text-center font-display text-white" style={{ fontSize: 10 }}>{text}</Text> : null}
              <Pressable accessibilityLabel={`Remove story ${i + 1}`} onPress={() => setItems((x) => x.filter((_, y) => y !== i))} className="absolute right-1 top-1 h-5 w-5 items-center justify-center rounded-full bg-black/60">
                <X size={11} color={colors.white} />
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>
      <SectionTitle title="Edit" />
      <Field label="Text" value={text} onChangeText={setText} placeholder="Say something" />
      <Field label="Music" value={song} onChangeText={setSong} placeholder="Song name" />
      <View className="mb-2 flex-row flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Chip key={f} label={f} active={filter === f} onPress={() => setFilter(f)} />
        ))}
      </View>
      <Toggle label="Draw on story" value={drawing} onChange={setDrawing} />
      <Toggle label="Make a collage" value={collage} onChange={setCollage} />
      {items.some((i) => i.video) ? (
        <>
          <Toggle label="Mute video sound" value={muted} onChange={setMuted} />
          <Field label="Trim video to (seconds)" keyboardType="number-pad" value={trim} onChangeText={setTrim} />
        </>
      ) : null}
      <SectionTitle title="Audience" />
      <Field label="Tag accounts" value={tags} onChangeText={setTags} autoCapitalize="none" placeholder="@pcfairy" />
      <Toggle label="Close Friends only" sub={`${closeFriends.length} people on your list`} value={cf} onChange={setCf} />
      <Text className="mb-2 mt-2 text-sm text-wink-ink">Hide story from</Text>
      <View className="flex-row flex-wrap gap-2">
        {COMMUNITY_USERS.map((u) => (
          <Chip key={u.username} label={`@${u.username}`} active={hidden.includes(u.username)} onPress={() => setHidden((h) => (h.includes(u.username) ? h.filter((x) => x !== u.username) : [...h, u.username]))} />
        ))}
      </View>
    </Page>
  );
}

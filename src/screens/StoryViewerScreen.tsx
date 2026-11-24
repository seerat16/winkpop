import { Pressable, SafeAreaView, Share, TextInput, View } from "@/rn";
import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "@/rn/router";
import { Eye, Heart, MoreHorizontal, Send, X } from "lucide-react";
import { Avatar, avatarColorFor, MenuItem, PhotocardImage, Sheet, Text, timeAgo } from "@/components";
import { useAppStore } from "@/data/appStore";
import { useUserStore } from "@/data/userStore";
import { colors } from "@/theme/colors";

const STORY_MS = 5000;

/**
 * Full-screen story / highlight viewer (§14G–K, §14S–U): auto-advancing
 * progress bars, tap left/right, time posted, viewers (own), like & reply,
 * send to others, and owner actions (delete, archive, save, add to highlight).
 * Pass `?highlight=<id>` to play a highlight instead of live stories.
 */
export default function StoryViewer() {
  const { username, highlight } = useLocalSearchParams<{ username: string; highlight?: string }>();
  const router = useRouter();
  const me = useUserStore((s) => s.user?.username ?? "");
  const allStories = useAppStore((s) => s.stories);
  const highlights = useAppStore((s) => s.highlights);
  const viewStory = useAppStore((s) => s.viewStory);
  const toggleLikeStory = useAppStore((s) => s.toggleLikeStory);
  const deleteStory = useAppStore((s) => s.deleteStory);
  const archiveStory = useAppStore((s) => s.archiveStory);
  const updateHighlight = useAppStore((s) => s.updateHighlight);
  const createHighlight = useAppStore((s) => s.createHighlight);
  const openConversation = useAppStore((s) => s.openConversation);
  const sendMessage = useAppStore((s) => s.sendMessage);

  const hl = highlights.find((h) => h.id === highlight);
  const stories = useMemo(() => {
    if (hl) return hl.storyIds.map((id) => allStories.find((s) => s.id === id)).filter((s): s is NonNullable<typeof s> => Boolean(s));
    return allStories
      .filter((s) => s.author === username && !s.archived && Date.now() - new Date(s.createdAt).getTime() < 24 * 3600e3)
      .filter((s) => !s.hiddenFrom.includes(me))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }, [allStories, hl, username, me]);

  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reply, setReply] = useState("");
  const [menu, setMenu] = useState(false);
  const [viewers, setViewers] = useState(false);
  const story = stories[index];
  const isMine = story?.author === me;

  useEffect(() => {
    if (story) viewStory(story.id);
    setProgress(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id]);

  useEffect(() => {
    if (!story || paused) return;
    const t = setInterval(() => setProgress((p) => p + 100 / (STORY_MS / 100)), 100);
    return () => clearInterval(t);
  }, [story, paused]);

  useEffect(() => {
    if (progress < 100) return;
    if (index < stories.length - 1) setIndex((i) => i + 1);
    else router.back();
  }, [progress, index, stories.length, router]);

  if (!story) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-black">
        <Text className="text-white">No stories right now.</Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="text-wink-pink">Close</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const liked = story.likedBy.includes(me);

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* progress bars */}
      <View className="flex-row gap-1 px-3 pt-2">
        {stories.map((s, i) => (
          <View key={s.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
            <View className="h-full bg-white" style={{ width: `${i < index ? 100 : i === index ? Math.min(progress, 100) : 0}%` }} />
          </View>
        ))}
      </View>
      <View className="flex-row items-center gap-2 px-3 py-3">
        <Avatar name={story.author} color={avatarColorFor(story.author)} size={30} />
        <Text className="font-display text-white">{hl ? hl.title : story.author}</Text>
        <Text className="text-xs text-white/70">{timeAgo(story.createdAt)}</Text>
        {story.closeFriends ? <Text className="rounded bg-wink-mint px-1.5 text-white" style={{ fontSize: 9 }}>Close friends</Text> : null}
        <View className="flex-1" />
        {isMine ? (
          <Pressable accessibilityLabel="Story options" onPress={() => { setPaused(true); setMenu(true); }} hitSlop={8}>
            <MoreHorizontal size={20} color={colors.white} />
          </Pressable>
        ) : null}
        <Pressable accessibilityLabel="Close story" onPress={() => router.back()} hitSlop={8}>
          <X size={22} color={colors.white} />
        </Pressable>
      </View>

      <View className="flex-1 justify-center px-3">
        <PhotocardImage groupId="ive" memberName={story.filter ?? "✨"} imgSeed={story.seed} aspectRatio={9 / 14} />
        {story.text ? (
          <View className="absolute left-6 right-6 top-1/2 items-center">
            <Text className="rounded-card bg-black/40 px-3 py-2 text-center font-display text-lg text-white">{story.text}</Text>
          </View>
        ) : null}
        {story.song ? <Text className="absolute left-6 top-6 rounded-pill bg-black/40 px-3 py-1 text-xs text-white">♪ {story.song}</Text> : null}
        {story.taggedAccounts.length ? (
          <Text className="absolute bottom-6 left-6 rounded-pill bg-white/80 px-3 py-1 text-xs text-wink-ink">@{story.taggedAccounts.join(" @")}</Text>
        ) : null}
        {/* tap zones */}
        <Pressable accessibilityLabel="Previous story" className="absolute bottom-0 left-0 top-0 w-1/3" onPress={() => (index > 0 ? setIndex(index - 1) : setProgress(0))} />
        <Pressable accessibilityLabel="Next story" className="absolute bottom-0 right-0 top-0 w-1/3" onPress={() => setProgress(100)} />
      </View>

      {isMine ? (
        <Pressable onPress={() => { setPaused(true); setViewers(true); }} className="flex-row items-center gap-2 px-4 pb-6 pt-3">
          <Eye size={18} color={colors.white} />
          <Text className="text-white">{story.viewers.filter((v) => v !== me).length} viewers</Text>
        </Pressable>
      ) : (
        <View className="flex-row items-center gap-3 px-4 pb-6 pt-3">
          <TextInput
            value={reply}
            onChangeText={setReply}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            placeholder={`Reply to ${story.author}…`}
            placeholderTextColor="#bbb"
            className="flex-1 rounded-pill border border-white/50 px-4 py-2.5 text-white"
          />
          <Pressable accessibilityLabel="Like story" onPress={() => toggleLikeStory(story.id)}>
            <Heart size={24} color={liked ? colors.pink : colors.white} fill={liked ? colors.pink : "none"} />
          </Pressable>
          <Pressable
            accessibilityLabel={reply ? "Send reply" : "Send story"}
            onPress={() => {
              if (reply.trim()) {
                const conv = openConversation(story.author);
                sendMessage(conv, { kind: "text", text: `Replied to your story: ${reply.trim()}` });
                setReply("");
              } else router.push(`/share?kind=story&id=${story.id}`);
            }}
          >
            <Send size={22} color={colors.white} />
          </Pressable>
        </View>
      )}

      <Sheet visible={menu} onClose={() => { setMenu(false); setPaused(false); }} title="Your story">
        <MenuItem label="Add to highlight" onPress={() => {
          const proofs = highlights.find((h) => h.owner === me);
          if (proofs) updateHighlight(proofs.id, { storyIds: [...new Set([...proofs.storyIds, story.id])] });
          else createHighlight("Highlights", [story.id]);
          setMenu(false);
          setPaused(false);
        }} />
        <MenuItem label="Save to camera roll" onPress={() => { Share.share({ message: "WinKPop story" }); }} />
        <MenuItem label="Send to…" onPress={() => { setMenu(false); router.push(`/share?kind=story&id=${story.id}`); }} />
        <MenuItem label="Archive" onPress={() => { archiveStory(story.id); setMenu(false); router.back(); }} />
        <MenuItem label="Delete story" danger onPress={() => { deleteStory(story.id); setMenu(false); router.back(); }} />
      </Sheet>
      <Sheet visible={viewers} onClose={() => { setViewers(false); setPaused(false); }} title="Viewers">
        {story.viewers.filter((v) => v !== me).length === 0 ? <Text className="text-sm text-wink-muted">No views yet.</Text> : null}
        {story.viewers.filter((v) => v !== me).map((v) => (
          <View key={v} className="flex-row items-center gap-3 border-b border-wink-pink-border py-2">
            <Avatar name={v} color={avatarColorFor(v)} size={30} />
            <Text className="flex-1 text-wink-ink">{v}</Text>
            {story.likedBy.includes(v) ? <Heart size={14} color={colors.pink} fill={colors.pink} /> : null}
          </View>
        ))}
      </Sheet>
    </SafeAreaView>
  );
}

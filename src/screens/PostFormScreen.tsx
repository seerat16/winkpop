import { useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "@/rn";
import { useLocalSearchParams, useRouter } from "@/rn/router";
import { Camera, CheckCircle2, ChevronLeft, ChevronRight, Link2, Music, Plus, Type, Video, X } from "lucide-react";
import { Button, Chip, Field, Notice, Page, PhotocardImage, SectionTitle, Text, Toggle } from "@/components";
import {
  extractHashtags,
  GROUPS,
  GROUP_MAP,
  isValidUrl,
  MAX_CAPTION,
  MAX_POST_MEDIA,
  POST_TYPES,
  type GroupTag,
  type PostMedia,
  type PostType,
} from "@/data";
import { useAppStore } from "@/data/appStore";
import { useUserStore } from "@/data/userStore";
import { colors } from "@/theme/colors";

/**
 * Upload / edit a post (§13): up to 10 photos/videos with preview, counter,
 * dots, numbered thumbnails and reordering; text + audio; a validated link;
 * post type; multi-group tagging with all/specific members; account tags,
 * location, 500-char caption; comments / like-count toggles; collab and
 * collection-account posting; cancel before posting.
 */
export default function PostFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string; edit?: string }>();
  const user = useUserStore((s) => s.user);
  const createPost = useAppStore((s) => s.createPost);
  const updatePost = useAppStore((s) => s.updatePost);
  const editing = useAppStore((s) => s.posts.find((p) => p.id === params.edit));

  const [media, setMedia] = useState<PostMedia[]>(editing?.media ?? []);
  const [current, setCurrent] = useState(0);
  const [link, setLink] = useState(editing?.link ?? "");
  const [linkDraft, setLinkDraft] = useState("");
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [type, setType] = useState<PostType | null>(editing?.type ?? (POST_TYPES.includes(params.type as PostType) ? (params.type as PostType) : null));
  const [groupTags, setGroupTags] = useState<GroupTag[]>(editing?.groupTags ?? []);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [accounts, setAccounts] = useState(editing?.accountTags.map((a) => `@${a}`).join(" ") ?? "");
  const [location, setLocation] = useState(editing?.location ?? "");
  const [song, setSong] = useState(editing?.song ?? "");
  const [caption, setCaption] = useState(editing?.caption ?? "");
  const [commentsOff, setCommentsOff] = useState(editing?.commentsOff ?? false);
  const [hideLikes, setHideLikes] = useState(editing?.hideLikes ?? false);
  const [collab, setCollab] = useState(editing?.collabWith ?? "");
  const [asCollection, setAsCollection] = useState(user?.isCollectionAccount ?? false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const mutuals = (user?.following ?? []).filter((u) => user?.followers.includes(u));

  useEffect(() => {
    if (uploading === null) return;
    if (uploading >= 100) {
      finishPost();
      return;
    }
    const t = setTimeout(() => setUploading((u) => (u === null ? null : u + 25)), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploading]);

  const addMedia = (kind: "photo" | "video") => {
    if (media.length >= MAX_POST_MEDIA) return;
    setMedia((m) => [...m, { id: `md-${Date.now()}-${m.length}`, seed: Math.floor(Math.random() * 9000) + 1000, kind }]);
    setCurrent(media.length);
  };
  const move = (i: number, d: -1 | 1) =>
    setMedia((m) => {
      const j = i + d;
      if (j < 0 || j >= m.length) return m;
      const n = [...m];
      [n[i], n[j]] = [n[j], n[i]];
      setCurrent(j);
      return n;
    });

  const toggleGroup = (id: string) =>
    setGroupTags((g) => (g.some((x) => x.groupId === id) ? g.filter((x) => x.groupId !== id) : [...g, { groupId: id, memberIds: [] }]));
  const toggleMember = (groupId: string, memberId: string | "all") =>
    setGroupTags((g) =>
      g.map((t) =>
        t.groupId !== groupId
          ? t
          : memberId === "all"
            ? { ...t, memberIds: [] }
            : { ...t, memberIds: t.memberIds.includes(memberId) ? t.memberIds.filter((m) => m !== memberId) : [...t.memberIds, memberId] },
      ),
    );

  const submit = () => {
    setError("");
    if (!type) return setError("Pick a post type.");
    if (media.length === 0 && !link) return setError("Add at least one photo or a link.");
    if (caption.length > MAX_CAPTION) return setError(`Captions are limited to ${MAX_CAPTION} characters.`);
    if (editing) {
      finishPost();
      return;
    }
    setUploading(0);
  };

  const finishPost = () => {
    const payload = {
      type: type!,
      media,
      link: link || undefined,
      caption,
      groupTags,
      accountTags: accounts.split(/\s+/).map((a) => a.replace("@", "")).filter(Boolean),
      hashtags: extractHashtags(caption),
      location: location || undefined,
      song: song || undefined,
      commentsOff,
      hideLikes,
      collabWith: collab || undefined,
      community: type === "Art" ? ("art" as const) : type === "Collection Display" || type === "Collection Drop" ? ("display" as const) : undefined,
    };
    if (editing) {
      updatePost(editing.id, payload);
      router.back();
      return;
    }
    createPost(payload);
    setUploading(null);
    setDone(true);
  };

  if (done) {
    return (
      <Page title="Posted!">
        <View className="items-center py-10">
          <CheckCircle2 size={56} color={colors.mint} />
          <Text className="mt-3 font-display text-xl text-wink-ink">Posted!</Text>
        </View>
        <Button title="Go to profile" fullWidth onPress={() => router.replace("/(tabs)/profile")} />
      </Page>
    );
  }

  const cur = media[current];

  return (
    <Page
      title={editing ? "Edit post" : "Upload post"}
      footer={
        uploading !== null ? (
          <View>
            <Text className="mb-1 text-center text-sm text-wink-muted">Uploading… {uploading}%</Text>
            <View className="mb-2 h-2 overflow-hidden rounded-full bg-wink-purple-tint">
              <View className="h-full bg-wink-pink" style={{ width: `${uploading}%` }} />
            </View>
            <Button title="Cancel upload" variant="ghost" fullWidth onPress={() => setUploading(null)} />
          </View>
        ) : (
          <>
            {error ? <Text className="mb-2 text-center text-sm text-wink-pink">{error}</Text> : null}
            <Button title={editing ? "Save changes" : "Share Post"} fullWidth onPress={submit} />
          </>
        )
      }
    >
      {/* preview */}
      {cur ? (
        <View className="mb-2">
          <PhotocardImage groupId={groupTags[0]?.groupId ?? "ive"} memberName={cur.kind === "video" ? "▶" : `${current + 1}`} imgSeed={cur.seed} aspectRatio={1} />
          <View className="absolute right-2 top-2 rounded-pill bg-black/50 px-2 py-0.5">
            <Text className="text-white" style={{ fontSize: 11 }}>
              {current + 1} / {media.length}
            </Text>
          </View>
          {cur.text ? (
            <View className="absolute bottom-6 left-4 right-4 items-center">
              <Text className="rounded bg-black/50 px-2 py-1 font-display text-white">{cur.text}</Text>
            </View>
          ) : null}
          <View className="mt-2 flex-row justify-center gap-1">
            {media.map((m, i) => (
              <View key={m.id} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: i === current ? colors.pink : "#ddd" }} />
            ))}
          </View>
        </View>
      ) : (
        <Pressable onPress={() => addMedia("photo")} className="mb-2 h-48 items-center justify-center rounded-card border-2 border-dashed border-wink-pink-border bg-white">
          <Camera size={32} color={colors.muted} />
          <Text className="mt-2 text-sm text-wink-muted">Add photos or videos</Text>
        </Pressable>
      )}

      {/* thumbnail strip */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
        <View className="flex-row items-center gap-2">
          {media.map((m, i) => (
            <Pressable key={m.id} onPress={() => setCurrent(i)} className="w-14" style={{ opacity: i === current ? 1 : 0.6 }}>
              <PhotocardImage groupId="ive" memberName={`${i + 1}`} imgSeed={m.seed} aspectRatio={1} />
              <Pressable accessibilityLabel={`Remove slide ${i + 1}`} onPress={() => { setMedia((x) => x.filter((_, y) => y !== i)); setCurrent(0); }} className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full bg-black/60">
                <X size={11} color={colors.white} />
              </Pressable>
            </Pressable>
          ))}
          {media.length < MAX_POST_MEDIA ? (
            <Pressable accessibilityLabel="Add more" onPress={() => addMedia("photo")} className="h-14 w-14 items-center justify-center rounded-card border border-wink-pink-border bg-white">
              <Plus size={18} color={colors.muted} />
              <Text style={{ fontSize: 9 }} className="text-wink-muted">
                {media.length}/{MAX_POST_MEDIA}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
      <View className="mb-3 flex-row flex-wrap gap-2">
        <Chip label="📷 Photo" onPress={() => addMedia("photo")} />
        <Chip label="🎬 Video" onPress={() => addMedia("video")} />
        {cur ? (
          <>
            <Pressable accessibilityLabel="Move left" onPress={() => move(current, -1)} className="flex-row items-center rounded-pill border border-wink-pink-border bg-white px-2 py-1">
              <ChevronLeft size={14} color={colors.ink} />
              <Text className="text-xs">Move left</Text>
            </Pressable>
            <Pressable accessibilityLabel="Move right" onPress={() => move(current, 1)} className="flex-row items-center rounded-pill border border-wink-pink-border bg-white px-2 py-1">
              <Text className="text-xs">Move right</Text>
              <ChevronRight size={14} color={colors.ink} />
            </Pressable>
          </>
        ) : null}
      </View>
      {cur ? (
        <Field
          label="Text on this slide"
          value={cur.text ?? ""}
          onChangeText={(t) => setMedia((m) => m.map((x, i) => (i === current ? { ...x, text: t } : x)))}
          placeholder="Add text overlay"
        />
      ) : null}
      <View className="flex-row items-center gap-2">
        <Music size={16} color={colors.purple} />
        <View className="flex-1">
          <Field value={song} onChangeText={setSong} placeholder="Add audio (song name)" />
        </View>
        {cur?.kind === "video" ? <Video size={16} color={colors.muted} /> : <Type size={16} color={colors.muted} />}
      </View>

      {/* link */}
      {link ? (
        <View className="mb-3 flex-row items-center gap-2 rounded-card bg-white p-3">
          <Link2 size={16} color={colors.purple} />
          <Text className="flex-1 text-sm text-wink-ink" numberOfLines={1}>
            {link}
          </Text>
          <Pressable onPress={() => { setLinkDraft(link); setLinkOpen(true); }}>
            <Text className="text-xs text-wink-pink">Edit link</Text>
          </Pressable>
          <Pressable accessibilityLabel="Remove link" onPress={() => setLink("")}>
            <X size={14} color={colors.muted} />
          </Pressable>
        </View>
      ) : linkOpen ? null : (
        <Button title="Insert link" variant="secondary" icon={<Link2 size={14} color={colors.ink} />} onPress={() => setLinkOpen(true)} />
      )}
      {linkOpen ? (
        <View className="mt-2">
          <Field label="Link" value={linkDraft} onChangeText={setLinkDraft} autoCapitalize="none" placeholder="https://" error={linkError} />
          <Button
            size="sm"
            title="Add"
            onPress={() => {
              if (!isValidUrl(linkDraft)) return setLinkError("That doesn't look like a valid link.");
              setLink(linkDraft.trim());
              setLinkDraft("");
              setLinkError("");
              setLinkOpen(false);
            }}
          />
        </View>
      ) : null}

      <SectionTitle title="Post type" />
      <View className="flex-row flex-wrap gap-2">
        {POST_TYPES.map((t) => (
          <Chip key={t} label={t} active={type === t} onPress={() => setType(t)} />
        ))}
      </View>

      <SectionTitle title="Groups & members" />
      <View className="flex-row flex-wrap gap-2">
        {GROUPS.map((g) => (
          <Chip key={g.id} label={g.name} activeColor={g.color} active={groupTags.some((t) => t.groupId === g.id)} onPress={() => { toggleGroup(g.id); setExpanded(g.id); }} />
        ))}
      </View>
      {groupTags.map((t) => {
        const g = GROUP_MAP[t.groupId];
        return (
          <View key={t.groupId} className="mt-2 rounded-card bg-white p-3">
            <Pressable onPress={() => setExpanded(expanded === t.groupId ? null : t.groupId)}>
              <Text className="font-display text-sm text-wink-ink">
                {g.name} · {t.memberIds.length ? `${t.memberIds.length} members` : "All members"}
              </Text>
            </Pressable>
            {expanded === t.groupId ? (
              <View className="mt-2 flex-row flex-wrap gap-2">
                <Chip label="All members" active={t.memberIds.length === 0} onPress={() => toggleMember(g.id, "all")} />
                {g.members.filter((m) => !m.former).map((m) => (
                  <Chip key={m.id} label={m.name} active={t.memberIds.includes(m.id)} onPress={() => toggleMember(g.id, m.id)} />
                ))}
              </View>
            ) : null}
          </View>
        );
      })}

      <SectionTitle title="Caption & tags" />
      <Field multiline value={caption} onChangeText={setCaption} placeholder="Describe your post… #hashtags work" counter={{ value: caption.length, max: MAX_CAPTION }} />
      <Field label="Tag accounts" value={accounts} onChangeText={setAccounts} autoCapitalize="none" placeholder="@pcfairy @biasbinder" />
      <Field label="Location" value={location} onChangeText={setLocation} placeholder="e.g. Koreatown, NYC" />

      <SectionTitle title="Settings" />
      <Toggle label="Turn off comments" value={commentsOff} onChange={setCommentsOff} />
      <Toggle label="Hide like count" value={hideLikes} onChange={setHideLikes} />
      <Toggle label="Post as collection account" sub="Showcase only — not for sale or trade" value={asCollection} onChange={setAsCollection} />
      {mutuals.length ? (
        <>
          <Text className="mb-2 mt-2 text-sm text-wink-ink">Collaborate with (shows on both profiles)</Text>
          <View className="flex-row flex-wrap gap-2">
            {mutuals.map((m) => (
              <Chip key={m} label={`@${m}`} active={collab === m} onPress={() => setCollab(collab === m ? "" : m)} />
            ))}
          </View>
        </>
      ) : null}
      {editing ? <Notice text="Edits are saved permanently when you tap Save changes. Remove a slide with its ✕." /> : null}
    </Page>
  );
}

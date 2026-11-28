import { useState } from "react";
import { Pressable, TextInput, View } from "@/rn";
import { Linking } from "@/rn/platform";
import { useLocalSearchParams, useRouter } from "@/rn/router";
import { Heart, MoreHorizontal, Pin, Send, Trash2 } from "lucide-react";
import {
  Avatar,
  avatarColorFor,
  EmptyState,
  MenuItem,
  Page,
  PostCard,
  ReportSheet,
  Sheet,
  Text,
  timeAgo,
} from "@/components";
import { useAppStore } from "@/data/appStore";
import { useUserStore } from "@/data/userStore";
import { colors } from "@/theme/colors";

/**
 * Post detail (§13N–Q, §15D–F): comments with replies, likes, pinning and
 * deletion; owner menu to edit, archive, toggle comments / like count, delete;
 * everyone can repost, share or report.
 */
export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const post = useAppStore((s) => s.posts.find((p) => p.id === id));
  const me = useUserStore((s) => s.user?.username ?? "");
  const addComment = useAppStore((s) => s.addComment);
  const toggleCommentLike = useAppStore((s) => s.toggleCommentLike);
  const togglePin = useAppStore((s) => s.togglePinComment);
  const deleteComment = useAppStore((s) => s.deleteComment);
  const updatePost = useAppStore((s) => s.updatePost);
  const deletePost = useAppStore((s) => s.deletePost);
  const repost = useAppStore((s) => s.repost);
  const addStories = useAppStore((s) => s.addStories);
  const folders = useAppStore((s) => s.savedFolders);
  const toggleSavePost = useAppStore((s) => s.toggleSavePost);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<string | undefined>();
  const [menu, setMenu] = useState(false);
  const [report, setReport] = useState(false);
  const [notice, setNotice] = useState("");

  if (!post) return <Page title="Post">{<EmptyState title="Post not found" />}</Page>;
  const isMine = post.author === me;
  const top = post.comments.filter((c) => !c.parentId).sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)));

  const send = () => {
    if (!text.trim()) return;
    addComment({ postId: post.id }, text.trim(), replyTo);
    setText("");
    setReplyTo(undefined);
  };

  return (
    <Page
      title="Post"
      right={
        <Pressable accessibilityLabel="Post options" onPress={() => setMenu(true)} hitSlop={8}>
          <MoreHorizontal size={20} color={colors.ink} />
        </Pressable>
      }
      footer={
        post.commentsOff ? (
          <Text className="text-center text-sm text-wink-muted">Comments are turned off.</Text>
        ) : (
          <View>
            {replyTo ? (
              <Pressable onPress={() => setReplyTo(undefined)}>
                <Text className="mb-1 text-xs text-wink-muted">Replying to {post.comments.find((c) => c.id === replyTo)?.author} · cancel</Text>
              </Pressable>
            ) : null}
            <View className="flex-row items-center gap-2">
              <TextInput
                value={text}
                onChangeText={setText}
                onSubmitEditing={send}
                placeholder="Add a comment..."
                placeholderTextColor={colors.muted}
                className="flex-1 rounded-pill border border-wink-pink-border px-4 py-2.5 text-wink-ink"
              />
              <Pressable accessibilityLabel="Send comment" onPress={send} className="h-10 w-10 items-center justify-center rounded-full bg-wink-pink">
                <Send size={16} color={colors.white} />
              </Pressable>
            </View>
          </View>
        )
      }
    >
      <PostCard post={post} />
      {post.link ? (
        <Pressable onPress={() => Linking.openURL(post.link!)} className="-mt-2 mb-3">
          <Text className="text-sm text-wink-purple">🔗 {post.link}</Text>
        </Pressable>
      ) : null}
      {notice ? <Text className="mb-2 text-center text-xs text-wink-mint">{notice}</Text> : null}
      {!post.commentsOff
        ? top.map((c) => (
            <View key={c.id} className="mb-3">
              <CommentRow
                c={c}
                me={me}
                canPin={isMine}
                onLike={() => toggleCommentLike({ postId: post.id }, c.id)}
                onPin={() => togglePin(post.id, c.id)}
                onDelete={() => deleteComment({ postId: post.id }, c.id)}
                onReply={() => setReplyTo(c.id)}
              />
              {post.comments
                .filter((r) => r.parentId === c.id)
                .map((r) => (
                  <View key={r.id} className="ml-10 mt-2">
                    <CommentRow
                      c={r}
                      me={me}
                      canPin={false}
                      onLike={() => toggleCommentLike({ postId: post.id }, r.id)}
                      onDelete={() => deleteComment({ postId: post.id }, r.id)}
                      onReply={() => setReplyTo(c.id)}
                    />
                  </View>
                ))}
            </View>
          ))
        : null}

      <Sheet visible={menu} onClose={() => setMenu(false)} title="Post options">
        {isMine ? (
          <>
            <MenuItem label="Edit post" onPress={() => { setMenu(false); router.push(`/post/new?edit=${post.id}`); }} />
            <MenuItem label={post.commentsOff ? "Turn on comments" : "Turn off comments"} onPress={() => updatePost(post.id, { commentsOff: !post.commentsOff })} />
            <MenuItem label={post.hideLikes ? "Show like count" : "Hide like count"} onPress={() => updatePost(post.id, { hideLikes: !post.hideLikes })} />
            <MenuItem label={post.archived ? "Unarchive" : "Archive"} onPress={() => { updatePost(post.id, { archived: !post.archived }); setMenu(false); }} />
            <MenuItem label="Delete post" danger onPress={() => { deletePost(post.id); router.back(); }} />
          </>
        ) : (
          <>
            <MenuItem label="Repost to your profile" onPress={() => { repost(post.id); setMenu(false); setNotice("Reposted to your profile"); }} />
            <MenuItem
              label="Share to your story"
              onPress={() => {
                addStories([{ seed: post.media[0]?.seed ?? 1, text: `From @${post.author}`, closeFriends: false, hiddenFrom: [], taggedAccounts: [post.author] }]);
                setMenu(false);
                setNotice("Added to your story");
              }}
            />
            {Object.keys(folders).map((f) => (
              <MenuItem key={f} label={`${folders[f].includes(post.id) ? "Remove from" : "Save to"} “${f}”`} onPress={() => toggleSavePost(post.id, f)} />
            ))}
            <MenuItem label="Report post" danger onPress={() => { setMenu(false); setReport(true); }} />
          </>
        )}
        <MenuItem label="Send to…" onPress={() => { setMenu(false); router.push(`/share?kind=post&id=${post.id}`); }} />
      </Sheet>
      <ReportSheet visible={report} onClose={() => setReport(false)} targetKind="post" targetId={post.id} />
    </Page>
  );
}

function CommentRow({
  c,
  me,
  canPin,
  onLike,
  onPin,
  onDelete,
  onReply,
}: {
  c: { id: string; author: string; text: string; at: string; likes: string[]; pinned?: boolean };
  me: string;
  canPin: boolean;
  onLike: () => void;
  onPin?: () => void;
  onDelete: () => void;
  onReply: () => void;
}) {
  return (
    <View className="flex-row gap-3">
      <Avatar name={c.author} color={avatarColorFor(c.author)} size={30} />
      <View className="flex-1">
        <Text className="text-sm text-wink-ink">
          {c.pinned ? "📌 " : ""}
          <Text className="font-display">{c.author} </Text>
          {c.text}
        </Text>
        <View className="mt-0.5 flex-row gap-3">
          <Text className="text-xs text-wink-muted">{timeAgo(c.at)}</Text>
          {c.likes.length ? <Text className="text-xs text-wink-muted">{c.likes.length} likes</Text> : null}
          <Pressable onPress={onReply}>
            <Text className="text-xs text-wink-muted">Reply</Text>
          </Pressable>
        </View>
      </View>
      <View className="items-center gap-2">
        <Pressable accessibilityLabel="Like comment" onPress={onLike} hitSlop={6}>
          <Heart size={13} color={c.likes.includes(me) ? colors.pink : colors.muted} fill={c.likes.includes(me) ? colors.pink : "none"} />
        </Pressable>
        {canPin && onPin ? (
          <Pressable accessibilityLabel="Pin comment" onPress={onPin} hitSlop={6}>
            <Pin size={13} color={c.pinned ? colors.purple : colors.muted} />
          </Pressable>
        ) : null}
        {c.author === me ? (
          <Pressable accessibilityLabel="Delete comment" onPress={onDelete} hitSlop={6}>
            <Trash2 size={13} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

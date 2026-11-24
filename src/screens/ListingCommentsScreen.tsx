import { useState } from "react";
import { Pressable, TextInput, View } from "@/rn";
import { useLocalSearchParams } from "@/rn/router";
import { Heart, Send, Trash2 } from "lucide-react";
import { Avatar, avatarColorFor, EmptyState, Page, PhotocardImage, Text, timeAgo } from "@/components";
import { getAnyListing, listingName, useAppStore, EMPTY } from "@/data/appStore";
import { useUserStore } from "@/data/userStore";
import { colors } from "@/theme/colors";

/** Comments on a listing (§15Y): summary at top, all comments, add a comment. */
export default function ListingCommentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const card = getAnyListing(id ?? "");
  const me = useUserStore((s) => s.user?.username ?? "");
  const comments = useAppStore((s) => s.listingComments[id ?? ""] ?? EMPTY);
  const addComment = useAppStore((s) => s.addComment);
  const toggleLike = useAppStore((s) => s.toggleCommentLike);
  const deleteComment = useAppStore((s) => s.deleteComment);
  const [text, setText] = useState("");

  const send = () => {
    if (!text.trim() || !id) return;
    addComment({ cardId: id }, text.trim());
    setText("");
  };

  return (
    <Page
      title="Comments"
      footer={
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
      }
    >
      {card ? (
        <View className="mb-4 flex-row items-center gap-3 rounded-card border border-wink-pink-border bg-white p-3">
          <View className="w-12">
            <PhotocardImage groupId={card.groupId} memberName={card.memberName} imgSeed={card.imgSeed} />
          </View>
          <View className="flex-1">
            <Text className="font-display text-sm text-wink-ink" numberOfLines={2}>
              {listingName(card)}
            </Text>
            <Text className="text-xs text-wink-muted">
              ${card.price.toFixed(2)} · @{card.sellerUsername}
            </Text>
          </View>
        </View>
      ) : null}
      {comments.length === 0 ? (
        <EmptyState emoji="💬" title="Start the conversation about this listing" />
      ) : (
        comments.map((c) => (
          <View key={c.id} className="mb-3 flex-row gap-3">
            <Avatar name={c.author} color={avatarColorFor(c.author)} size={32} />
            <View className="flex-1">
              <Text className="text-sm text-wink-ink">
                <Text className="font-display">{c.author} </Text>
                {c.text}
              </Text>
              <Text className="text-xs text-wink-muted">{timeAgo(c.at)}</Text>
            </View>
            <Pressable accessibilityLabel="Like comment" onPress={() => toggleLike({ cardId: id }, c.id)} hitSlop={6}>
              <Heart size={14} color={c.likes.includes(me) ? colors.pink : colors.muted} fill={c.likes.includes(me) ? colors.pink : "none"} />
            </Pressable>
            {c.author === me ? (
              <Pressable accessibilityLabel="Delete comment" onPress={() => deleteComment({ cardId: id }, c.id)} hitSlop={6}>
                <Trash2 size={14} color={colors.muted} />
              </Pressable>
            ) : null}
          </View>
        ))
      )}
    </Page>
  );
}

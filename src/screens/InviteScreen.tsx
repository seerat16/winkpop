import { useState } from "react";
import { Copy, Mail, MessageSquare, Share2 } from "lucide-react";
import { Button, Card, Notice, Page, SectionTitle, Text, UserRow } from "@/components";
import { COMMUNITY_USERS } from "@/data";
import { useUserStore } from "@/data/userStore";
import { View } from "@/rn";
import { Share } from "@/rn/platform";
import { colors } from "@/theme/colors";
import { INVITE_POINTS, inviteCode, inviteLink } from "@/lib/invites";

/**
 * Invite friends (replaces Instagram login + "find mutuals", which Meta's
 * current APIs don't allow). Share a personal link by text, email or the
 * system share sheet, and follow collectors who already share your groups.
 */
export default function InviteScreen() {
  const user = useUserStore((s) => s.user);
  const toggleFollow = useUserStore((s) => s.toggleFollow);
  const [copied, setCopied] = useState(false);
  if (!user) return null;

  const link = inviteLink(user.username);
  const message = `Come trade photocards with me on WinKPop 💜 Use my code ${inviteCode(user.username)}: ${link}`;
  const suggestions = COMMUNITY_USERS.filter(
    (u) => !user.following.includes(u.username) && u.collectingGroupIds.some((g) => user.collectingGroupIds.includes(g)),
  );

  return (
    <Page title="Invite friends">
      <Card>
        <Text className="text-xs text-wink-muted">Your invite code</Text>
        <Text className="font-display text-3xl tracking-widest text-wink-ink">{inviteCode(user.username)}</Text>
        <Text className="mt-1 text-sm text-wink-muted">
          You both get {INVITE_POINTS} points when a friend signs up and makes their first trade.
        </Text>
        <View className="mt-3 gap-2">
          <Button title="Share invite" fullWidth icon={<Share2 size={16} color="#fff" />} onPress={() => Share.share({ message })} />
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Button
                title="Text"
                variant="secondary"
                fullWidth
                icon={<MessageSquare size={16} color={colors.ink} />}
                onPress={() => window.open(`sms:?&body=${encodeURIComponent(message)}`)}
              />
            </View>
            <View className="flex-1">
              <Button
                title="Email"
                variant="secondary"
                fullWidth
                icon={<Mail size={16} color={colors.ink} />}
                onPress={() => window.open(`mailto:?subject=${encodeURIComponent("Join me on WinKPop")}&body=${encodeURIComponent(message)}`)}
              />
            </View>
            <View className="flex-1">
              <Button
                title={copied ? "Copied!" : "Copy"}
                variant="secondary"
                fullWidth
                icon={<Copy size={16} color={colors.ink} />}
                onPress={async () => {
                  await navigator.clipboard?.writeText(link).catch(() => undefined);
                  setCopied(true);
                }}
              />
            </View>
          </View>
        </View>
      </Card>

      {user.socials.instagram ? (
        <Notice text={`Tip: add ${link} to your Instagram bio (@${user.socials.instagram}) so followers can find you here.`} />
      ) : null}

      <SectionTitle title="Collectors who share your groups" />
      {suggestions.length === 0 ? <Text className="text-sm text-wink-muted">You're already following everyone we'd suggest!</Text> : null}
      {suggestions.map((u) => (
        <UserRow
          key={u.username}
          username={u.username}
          right={<Button size="sm" title={u.isPrivate ? "Request" : "Follow"} onPress={() => toggleFollow(u.username, u.isPrivate)} />}
        />
      ))}
    </Page>
  );
}

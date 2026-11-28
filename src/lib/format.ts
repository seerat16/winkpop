import { getCommunityUser, type Conversation, type Photocard } from "@/data";
import { useUserStore } from "@/data/userStore";
import { colors } from "@/theme/colors";

/**
 * Plain helper functions shared by components. Kept out of .tsx component
 * files so React Fast Refresh (and the react-refresh lint rule) stay happy.
 */

/** Formats an ISO timestamp as a compact relative time ("3h", "2d"). */
export function timeAgo(iso: string, now = Date.now()): string {
  const s = Math.max(0, (now - new Date(iso).getTime()) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d`;
  return new Date(iso).toLocaleDateString();
}

export function money(n: number): string {
  return `$${n.toFixed(2)}`;
}

export function intentLabel(intent: Photocard["intent"]): string {
  return intent === "sale" ? "WTS" : intent === "trade" ? "WTT" : "WTT/WTS";
}

export function avatarColorFor(username: string): string {
  const me = useUserStore.getState().user;
  if (me?.username === username) return me.avatarColor ?? colors.purpleSoft;
  return getCommunityUser(username)?.avatarColor ?? colors.purpleSoft;
}

/** Display title for a DM (other user) or group chat (name or member list). */
export function conversationTitle(c: Conversation, me: string): string {
  if (c.isGroup) return c.name ?? c.participants.filter((p) => p !== me).join(", ");
  return c.participants.find((p) => p !== me) ?? me;
}

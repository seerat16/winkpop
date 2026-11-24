/** Invite codes and links (replaces Instagram "find mutuals"). */

export const INVITE_POINTS = 50;

/** Stable, non-guessable-enough code for a username (server should own this in production). */
export function inviteCode(username: string): string {
  let h = 0;
  for (const ch of username) h = (h * 33 + ch.charCodeAt(0)) >>> 0;
  return `${username.slice(0, 4).toUpperCase()}${(h % 46656).toString(36).toUpperCase().padStart(3, "0")}`;
}

export function inviteLink(username: string): string {
  return `https://winkpop.app/i/${inviteCode(username)}`;
}

import { GROUP_MAP } from "@/data/groups";

/**
 * Deterministic placeholder artwork for a photocard. We ship no licensed card
 * scans, so each card renders a stable two-tone gradient (seeded by group color
 * + imgSeed) with the member's initials. Single swap point for real images.
 */
export function PhotocardImage({
  groupId,
  memberName,
  imgSeed,
  className = "",
}: {
  groupId: string;
  memberName: string;
  imgSeed: number;
  className?: string;
}) {
  const base = GROUP_MAP[groupId]?.color ?? "#C9A8E0";
  const tint = shiftColor(base, (imgSeed % 7) * 12 - 24);
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{ background: `linear-gradient(135deg, ${base}, ${tint})`, aspectRatio: "3 / 4" }}
    >
      <span className="font-display text-3xl font-extrabold text-white/90">
        {initials(memberName)}
      </span>
    </div>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function shiftColor(hex: string, amount: number) {
  const n = parseInt(hex.replace("#", ""), 16);
  const c = (v: number) => Math.max(0, Math.min(255, v));
  const r = c(((n >> 16) & 0xff) + amount);
  const g = c(((n >> 8) & 0xff) + amount);
  const b = c((n & 0xff) + amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

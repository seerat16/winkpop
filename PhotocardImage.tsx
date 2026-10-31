import { useState } from "react";
import { GROUPS } from "../data/mockData";

// Static imports so Vite fingerprints and bundles each asset correctly
import img_IMG_0808_2__1__1 from "../../imports/IMG_0808_2__1_-1.jpg";
import img_IMG_0833_2__1__1 from "../../imports/IMG_0833_2__1_-1.jpg";
import img_IMG_0829_3__1__1 from "../../imports/IMG_0829_3__1_-1.jpg";
import img_IMG_0824__1__1   from "../../imports/IMG_0824__1_-1.jpg";
import img_IMG_0812__1__1   from "../../imports/IMG_0812__1_-1.jpg";
import img_IMG_0814__1__1   from "../../imports/IMG_0814__1_-1.jpg";
import img_IMG_5154__1__1   from "../../imports/IMG_5154__1_-1.jpg";
import img_IMG_0820__1__1   from "../../imports/IMG_0820__1_-1.jpg";
import img_IMG_0816__1__1   from "../../imports/IMG_0816__1_-1.jpg";
import img_IMG_0810__1__1   from "../../imports/IMG_0810__1_-1.jpg";
import img_1_3f06088b_1     from "../../imports/1-3f06088b-1.jpg";
import img_2_3f06088b_1     from "../../imports/2-3f06088b-1.jpg";

const IMAGE_MAP: Record<string, string> = {
  "IMG_0808_2__1_-1.jpg": img_IMG_0808_2__1__1,
  "IMG_0833_2__1_-1.jpg": img_IMG_0833_2__1__1,
  "IMG_0829_3__1_-1.jpg": img_IMG_0829_3__1__1,
  "IMG_0824__1_-1.jpg":   img_IMG_0824__1__1,
  "IMG_0812__1_-1.jpg":   img_IMG_0812__1__1,
  "IMG_0814__1_-1.jpg":   img_IMG_0814__1__1,
  "IMG_5154__1_-1.jpg":   img_IMG_5154__1__1,
  "IMG_0820__1_-1.jpg":   img_IMG_0820__1__1,
  "IMG_0816__1_-1.jpg":   img_IMG_0816__1__1,
  "IMG_0810__1_-1.jpg":   img_IMG_0810__1__1,
  "1-3f06088b-1.jpg":     img_1_3f06088b_1,
  "2-3f06088b-1.jpg":     img_2_3f06088b_1,
};

const CARD_GRADIENTS = [
  ["#667eea", "#764ba2"], ["#f093fb", "#f5576c"], ["#4facfe", "#00f2fe"],
  ["#43e97b", "#38f9d7"], ["#fa709a", "#fee140"], ["#a18cd1", "#fbc2eb"],
  ["#ffecd2", "#fcb69f"], ["#ff9a9e", "#fecfef"], ["#a1c4fd", "#c2e9fb"],
  ["#d4fc79", "#96e6a1"], ["#84fab0", "#8fd3f4"], ["#cfd9df", "#e2ebf0"],
  ["#a8edea", "#fed6e3"], ["#d299c2", "#fef9d7"], ["#89f7fe", "#66a6ff"],
  ["#fddb92", "#d1fdff"], ["#e0c3fc", "#8ec5fc"], ["#f6d365", "#fda085"],
  ["#fbc2eb", "#a6c1ee"], ["#fdcbf1", "#e6dee9"], ["#30cfd0", "#667eea"],
];

interface Props {
  groupId: string;
  memberId: string;
  memberName: string;
  imgSeed: number;
  databaseImageFilename?: string;
  uploadImageFilename?: string;
  imageMode?: "database" | "upload";
  className?: string;
  style?: React.CSSProperties;
}

export function PhotocardImage({
  groupId, memberId, memberName, imgSeed,
  databaseImageFilename, uploadImageFilename,
  imageMode = "database",
  className = "", style,
}: Props) {
  const filename = imageMode === "upload" ? uploadImageFilename : databaseImageFilename;
  const resolvedSrc = filename ? IMAGE_MAP[filename] : undefined;
  const [imgError, setImgError] = useState(false);

  const idx = (imgSeed - 100) % CARD_GRADIENTS.length;
  const [from, to] = CARD_GRADIENTS[Math.abs(idx)] || ["#667eea", "#764ba2"];
  const initials = memberName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const group = GROUPS.find(g => g.id === groupId);

  const containerStyle: React.CSSProperties = {
    position: "relative",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-end",
    borderRadius: "inherit",
    aspectRatio: "3/4.5",
    ...style,
  };

  if (resolvedSrc && !imgError) {
    return (
      <div className={className} style={{ ...containerStyle, background: `linear-gradient(160deg, ${from}, ${to})` }}>
        <img
          src={resolvedSrc}
          alt={`${memberName} ${group?.name ?? ""}`}
          onError={() => setImgError(true)}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    );
  }

  // Gradient placeholder fallback
  return (
    <div className={className} style={{ ...containerStyle, background: `linear-gradient(160deg, ${from} 0%, ${to} 100%)` }}>
      <div style={{ position: "absolute", top: "-20%", right: "-15%", width: "70%", height: "70%", borderRadius: "50%", background: "rgba(255,255,255,0.12)" }} />
      <div style={{ position: "absolute", bottom: "30%", left: "-10%", width: "45%", height: "45%", borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -60%)", fontSize: "2.5em", fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "-2px", userSelect: "none" }}>
        {initials}
      </div>
      <div style={{ width: "100%", background: "rgba(0,0,0,0.28)", backdropFilter: "blur(4px)", padding: "4px 6px", color: "#fff", fontSize: "0.6em", fontWeight: 600, textAlign: "center", lineHeight: 1.3, flexShrink: 0 }}>
        {group?.name}<br />
        <span style={{ fontWeight: 400, opacity: 0.85 }}>{memberName}</span>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { X, Plus, Camera } from "lucide-react";
import {
  MOCK_STORIES,
  getUserUploadedStories,
  markStoryViewed,
  type Story,
} from "../data/storiesStore";
import { getCurrentUser } from "../data/userStore";

// Instagram-style warm gradient for unseen stories; muted for seen; primary gradient for self add
const RING_UNSEEN = "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)";
const RING_SEEN   = "var(--muted)";
const RING_SELF   = "linear-gradient(135deg, var(--primary), #C4A0DC, #E8A0C8)";
const GAP         = "var(--background)";

// ── Full-screen viewer ────────────────────────────────────────────────────────
function Viewer({ stories, start, onClose }: { stories: Story[]; start: number; onClose: () => void }) {
  const [idx, setIdx] = useState(start);
  const [pct, setPct] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const DURATION = 5000;
  const story = stories[idx];

  function advance() {
    if (idx < stories.length - 1) setIdx(i => i + 1);
    else onClose();
  }

  useEffect(() => {
    if (!story) return;
    markStoryViewed(story.id);
    setPct(0);
    if (timer.current) clearInterval(timer.current);
    const t0 = Date.now();
    timer.current = setInterval(() => {
      const p = Math.min(((Date.now() - t0) / DURATION) * 100, 100);
      setPct(p);
      if (p >= 100) advance();
    }, 40);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [idx]);

  if (!story) return null;
  const mins = Math.round((Date.now() - story.timestamp) / 60000);
  const ago = mins < 60 ? `${mins}m ago` : `${Math.round(mins / 60)}h ago`;

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={e => e.stopPropagation()}
    >
      <div style={{ position: "relative", width: "100%", height: "100%", maxWidth: 430 }}>

        {/* Progress bars */}
        <div style={{ position: "absolute", top: 12, left: 12, right: 12, zIndex: 10, display: "flex", gap: 4 }}>
          {stories.map((s, i) => (
            <div key={s.id} style={{ flex: 1, height: 2.5, background: "rgba(255,255,255,0.3)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", background: "#fff", borderRadius: 2, width: i < idx ? "100%" : i === idx ? `${pct}%` : "0%" }} />
            </div>
          ))}
        </div>

        {/* Header */}
        <div style={{ position: "absolute", top: 26, left: 12, right: 12, zIndex: 10, display: "flex", alignItems: "center", gap: 10, paddingTop: 6 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: story.avatarColor, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "1rem" }}>
            {story.avatarBase64
              ? <img src={story.avatarBase64} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : story.username[0].toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ color: "#fff", fontWeight: 600, fontSize: "0.85rem" }}>@{story.username}</span>
            <span style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.72rem", marginLeft: 8 }}>{ago}</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <X size={24} color="#fff" />
          </button>
        </div>

        {/* Story image */}
        <img src={story.imageBase64} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />

        {/* Tap left / right */}
        <button onClick={() => { if (idx > 0) setIdx(i => i - 1); else onClose(); }}
          style={{ position: "absolute", left: 0, top: 0, width: "38%", height: "100%", background: "transparent", border: "none", zIndex: 10, cursor: "pointer" }} />
        <button onClick={advance}
          style={{ position: "absolute", right: 0, top: 0, width: "38%", height: "100%", background: "transparent", border: "none", zIndex: 10, cursor: "pointer" }} />
      </div>
    </div>
  );
}

// ── Single story bubble ───────────────────────────────────────────────────────
function Bubble({
  username, avatarColor, avatarBase64, hasStory, unviewed, isSelf, onTap, onAdd,
}: {
  username: string; avatarColor: string; avatarBase64?: string | null;
  hasStory: boolean; unviewed: boolean; isSelf?: boolean;
  onTap: () => void; onAdd?: () => void;
}) {
  const ring = hasStory
    ? (unviewed ? RING_UNSEEN : RING_SEEN)
    : isSelf
      ? RING_SELF
      : "transparent";
  const hasPad = hasStory || isSelf;

  const avatarInner = avatarBase64
    ? <img src={avatarBase64} alt={username} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    : isSelf && !hasStory
      ? <Camera size={22} color="#fff" strokeWidth={1.8} />
      : <span style={{ color: "#fff", fontWeight: 700, fontSize: "1.2rem" }}>{username[0]?.toUpperCase() ?? "?"}</span>;

  return (
    <button
      onClick={hasStory ? onTap : (onAdd ?? onTap)}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flexShrink: 0, width: 72, background: "transparent", border: "none", cursor: "pointer", padding: "2px 0" }}
    >
      {/* Ring */}
      <div style={{ position: "relative", width: 66, height: 66 }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: ring, padding: hasPad ? 2.5 : 0 }}>
          {/* Gap ring */}
          <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: GAP, padding: hasPad ? 2 : 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {/* Avatar */}
            <div style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", background: avatarColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {avatarInner}
            </div>
          </div>
        </div>
        {/* + badge for self without story */}
        {isSelf && !hasStory && (
          <div style={{ position: "absolute", bottom: 0, right: 0, width: 20, height: 20, borderRadius: "50%", background: "var(--primary)", border: `2.5px solid var(--background)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Plus size={11} color="var(--primary-foreground)" strokeWidth={3} />
          </div>
        )}
      </div>
      <span style={{ fontSize: "0.63rem", color: "var(--foreground)", fontWeight: isSelf ? 600 : 400, maxWidth: 68, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center" }}>
        {isSelf ? "Your story" : username}
      </span>
    </button>
  );
}

// ── Main exported row ─────────────────────────────────────────────────────────
export function StoriesRow({ onAddStory }: { onAddStory?: () => void }) {
  const currentUser = getCurrentUser();
  const myId = currentUser?.email;

  // User's own uploaded story (from localStorage)
  const [myStory, setMyStory] = useState<Story | null>(() =>
    myId ? (getUserUploadedStories().find(s => s.userId === myId) ?? null) : null
  );

  // Track which mock stories have been viewed this session
  const [viewed, setViewed] = useState<Set<string>>(() => new Set());
  const [viewer, setViewer] = useState<{ stories: Story[]; idx: number } | null>(null);

  // Refresh my story when component mounts (in case uploaded elsewhere)
  useEffect(() => {
    if (!myId) return;
    const s = getUserUploadedStories().find(s => s.userId === myId) ?? null;
    setMyStory(s);
  }, [myId]);

  function openMock(idx: number) {
    setViewer({ stories: MOCK_STORIES, idx });
  }

  function openMyStory() {
    if (myStory) setViewer({ stories: [myStory], idx: 0 });
    else onAddStory?.();
  }

  function handleViewerClose() {
    setViewed(prev => {
      const next = new Set(prev);
      if (viewer) viewer.stories.forEach(s => next.add(s.id));
      return next;
    });
    setViewer(null);
  }

  return (
    <>
      <div style={{
        display: "flex",
        overflowX: "auto",
        gap: 0,
        paddingLeft: 12,
        paddingRight: 12,
        paddingTop: 10,
        paddingBottom: 10,
        borderBottom: "1px solid var(--border)",
        background: "var(--background)",
        scrollbarWidth: "none",
      }}>
        {/* Your story — always first */}
        <Bubble
          username={currentUser?.username || currentUser?.displayName || "me"}
          avatarColor="linear-gradient(135deg, #C4A0DC, var(--primary))"
          avatarBase64={currentUser?.avatarBase64}
          hasStory={!!myStory}
          unviewed={!!myStory}
          isSelf
          onTap={openMyStory}
          onAdd={onAddStory}
        />

        {/* Mock stories — always shown, no seeding needed */}
        {MOCK_STORIES.map((s, i) => (
          <Bubble
            key={s.id}
            username={s.username}
            avatarColor={s.avatarColor}
            hasStory
            unviewed={!viewed.has(s.id)}
            onTap={() => openMock(i)}
          />
        ))}
      </div>

      {viewer && (
        <Viewer stories={viewer.stories} start={viewer.idx} onClose={handleViewerClose} />
      )}
    </>
  );
}

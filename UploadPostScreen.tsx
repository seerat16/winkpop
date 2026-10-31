import { useState, useRef } from "react";
import { useNavigate, useSearchParams } from "../router";
import {
  ArrowLeft, X, Plus, ChevronDown, ChevronUp,
  Image as ImageIcon, Check, ChevronRight,
  ArrowLeftRight, Link,
} from "lucide-react";
import { GROUPS_DATA } from "../data/groupData";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { getCurrentUser } from "../data/userStore";

const PRIMARY = "#D4759A";
const POSTS_KEY = "barter_my_posts";

const POST_TYPES = [
  "ISO",
  "DWAYER",
  "Collection Drop",
  "Collection Display",
  "Art",
  "Other",
] as const;
type PostType = typeof POST_TYPES[number];

function compressImage(file: File): Promise<string> {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const max = 720;
        let { width, height } = img;
        if (width > max || height > max) {
          if (width > height) { height = (height * max) / width; width = max; }
          else { width = (width * max) / height; height = max; }
        }
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function loadPosts(): any[] {
  try { return JSON.parse(localStorage.getItem(POSTS_KEY) || "[]"); } catch { return []; }
}
function savePosts(posts: any[]): boolean {
  try {
    localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
    return true;
  } catch {
    return false;
  }
}

type GroupSelection = {
  groupId: string;
  memberIds: string[];
  allMembers: boolean;
};

export default function UploadPostScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const requestedPostType = searchParams.get("type") as PostType | null;
  const initialPostType = requestedPostType && POST_TYPES.includes(requestedPostType)
    ? requestedPostType
    : null;

  const [mediaItems, setMediaItems] = useState<string[]>([]);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkDraft, setLinkDraft] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [postType, setPostType] = useState<PostType | null>(initialPostType);
  const [showPostTypePicker, setShowPostTypePicker] = useState(false);
  const [description, setDescription] = useState("");

  // Group/member selection
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [groupSelections, setGroupSelections] = useState<GroupSelection[]>([]);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  const handleMediaAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 10 - mediaItems.length;
    if (remaining <= 0) { toast.error("Maximum 10 items reached"); return; }
    const toProcess = files.slice(0, remaining);
    const compressed = await Promise.all(toProcess.map(compressImage));
    setMediaItems(prev => [...prev, ...compressed]);
    e.target.value = "";
  };

  const removeMedia = (idx: number) => {
    setMediaItems(prev => {
      const next = prev.filter((_, i) => i !== idx);
      setCurrentSlide(c => Math.min(c, Math.max(0, next.length - 1)));
      return next;
    });
  };

  const moveMedia = (idx: number, dir: "left" | "right") => {
    const target = dir === "left" ? idx - 1 : idx + 1;
    if (target < 0 || target >= mediaItems.length) return;
    setMediaItems(prev => {
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
    setCurrentSlide(target);
  };

  const handleLinkAdd = () => {
    const value = linkDraft.trim();
    if (!value) return;
    const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    try {
      const parsed = new URL(candidate);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Unsupported protocol");
      setLinkUrl(parsed.toString());
      setLinkDraft("");
      setShowLinkInput(false);
      toast.success("Link added");
    } catch {
      toast.error("Enter a valid web link");
    }
  };

  // Toggle group selected
  const toggleGroupSelected = (groupId: string) => {
    setGroupSelections(prev => {
      const exists = prev.find(s => s.groupId === groupId);
      if (exists) {
        setExpandedGroupId(null);
        return prev.filter(s => s.groupId !== groupId);
      }
      setExpandedGroupId(groupId);
      return [...prev, { groupId, memberIds: [], allMembers: true }];
    });
  };

  const isGroupSelected = (groupId: string) => groupSelections.some(s => s.groupId === groupId);

  const toggleAllMembers = (groupId: string) => {
    setGroupSelections(prev => prev.map(s =>
      s.groupId === groupId ? { ...s, allMembers: true, memberIds: [] } : s
    ));
  };

  const toggleMember = (groupId: string, memberId: string) => {
    setGroupSelections(prev => prev.map(s => {
      if (s.groupId !== groupId) return s;
      const alreadyIn = s.memberIds.includes(memberId);
      const nextIds = alreadyIn ? s.memberIds.filter(id => id !== memberId) : [...s.memberIds, memberId];
      return { ...s, allMembers: false, memberIds: nextIds };
    }));
  };

  const isMemberSelected = (groupId: string, memberId: string) => {
    const sel = groupSelections.find(s => s.groupId === groupId);
    return sel?.allMembers || sel?.memberIds.includes(memberId) || false;
  };

  const getSelectionLabel = () => {
    if (groupSelections.length === 0) return null;
    return groupSelections.map(sel => {
      const g = GROUPS_DATA.find(g => g.id === sel.groupId);
      if (!g) return "";
      if (sel.allMembers) return g.name;
      if (sel.memberIds.length === 0) return g.name;
      const names = sel.memberIds.map(mid => g.members.find(m => m.id === mid)?.name).filter(Boolean).join(", ");
      return `${g.name} · ${names}`;
    }).filter(Boolean).join(" / ");
  };

  const handlePost = () => {
    if (!postType) { toast.error("Choose a post type"); return; }
    if (mediaItems.length === 0 && !linkUrl) { toast.error("Add photos, videos, or a link"); return; }

    const currentUser = getCurrentUser();
    const label = getSelectionLabel();
    const post = {
      id: `post-${Date.now()}`,
      listingType: "post",
      postType,
      title: `${postType}${label ? ` · ${label}` : ""}`,
      description,
      mediaItems,
      externalLink: linkUrl || null,
      photoUri: mediaItems[0] || null,
      groupSelections,
      ownerEmail: currentUser?.email ?? null,
      createdAt: new Date().toISOString(),
    };

    if (!savePosts([post, ...loadPosts()])) {
      toast.error("Could not save this post. Try uploading fewer or smaller photos.");
      return;
    }
    toast.success("Posted!");
    navigate("/profile");
  };

  const selectionLabel = getSelectionLabel();

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 pt-5 pb-4 sticky top-0 z-10"
        style={{ background: "var(--background)", borderBottom: "1px solid var(--border)" }}
      >
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <ArrowLeft size={18} color="var(--foreground)" />
        </button>
        <span style={{ fontWeight: 700, color: "var(--foreground)", fontSize: "1rem" }}>New Post</span>
        <button
          onClick={handlePost}
          className="px-4 py-1.5 rounded-full"
          style={{
            background: postType && (mediaItems.length > 0 || linkUrl) ? PRIMARY : "var(--muted)",
            color: postType && (mediaItems.length > 0 || linkUrl) ? "#fff" : "var(--muted-foreground)",
            fontWeight: 700,
            fontSize: "0.85rem",
          }}
        >
          Post
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-8">

        {/* ── Main preview ── */}
        <div
          className="relative flex items-center justify-center mx-4 mt-4 rounded-2xl overflow-hidden"
          style={{
            aspectRatio: "1",
            background: "var(--card)",
            border: mediaItems.length === 0 ? "2px dashed var(--border)" : "none",
          }}
        >
          {mediaItems.length === 0 && linkUrl ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-secondary text-primary">
                <Link size={28} />
              </div>
              <div className="font-semibold text-foreground">Link attached</div>
              <div className="w-full truncate text-sm text-muted-foreground">{linkUrl}</div>
            </div>
          ) : mediaItems.length === 0 ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-3 w-full h-full items-center justify-center"
              style={{ display: "flex" }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: "#FFF0F7" }}
              >
                <ImageIcon size={28} color={PRIMARY} />
              </div>
              <div className="text-center">
                <div style={{ fontWeight: 600, color: "var(--foreground)", fontSize: "0.9rem" }}>
                  Add photos or videos
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", marginTop: 2 }}>
                  Up to 10 items
                </div>
              </div>
            </button>
          ) : (
            <>
              <img
                src={mediaItems[currentSlide]}
                alt="media"
                className="w-full h-full object-cover"
              />
              {/* Slide counter pill */}
              <div
                className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full"
                style={{ background: "rgba(0,0,0,0.48)", color: "#fff", fontSize: "0.72rem", fontWeight: 700 }}
              >
                {currentSlide + 1} / {mediaItems.length}
              </div>
              {/* Slide dots */}
              {mediaItems.length > 1 && (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                  {mediaItems.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className="rounded-full transition-all"
                      style={{
                        width: currentSlide === idx ? 18 : 6,
                        height: 6,
                        background: currentSlide === idx ? "#fff" : "rgba(255,255,255,0.5)",
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Thumbnail strip with per-item controls ── */}
        {mediaItems.length > 0 && (
          <div className="mt-3">
            {/* Scrollable row */}
            <div className="flex gap-2.5 px-4 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {mediaItems.map((src, idx) => {
                const isActive = currentSlide === idx;
                return (
                  <div key={idx} className="relative flex-shrink-0" style={{ width: 68 }}>
                    {/* Thumbnail */}
                    <button
                      onClick={() => setCurrentSlide(idx)}
                      className="rounded-xl overflow-hidden block"
                      style={{
                        width: 68, height: 68,
                        border: `2.5px solid ${isActive ? PRIMARY : "var(--border)"}`,
                        outline: isActive ? `3px solid ${PRIMARY}22` : "none",
                        outlineOffset: 1,
                      }}
                    >
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </button>
                    {/* Position badge */}
                    <div
                      className="absolute bottom-1 left-1 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{
                        background: isActive ? PRIMARY : "rgba(0,0,0,0.42)",
                        fontSize: "0.5rem",
                        color: "#fff",
                        fontWeight: 700,
                      }}
                    >
                      {idx + 1}
                    </div>
                    {/* Delete button */}
                    <button
                      onClick={e => { e.stopPropagation(); removeMedia(idx); }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: "#2d2d2d", border: "1.5px solid var(--background)" }}
                    >
                      <X size={9} color="#fff" strokeWidth={3} />
                    </button>
                  </div>
                );
              })}

              {/* Add more button */}
              {mediaItems.length < 10 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-shrink-0 rounded-xl flex flex-col items-center justify-center gap-1"
                  style={{
                    width: 68, height: 68,
                    border: "2px dashed var(--border)",
                    background: "var(--card)",
                  }}
                >
                  <Plus size={16} color={PRIMARY} />
                  <span style={{ fontSize: "0.55rem", color: PRIMARY, fontWeight: 600 }}>
                    {mediaItems.length}/10
                  </span>
                </button>
              )}
            </div>

            {/* Reorder controls — only shown when >1 item */}
            {mediaItems.length > 1 && (
              <div className="flex items-center justify-center gap-2 mt-2.5 px-4">
                <button
                  onClick={() => moveMedia(currentSlide, "left")}
                  disabled={currentSlide === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                  style={{
                    background: currentSlide === 0 ? "var(--muted)" : "var(--card)",
                    border: `1.5px solid ${currentSlide === 0 ? "var(--border)" : PRIMARY}`,
                    color: currentSlide === 0 ? "var(--muted-foreground)" : PRIMARY,
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    opacity: currentSlide === 0 ? 0.45 : 1,
                  }}
                >
                  ← Move left
                </button>
                <div
                  className="flex items-center gap-1 px-2 py-1.5 rounded-xl"
                  style={{ background: "var(--muted)", fontSize: "0.68rem", color: "var(--muted-foreground)" }}
                >
                  <ArrowLeftRight size={11} />
                  Reorder
                </div>
                <button
                  onClick={() => moveMedia(currentSlide, "right")}
                  disabled={currentSlide === mediaItems.length - 1}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                  style={{
                    background: currentSlide === mediaItems.length - 1 ? "var(--muted)" : "var(--card)",
                    border: `1.5px solid ${currentSlide === mediaItems.length - 1 ? "var(--border)" : PRIMARY}`,
                    color: currentSlide === mediaItems.length - 1 ? "var(--muted-foreground)" : PRIMARY,
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    opacity: currentSlide === mediaItems.length - 1 ? 0.45 : 1,
                  }}
                >
                  Move right →
                </button>
              </div>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={handleMediaAdd}
        />

        {/* ── Media actions ── */}
        <div className="px-4 mt-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="rounded-full"
              disabled={mediaItems.length >= 10}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon /> Upload photos
            </Button>
            <Button
              variant={linkUrl ? "secondary" : "outline"}
              className="rounded-full"
              onClick={() => setShowLinkInput(current => !current)}
            >
              <Link /> {linkUrl ? "Edit link" : "Insert link"}
            </Button>
          </div>

          {showLinkInput && (
            <div className="mt-3 rounded-2xl bg-card p-3">
              <div className="text-sm font-semibold text-card-foreground">Add a web link</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Paste a product page, social post, video, or other public URL.
              </div>
              <div className="mt-3 flex gap-2">
                <Input
                  type="url"
                  value={linkDraft}
                  placeholder="https://example.com"
                  className="h-10 rounded-xl"
                  onChange={event => setLinkDraft(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleLinkAdd();
                    }
                  }}
                />
                <Button className="h-10 rounded-xl" disabled={!linkDraft.trim()} onClick={handleLinkAdd}>
                  Add
                </Button>
              </div>
            </div>
          )}

          {linkUrl && !showLinkInput && (
            <div className="mt-3 flex items-center gap-3 rounded-2xl bg-card p-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                <Link />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-card-foreground">Attached link</span>
                <span className="mt-1 block truncate text-xs text-muted-foreground">{linkUrl}</span>
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                aria-label="Remove link"
                onClick={() => setLinkUrl("")}
              >
                <X />
              </Button>
            </div>
          )}
        </div>

        {/* ── Post Type selector ── */}
        <div className="px-4 mt-5">
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.06em", marginBottom: 8 }}>
            POST TYPE
          </div>
          <button
            onClick={() => setShowPostTypePicker(!showPostTypePicker)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl"
            style={{
              background: "var(--card)",
              border: `1.5px solid ${postType ? PRIMARY : "var(--border)"}`,
            }}
          >
            <span style={{ fontWeight: 600, color: postType ? "var(--foreground)" : "var(--muted-foreground)", fontSize: "0.88rem" }}>
              {postType || "Select post type"}
            </span>
            {showPostTypePicker ? <ChevronUp size={16} color="var(--muted-foreground)" /> : <ChevronDown size={16} color="var(--muted-foreground)" />}
          </button>

          {showPostTypePicker && (
            <div
              className="mt-1 rounded-2xl overflow-hidden"
              style={{ border: "1.5px solid var(--border)", background: "var(--card)" }}
            >
              {POST_TYPES.map((pt, idx) => (
                <button
                  key={pt}
                  onClick={() => { setPostType(pt); setShowPostTypePicker(false); }}
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                  style={{
                    borderBottom: idx < POST_TYPES.length - 1 ? "1px solid var(--border)" : "none",
                    background: postType === pt ? "#FFF0F7" : "transparent",
                  }}
                >
                  <span style={{ fontSize: "0.88rem", fontWeight: postType === pt ? 700 : 400, color: postType === pt ? PRIMARY : "var(--foreground)" }}>
                    {pt}
                  </span>
                  {postType === pt && <Check size={15} color={PRIMARY} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Group + Member selector ── */}
        <div className="px-4 mt-4">
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.06em", marginBottom: 8 }}>
            GROUP &amp; MEMBERS
          </div>
          <button
            onClick={() => setShowGroupPicker(!showGroupPicker)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl"
            style={{
              background: "var(--card)",
              border: `1.5px solid ${groupSelections.length > 0 ? PRIMARY : "var(--border)"}`,
            }}
          >
            <span
              style={{
                fontWeight: 600,
                color: groupSelections.length > 0 ? "var(--foreground)" : "var(--muted-foreground)",
                fontSize: "0.88rem",
                flex: 1,
                textAlign: "left",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                marginRight: 8,
              }}
            >
              {selectionLabel || "Select groups & members"}
            </span>
            {showGroupPicker ? <ChevronUp size={16} color="var(--muted-foreground)" /> : <ChevronDown size={16} color="var(--muted-foreground)" />}
          </button>

          {showGroupPicker && (
            <div
              className="mt-1 rounded-2xl overflow-hidden"
              style={{ border: "1.5px solid var(--border)", background: "var(--card)" }}
            >
              {GROUPS_DATA.map((group, gIdx) => {
                const selected = isGroupSelected(group.id);
                const expanded = expandedGroupId === group.id;
                const sel = groupSelections.find(s => s.groupId === group.id);

                return (
                  <div key={group.id} style={{ borderBottom: gIdx < GROUPS_DATA.length - 1 ? "1px solid var(--border)" : "none" }}>
                    {/* Group row */}
                    <div className="flex items-center px-4 py-2.5 gap-3">
                      <button
                        onClick={() => toggleGroupSelected(group.id)}
                        className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                        style={{
                          background: selected ? group.color : "transparent",
                          border: `2px solid ${selected ? group.color : "var(--border)"}`,
                        }}
                      >
                        {selected && <Check size={11} color="#fff" strokeWidth={3} />}
                      </button>
                      <div className="flex-1 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: group.color }}>
                          <span style={{ color: "#fff", fontSize: "0.45rem", fontWeight: 700 }}>{group.abbr}</span>
                        </div>
                        <span style={{ fontWeight: 600, color: "var(--foreground)", fontSize: "0.85rem" }}>{group.name}</span>
                      </div>
                      {selected && (
                        <button
                          onClick={() => setExpandedGroupId(expanded ? null : group.id)}
                          className="flex items-center gap-1"
                          style={{ color: "var(--muted-foreground)", fontSize: "0.72rem" }}
                        >
                          {sel?.allMembers ? "All" : `${sel?.memberIds.length || 0} mbr`}
                          {expanded ? <ChevronUp size={13} /> : <ChevronRight size={13} />}
                        </button>
                      )}
                    </div>

                    {/* Member selection — only when expanded */}
                    {selected && expanded && (
                      <div className="px-4 pb-3" style={{ background: `${group.color}08` }}>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {/* All members chip */}
                          <button
                            onClick={() => toggleAllMembers(group.id)}
                            className="px-3 py-1 rounded-full flex items-center gap-1"
                            style={{
                              background: sel?.allMembers ? group.color : "var(--card)",
                              color: sel?.allMembers ? "#fff" : "var(--muted-foreground)",
                              border: `1.5px solid ${sel?.allMembers ? group.color : "var(--border)"}`,
                              fontSize: "0.72rem",
                              fontWeight: 600,
                            }}
                          >
                            {sel?.allMembers && <Check size={10} color="#fff" />}
                            All members
                          </button>
                          {/* Individual member chips */}
                          {group.members.filter(m => !m.former).map(member => {
                            const memberSel = isMemberSelected(group.id, member.id) && !sel?.allMembers;
                            return (
                              <button
                                key={member.id}
                                onClick={() => toggleMember(group.id, member.id)}
                                className="px-3 py-1 rounded-full flex items-center gap-1"
                                style={{
                                  background: memberSel ? group.color : "var(--card)",
                                  color: memberSel ? "#fff" : "var(--muted-foreground)",
                                  border: `1.5px solid ${memberSel ? group.color : "var(--border)"}`,
                                  fontSize: "0.72rem",
                                  fontWeight: 600,
                                }}
                              >
                                {memberSel && <Check size={10} color="#fff" />}
                                {member.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Description ── */}
        <div className="px-4 mt-4">
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.06em", marginBottom: 8 }}>
            DESCRIPTION
          </div>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Write a caption, details, or context..."
            rows={4}
            className="w-full outline-none resize-none rounded-2xl px-4 py-3"
            style={{
              background: "var(--card)",
              border: "1.5px solid var(--border)",
              fontSize: "0.88rem",
              color: "var(--foreground)",
              lineHeight: 1.5,
            }}
          />
          <div className="flex justify-end mt-1">
            <span style={{ fontSize: "0.7rem", color: "var(--muted-foreground)" }}>
              {description.length}/500
            </span>
          </div>
        </div>

        {/* ── Post button (bottom) ── */}
        <div className="px-4 mt-6">
          <button
            onClick={handlePost}
            className="w-full py-3.5 rounded-2xl"
            style={{
              background: postType && (mediaItems.length > 0 || linkUrl)
                ? "linear-gradient(135deg, #E880A4 0%, #C9A8E0 60%, #7BBFEA 100%)"
                : "var(--muted)",
              color: postType && (mediaItems.length > 0 || linkUrl) ? "#fff" : "var(--muted-foreground)",
              fontWeight: 700,
              fontSize: "0.95rem",
            }}
          >
            Share Post
          </button>
        </div>

      </div>
    </div>
  );
}

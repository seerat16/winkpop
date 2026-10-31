import { useState, useRef } from "react";
import { useNavigate } from "../router";
import {
  Heart, ImagePlus, Link as LinkIcon, Star,
  Plus, X, CheckCircle2, MessageCircle, Truck,
  Search, SlidersHorizontal, Edit2, Globe, MapPin, Camera,
} from "lucide-react";
import { PHOTOCARDS, KNOWN_USERS } from "../data/mockData";
import { toast } from "sonner";

function photocardToListing(c: typeof PHOTOCARDS[0]) {
  return {
    id: c.id,
    title: `${c.groupName} ${c.memberName} · ${c.era}`,
    price: String(c.price),
    photoUri: null,
    listingType: "both",
    condition: c.condition ?? "near mint",
    listedAt: c.listedDate ?? new Date().toISOString(),
    isPhotocard: true,
    photocardId: c.id,
  };
}
import { GROUPS_DATA } from "../data/groupData";
import {
  ENTIRE_GROUP_MEMBER_ID,
  getCurrentUser,
  updateCurrentUser,
} from "../data/userStore";
import { addStory, deleteMyStories, getStoriesByUser } from "../data/storiesStore";
import { PhotocardImage } from "../components/PhotocardImage";
import { ShareToAccount } from "../components/ShareToAccount";

const PRIMARY = "var(--primary)";

function loadList(key: string): string[] {
  try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
}
function saveList(key: string, val: string[]) {
  localStorage.setItem(key, JSON.stringify(val));
}
function loadMyListings(): any[] {
  try { return JSON.parse(localStorage.getItem("barter_my_listings") || "[]"); } catch { return []; }
}
function loadMyPosts(): any[] {
  try { return JSON.parse(localStorage.getItem("barter_my_posts") || "[]"); } catch { return []; }
}

function compressAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const maxSize = 400;
      const scale = Math.min(maxSize / image.width, maxSize / image.height, 1);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Could not prepare image"));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.75));
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not load image"));
    };
    image.src = objectUrl;
  });
}

type SocialModal = null | "followers" | "following";
type ListingFilter = "all" | "for-trade" | "for-sale" | "available";
type ContentTab = "posts" | "listings" | "all";

const LISTING_TYPES = new Set(["for-trade", "for-sale", "both"]);

export default function ProfileScreen() {
  const navigate = useNavigate();
  const [socialModal, setSocialModal] = useState<SocialModal>(null);
  const [followingIds, setFollowingIds] = useState<string[]>(() => loadList("barter_following"));
  const [followerIds] = useState<string[]>(() => loadList("barter_followers"));
  const [contentTab, setContentTab] = useState<ContentTab>("all");
  const [listingFilter, setListingFilter] = useState<ListingFilter>("all");
  const [listingSearch, setListingSearch] = useState("");
  const [myStories, setMyStories] = useState(() => getStoriesByUser());
  const [showStoryOptions, setShowStoryOptions] = useState(false);
  const [avatarBase64, setAvatarBase64] = useState(() => getCurrentUser()?.avatarBase64 ?? null);
  const storyInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const currentUser = getCurrentUser();
  if (!currentUser) { navigate("/"); return null; }

  const myCards = PHOTOCARDS.filter(c => currentUser.collectionIds.includes(c.id));
  const collectingGroups = GROUPS_DATA.filter(g => currentUser.collectingGroups.includes(g.id));
  const followers = KNOWN_USERS.filter(u => followerIds.includes(u.id));
  const following = KNOWN_USERS.filter(u => followingIds.includes(u.id));
  const uploadedListings = loadMyListings();
  const photocardListings = PHOTOCARDS.filter(c => c.sellerId === "me").map(photocardToListing);
  const myPosts = loadMyPosts().filter((post: any) => !post.ownerEmail || post.ownerEmail === currentUser.email);
  const myListings = [...myPosts, ...uploadedListings, ...photocardListings];

  // Posts = items NOT marked for trade or sale
  const postItems = myListings.filter((l: any) => !LISTING_TYPES.has(l.listingType));
  // Listings = items marked for trade or sale
  const listingItems = myListings.filter((l: any) => LISTING_TYPES.has(l.listingType));

  const showFilterChips = contentTab === "listings" || contentTab === "all";

  const baseItems = contentTab === "posts" ? postItems : contentTab === "listings" ? listingItems : myListings;

  const filteredListings = baseItems.filter((l: any) => {
    if (listingSearch && !l.title?.toLowerCase().includes(listingSearch.toLowerCase())) return false;
    if (!showFilterChips) return true;
    if (listingFilter === "for-trade") return l.listingType === "for-trade" || l.listingType === "both";
    if (listingFilter === "for-sale") return l.listingType === "for-sale" || l.listingType === "both";
    return true;
  });

  const handleStoryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      addStory(
        currentUser.email,
        currentUser.username || currentUser.displayName || "me",
        "linear-gradient(135deg,var(--primary),#C4A0DC)",
        base64,
        avatarBase64 ?? undefined,
      );
      setMyStories(getStoriesByUser());
      setShowStoryOptions(false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressAvatar(file);
      updateCurrentUser({ avatarBase64: compressed });
      setAvatarBase64(compressed);
      toast.success("Profile photo saved");
    } catch {
      toast.error("Could not save that photo. Try a different image.");
    } finally {
      e.target.value = "";
    }
  };

  const deleteMyStory = () => {
    if (!currentUser) return;
    deleteMyStories(currentUser.email);
    setMyStories(getStoriesByUser());
    setShowStoryOptions(false);
  };

  const hasMyStory = myStories.some(g => g.userId === currentUser?.email);

  const toggleFollow = (id: string) => {
    setFollowingIds(prev => {
      const next = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
      saveList("barter_following", next);
      return next;
    });
  };

  const UserRow = ({ user }: { user: typeof KNOWN_USERS[0] }) => {
    const isFollowing = followingIds.includes(user.id);
    return (
      <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid #f5f5f5" }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white" style={{ background: "linear-gradient(135deg, #FFB8D0, #C9A8E0)", fontWeight: 700, fontSize: "0.9rem" }}>
          {user.username[0].toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1">
            <span style={{ fontWeight: 600, color: "#333", fontSize: "0.88rem" }}>@{user.username}</span>
            {user.verified && <CheckCircle2 size={12} color="#5CC0A8" fill="#5CC0A8" />}
          </div>
          <div style={{ fontSize: "0.72rem", color: "#bbb" }}>{user.country}</div>
        </div>
        <button
          onClick={() => toggleFollow(user.id)}
          className="px-3 py-1.5 rounded-full"
          style={{ background: isFollowing ? "#EDFAF5" : PRIMARY, color: isFollowing ? "#5CC0A8" : "#fff", border: isFollowing ? "1.5px solid #5CC0A8" : "none", fontSize: "0.72rem", fontWeight: 600 }}
        >
          {isFollowing ? "Following" : "Follow"}
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--background)" }}>

      {/* ── TOP: username + icons ── */}
      <div className="flex items-center justify-between px-4 pt-5 pb-2">
        <div style={{ fontWeight: 700, color: "#2d2d2d", fontSize: "1.05rem" }}>
          {currentUser.username || "Steyshewonceister"}
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate("/settings")} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#fff" }}>
            <Truck size={17} color="#888" />
          </button>
          <button onClick={() => navigate("/messages")} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#fff" }}>
            <MessageCircle size={17} color="#888" />
          </button>
          <button onClick={() => navigate("/settings")} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#fff" }}>
            <Edit2 size={17} color="#888" />
          </button>
        </div>
      </div>

      {/* ── AVATAR + INFO ── */}
      <div className="px-4 pb-3">
        <div className="flex items-start gap-4">
          {/* Avatar + story ring */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowStoryOptions(true)}
              className="w-20 h-20 rounded-full flex items-center justify-center text-white overflow-hidden"
              style={{
                padding: hasMyStory ? 2.5 : 0,
                background: hasMyStory
                  ? "linear-gradient(135deg, var(--primary), #C4A0DC)"
                  : "linear-gradient(135deg, #E8D8F5, #C4A0DC)",
              }}
            >
              <div
                className="w-full h-full rounded-full flex items-center justify-center overflow-hidden"
                style={{ background: "linear-gradient(135deg, #E8D8F5, #C9A8E0)", fontSize: "2rem", fontWeight: 700 }}
              >
                {avatarBase64 ? (
                  <img src={avatarBase64} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{currentUser.displayName?.[0]?.toUpperCase() || "✨"}</span>
                )}
              </div>
            </button>
            {/* Story add/camera button */}
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: "var(--primary)", border: "2px solid var(--background)" }}
              aria-label="Upload profile photo"
            >
              <Camera size={11} color="#fff" />
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
            <input ref={storyInputRef} type="file" accept="image/*" className="hidden" onChange={handleStoryUpload} />
          </div>

          <div className="flex-1 pt-1">
            {/* Location + shipping + trading badge */}
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <MapPin size={11} color="var(--muted-foreground)" />
              <span style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>{currentUser.country || "United States"}</span>
              <Truck size={12} color="var(--muted-foreground)" />
              <span style={{ fontSize: "0.68rem", color: "var(--muted-foreground)" }}>shipping</span>
              <span
                className="flex items-center gap-0.5 px-2 py-0.5 rounded-full"
                style={{
                  background: currentUser.international ? "var(--secondary)" : "var(--muted)",
                  border: "1px solid var(--border)",
                  fontSize: "0.62rem",
                  fontWeight: 600,
                  color: "var(--primary)",
                }}
              >
                {currentUser.international ? <Globe size={9} /> : <MapPin size={9} />}
                {currentUser.international ? "Intl. trades" : "Domestic only"}
              </span>
            </div>

            {/* Stars + reviews */}
            <button onClick={() => navigate("/reviews")} className="flex items-center gap-1 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={13} color="#FFB845" fill="#FFB845" />
              ))}
              <span style={{ fontSize: "0.72rem", color: "#666", marginLeft: 2 }}>
                <span style={{ fontWeight: 700 }}>12 reviews</span>
              </span>
            </button>

            {/* Stats */}
            <div className="flex gap-4">
              <button className="text-center" onClick={() => setSocialModal("followers")}>
                <div style={{ fontWeight: 700, color: "#2d2d2d", fontSize: "0.92rem" }}>{followers.length}</div>
                <div style={{ fontSize: "0.65rem", color: "#bbb" }}>Followers</div>
              </button>
              <button className="text-center" onClick={() => setSocialModal("following")}>
                <div style={{ fontWeight: 700, color: "#2d2d2d", fontSize: "0.92rem" }}>{following.length}</div>
                <div style={{ fontSize: "0.65rem", color: "#bbb" }}>Following</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── BIO ── */}
      <div className="px-4 mb-3">
        <div
          className="p-3 rounded-2xl"
          style={{ background: "linear-gradient(135deg, #FFB8D0 0%, #C9A8E0 60%, #B8DEFF 100%)", minHeight: 60 }}
        >
          <div style={{ fontWeight: 700, color: "#fff", fontSize: "0.75rem", marginBottom: 4, letterSpacing: "0.05em" }}>BIO</div>
          <div style={{ color: "rgba(255,255,255,0.9)", fontSize: "0.82rem", lineHeight: 1.4 }}>
            {(currentUser as any).bio || "K-pop collector ✨ | Trading & selling photocards worldwide 💕"}
          </div>
        </div>
      </div>

      {/* ── CURRENTLY COLLECTING ── */}
      <div className="px-4 mb-3">
        <div className="flex items-center justify-between mb-2">
          <span style={{ fontSize: "0.8rem", color: "#999", fontWeight: 600 }}>Currently Collecting</span>
          <button onClick={() => navigate("/edit-groups")} className="flex items-center gap-1" style={{ color: PRIMARY, fontSize: "0.72rem", fontWeight: 600 }}>
            <Edit2 size={11} /> Edit
          </button>
        </div>
        {collectingGroups.length > 0 ? (
          <div
            className="flex gap-2 overflow-x-auto pb-1"
            style={{ scrollbarWidth: "thin", scrollbarColor: "var(--border) transparent" }}
          >
            {collectingGroups.map(group => {
              const selectedMemberIds = currentUser.collectingMembers?.[group.id] || [];
              const collectsEntireGroup = selectedMemberIds.includes(ENTIRE_GROUP_MEMBER_ID);
              const selectedMembers = group.members.filter(member =>
                selectedMemberIds.includes(member.id),
              );
              return (
                <button
                  key={group.id}
                  onClick={() => navigate("/edit-groups")}
                  className="flex h-12 min-w-28 flex-shrink-0 items-center gap-2 rounded-xl px-2 text-left"
                  style={{ background: "#F5F0FF", border: "1px solid #E0D0FF" }}
                  aria-label={`Edit ${group.name} collecting members`}
                >
                  <div
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
                    style={{ background: "#9B82D4", color: "#fff", fontSize: "0.52rem", fontWeight: 700 }}
                  >
                    {group.abbr.slice(0, 3).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="whitespace-nowrap" style={{ fontSize: "0.62rem", fontWeight: 700, color: "#9B82D4" }}>
                      {group.name}
                    </div>
                    <div className="truncate" style={{ fontSize: "0.52rem", color: "var(--muted-foreground)" }}>
                      {collectsEntireGroup
                        ? "Full group"
                        : selectedMembers.length > 0
                        ? selectedMembers.map(member => member.name).join(", ")
                        : "No idols selected"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <button
            onClick={() => navigate("/edit-groups")}
            className="w-full rounded-xl px-3 py-2 text-left"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted-foreground)", fontSize: "0.7rem" }}
          >
            Add groups and idols you are currently collecting.
          </button>
        )}
      </div>

      {/* ── PROFILE SHORTCUTS ── */}
      <div className="px-4 mb-3">
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: Star, label: "collection", path: "/collection", color: "#9B82D4", bg: "#F5F0FF" },
            { icon: Heart, label: "wishlist", path: "/wishlist", color: PRIMARY, bg: "#FFF0F7" },
            { icon: Search, label: "ISO", path: "/upload-post?type=ISO", color: PRIMARY, bg: "var(--secondary)" },
            { icon: ImagePlus, label: "info", path: "/upload-post", color: PRIMARY, bg: "var(--secondary)" },
          ].map(item => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-1.5 py-3 rounded-2xl"
              style={{ background: "#fff" }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: item.bg }}>
                <item.icon size={18} color={item.color} />
              </div>
              <span style={{ fontSize: "0.65rem", color: "#666", fontWeight: 500 }}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── LISTINGS / POSTS / ALL ── */}
      <div className="px-4 mb-2">
        {/* Three-tab header */}
        <div className="flex items-center gap-1 mb-3" style={{ background: "#F5E5EE", borderRadius: 12, padding: 3 }}>
          {([
            { id: "posts", label: "Posts" },
            { id: "listings", label: "Listings" },
            { id: "all", label: "All" },
          ] as { id: ContentTab; label: string }[]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setContentTab(tab.id)}
              className="flex-1 py-1.5 rounded-lg"
              style={{
                background: contentTab === tab.id ? "#fff" : "transparent",
                color: contentTab === tab.id ? PRIMARY : "#999",
                fontWeight: 700,
                fontSize: "0.82rem",
                boxShadow: contentTab === tab.id ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search + filter row */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "#fff", border: "1.5px solid #F0D8E8" }}>
            <Search size={13} color="#bbb" />
            <input
              value={listingSearch}
              onChange={e => setListingSearch(e.target.value)}
              placeholder="search items"
              className="flex-1 outline-none bg-transparent"
              style={{ fontSize: "0.8rem", color: "#555" }}
            />
          </div>
          <button className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#fff", border: "1.5px solid #F0D8E8" }}>
            <SlidersHorizontal size={14} color="#888" />
          </button>
        </div>

        {/* Filter chips — only for Listings and All tabs */}
        {showFilterChips && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3" style={{ scrollbarWidth: "none" }}>
            {([
              { id: "all", label: "all" },
              { id: "for-trade", label: "for trade" },
              { id: "for-sale", label: "for sale" },
              { id: "available", label: "available" },
            ] as { id: ListingFilter; label: string }[]).map(f => (
              <button
                key={f.id}
                onClick={() => setListingFilter(f.id)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full"
                style={{
                  background: listingFilter === f.id ? PRIMARY : "#fff",
                  color: listingFilter === f.id ? "#fff" : "#888",
                  border: `1.5px solid ${listingFilter === f.id ? PRIMARY : "#F0D8E8"}`,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* Listings grid */}
        {(() => {
          const ListingCard = ({ listing }: { listing: any }) => {
            const pc = listing.isPhotocard ? PHOTOCARDS.find(c => c.id === listing.photocardId) : null;
            const isPost = !LISTING_TYPES.has(listing.listingType);
            const thumbSrc = listing.mediaItems?.[0] || listing.photoUri;
            const slideCount = listing.mediaItems?.length ?? 0;
            return (
              <div
                key={listing.id}
                className="rounded-xl overflow-hidden text-left relative cursor-pointer"
                style={{ border: "1px solid var(--border)", background: "var(--card)" }}
                onClick={() => {
                  if (isPost) {
                    if (listing.externalLink) {
                      window.open(listing.externalLink, "_blank", "noopener,noreferrer");
                    }
                    return;
                  }
                  navigate(listing.isPhotocard ? `/card/${listing.id}` : `/listing/${listing.id}`);
                }}
              >
                {pc ? (
                  <PhotocardImage
                    groupId={pc.groupId} memberId={pc.memberId} memberName={pc.memberName}
                    imgSeed={pc.imgSeed} databaseImageFilename={pc.databaseImageFilename}
                    uploadImageFilename={pc.uploadImageFilename}
                    className="w-full" style={{ aspectRatio: "3/4.5" } as any}
                  />
                ) : thumbSrc && thumbSrc !== "placeholder" ? (
                  <img src={thumbSrc} alt="card" className="w-full" style={{ aspectRatio: "1", objectFit: "cover" }} />
                ) : (
                  <div className="w-full flex items-center justify-center" style={{ aspectRatio: isPost ? "1" : "3/4.5", background: "linear-gradient(135deg, var(--primary), var(--accent))", fontSize: "1.5rem" }}>
                    {isPost ? "📸" : "🎴"}
                  </div>
                )}
                {/* Post type badge */}
                {isPost && listing.postType && (
                  <div
                    className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded"
                    style={{ background: "rgba(212,117,154,0.85)", color: "#fff", fontSize: "0.55rem", fontWeight: 700 }}
                  >
                    {listing.postType}
                  </div>
                )}
                {isPost && listing.externalLink && (
                  <div className="absolute bottom-10 right-1.5 flex size-6 items-center justify-center rounded-full bg-card text-primary">
                    <LinkIcon size={12} />
                  </div>
                )}
                {/* Multiple slides indicator */}
                {isPost && slideCount > 1 && (
                  <div
                    className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(0,0,0,0.45)", color: "#fff", fontSize: "0.55rem", fontWeight: 700 }}
                  >
                    +{slideCount}
                  </div>
                )}
                <div className="p-1.5">
                  <div style={{ fontSize: "0.62rem", color: PRIMARY, fontWeight: 600 }} className="line-clamp-1">{listing.title || "Card"}</div>
                  {!isPost && listing.price && <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--foreground)" }}>${parseFloat(listing.price).toFixed(2)}</div>}
                  {isPost && listing.description && (
                    <div style={{ fontSize: "0.6rem", color: "var(--muted-foreground)" }} className="line-clamp-1">{listing.description}</div>
                  )}
                  {!isPost && (
                    <div className="mt-xs flex justify-end">
                      <ShareToAccount
                        itemType="listing"
                        itemTitle={listing.title || "Listing"}
                        itemPath={
                          listing.isPhotocard
                            ? `/card/${listing.id}`
                            : `/listing/${listing.id}`
                        }
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          };

          return (
            <div className="grid grid-cols-3 gap-2 mb-4">
              {filteredListings.map((listing: any) => <ListingCard key={listing.id} listing={listing} />)}
              <button
                onClick={() => navigate(contentTab === "posts" ? "/upload-post" : "/list-card")}
                className="rounded-xl flex items-center justify-center"
                style={{ border: "2px dashed var(--border)", aspectRatio: contentTab === "posts" ? "1" : "3/4.5", background: "var(--card)" }}
                aria-label={contentTab === "posts" ? "Create post" : "Create listing"}
              >
                <Plus size={22} color={PRIMARY} />
              </button>
            </div>
          );
        })()}
      </div>

      {/* ── STORY OPTIONS SHEET ── */}
      {showStoryOptions && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setShowStoryOptions(false)}>
          <div className="rounded-t-3xl p-6 pb-10 flex flex-col gap-3" style={{ background: "var(--card)" }} onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full mx-auto mb-2" style={{ background: "var(--muted)" }} />
            <p style={{ fontWeight: 700, color: "var(--foreground)", fontSize: "1rem", marginBottom: 4 }}>Your Story</p>
            <button
              onClick={() => { storyInputRef.current?.click(); setShowStoryOptions(false); }}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{ background: "var(--secondary)" }}
            >
              <Camera size={20} color="var(--primary)" />
              <span style={{ fontWeight: 600, color: "var(--foreground)", fontSize: "0.9rem" }}>Take photo or upload from camera roll</span>
            </button>
            {hasMyStory && (
              <button
                onClick={deleteMyStory}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                style={{ background: "#FFF0F0" }}
              >
                <X size={20} color="#E05555" />
                <span style={{ fontWeight: 600, color: "#E05555", fontSize: "0.9rem" }}>Delete my story</span>
              </button>
            )}
            <button onClick={() => setShowStoryOptions(false)} style={{ color: "var(--muted-foreground)", fontSize: "0.85rem", marginTop: 4 }}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── FOLLOWERS/FOLLOWING MODAL ── */}
      {socialModal && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#fff" }}>
          <div className="flex items-center gap-3 px-4 pt-5 pb-0 flex-shrink-0" style={{ background: "var(--background)" }}>
            <button onClick={() => setSocialModal(null)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#fff" }}>
              <X size={18} color="#333" />
            </button>
            <div className="flex gap-1 flex-1" style={{ background: "#F5E5EE", borderRadius: 10, padding: 3 }}>
              {(["followers", "following"] as const).map(tab => (
                <button key={tab} onClick={() => setSocialModal(tab)} className="flex-1 py-1.5 rounded-lg" style={{ background: socialModal === tab ? "#fff" : "transparent", color: socialModal === tab ? PRIMARY : "#999", fontWeight: 600, fontSize: "0.82rem" }}>
                  {tab === "followers" ? `Followers (${followers.length})` : `Following (${following.length})`}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {socialModal === "followers" && (followers.length === 0
              ? <div className="flex flex-col items-center justify-center py-20" style={{ color: "#ccc" }}><p style={{ fontSize: "0.9rem" }}>No followers yet</p></div>
              : followers.map(u => <UserRow key={u.id} user={u} />)
            )}
            {socialModal === "following" && (following.length === 0
              ? <div className="flex flex-col items-center justify-center py-20" style={{ color: "#ccc" }}><p style={{ fontSize: "0.9rem" }}>Not following anyone yet</p></div>
              : following.map(u => <UserRow key={u.id} user={u} />)
            )}
          </div>
        </div>
      )}
    </div>
  );
}

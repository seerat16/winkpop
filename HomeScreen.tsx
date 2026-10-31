import { useState, useRef } from "react";
import { useNavigate } from "../router";
import { Search, ShoppingCart, Heart, ChevronRight } from "lucide-react";
import { AppLogo } from "../components/AppLogo";
import { PHOTOCARDS } from "../data/mockData";
import { getCurrentUser, addToCart, removeFromCart, addToLikes, removeFromLikes } from "../data/userStore";
import { PhotocardImage } from "../components/PhotocardImage";
import { StoriesRow } from "../components/StoriesRow";
import { addStory } from "../data/storiesStore";
import { ShareToAccount } from "../components/ShareToAccount";

const PRIMARY = "var(--primary)";

type Filter = "suggested" | "new";

export default function HomeScreen() {
  const navigate = useNavigate();
  const storyInputRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState<Filter>("suggested");
  const [wishlist, setWishlist] = useState<string[]>(() => getCurrentUser()?.likesIds ?? []);
  const [cartIds, setCartIds] = useState<string[]>(() => getCurrentUser()?.cartIds ?? []);
  const cartCount = cartIds.length;

  const cards = filter === "suggested"
    ? PHOTOCARDS.slice(0, 12)
    : [...PHOTOCARDS].sort((a, b) => b.imgSeed - a.imgSeed).slice(0, 12);

  const toggleWishlist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (wishlist.includes(id)) {
      removeFromLikes(id);
      setWishlist(prev => prev.filter(i => i !== id));
    } else {
      addToLikes(id);
      setWishlist(prev => [...prev, id]);
    }
  };

  const handleStoryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const currentUser = getCurrentUser();
    if (!file || !currentUser) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      addStory(
        currentUser.email,
        currentUser.username || currentUser.displayName || "me",
        "linear-gradient(135deg, var(--primary), #C4A0DC)",
        ev.target?.result as string,
        currentUser.avatarBase64 ?? undefined,
      );
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const toggleCart = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (cartIds.includes(id)) {
      removeFromCart(id);
      setCartIds(prev => prev.filter(i => i !== id));
    } else {
      addToCart(id);
      setCartIds(prev => [...prev, id]);
    }
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="px-4 pt-5 pb-3 sticky top-0 z-10" style={{ background: "var(--background)" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <AppLogo size={72} />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/cart")} className="relative">
              <ShoppingCart size={21} color="#888" />
              {cartCount > 0 && (
                <span
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ background: PRIMARY, color: "#fff", fontSize: "9px", fontWeight: 700 }}
                >
                  {cartCount}
                </span>
              )}
            </button>
            <button onClick={() => navigate("/likes")} aria-label="View liked posts">
              <Heart size={21} color="#888" />
            </button>
          </div>
        </div>

        {/* Search bar */}
        <button
          onClick={() => navigate("/browse")}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl mb-3"
          style={{ background: "#fff", border: "1.5px solid #F0D8E8" }}
        >
          <Search size={15} color="#ccc" />
          <span style={{ color: "#ccc", fontSize: "0.85rem" }}>Search your favorite photocards...</span>
        </button>

        {/* Browse by category header */}
        <div className="flex items-center justify-between mb-3">
          <div style={{ fontWeight: 700, color: "#2d2d2d", fontSize: "0.95rem" }}>
            Browse by{" "}
            <span style={{ fontStyle: "italic", color: PRIMARY }}>category</span>
          </div>
          <button onClick={() => navigate("/browse")} className="flex items-center" style={{ color: "#ccc" }}>
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-1">
          {(["suggested", "new"] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-1.5 rounded-full"
              style={{
                background: filter === f ? PRIMARY : "#fff",
                color: filter === f ? "#fff" : "#888",
                border: `1.5px solid ${filter === f ? "var(--primary)" : "var(--border)"}`,
                fontSize: "0.8rem",
                fontWeight: 600,
              }}
            >
              {f === "suggested" ? "Suggested" : "New Drops"}
            </button>
          ))}
        </div>
      </div>

      {/* Stories row — follows from accounts you follow */}
      <StoriesRow onAddStory={() => storyInputRef.current?.click()} />
      <input
        ref={storyInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleStoryUpload}
      />

      {/* Card grid */}
      <div className="px-4 pb-6">
        <div className="grid grid-cols-2 gap-3">
          {cards.map(card => {
            const isWishlisted = wishlist.includes(card.id);
            return (
              <div
                key={card.id}
                onClick={() => navigate(`/card/${card.id}`)}
                className="rounded-2xl overflow-hidden cursor-pointer"
                style={{ background: "#fff", border: "1px solid #F0D8E8" }}
              >
                <div className="relative">
                  <PhotocardImage
                    groupId={card.groupId}
                    memberId={card.memberId}
                    memberName={card.memberName}
                    imgSeed={card.imgSeed}
                    databaseImageFilename={card.databaseImageFilename}
                    uploadImageFilename={card.uploadImageFilename}
                    className="w-full"
                    style={{ aspectRatio: "3/4" } as any}
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <ShareToAccount
                      itemType="listing"
                      itemTitle={`${card.groupName} ${card.memberName} · ${card.era}`}
                      itemPath={`/card/${card.id}`}
                      compact
                    />
                    <button
                      onClick={e => toggleCart(card.id, e)}
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: cartIds.includes(card.id) ? "#5CC0A8" : "rgba(255,255,255,0.92)" }}
                    >
                      <ShoppingCart size={11} color={cartIds.includes(card.id) ? "#fff" : "#888"} />
                    </button>
                    <button
                      onClick={e => toggleWishlist(card.id, e)}
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(255,255,255,0.92)" }}
                    >
                      <Heart size={11} color={isWishlisted ? PRIMARY : "#ccc"} fill={isWishlisted ? PRIMARY : "none"} />
                    </button>
                  </div>
                  {card.damaged && (
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-lg" style={{ background: "#F4A07C" }}>
                      <span style={{ color: "#fff", fontSize: "8px", fontWeight: 700 }}>⚠ DAMAGED</span>
                    </div>
                  )}
                </div>
                <div className="px-2.5 py-2">
                  <div style={{ fontSize: "0.65rem", color: PRIMARY, fontWeight: 700 }}>{card.groupName}</div>
                  <div style={{ fontSize: "0.72rem", color: "#555", marginTop: 1 }} className="line-clamp-1">
                    {card.memberName} · {card.era}
                  </div>
                  <div style={{ fontWeight: 700, color: "#2d2d2d", marginTop: 3, fontSize: "0.88rem" }}>
                    ${card.price.toFixed(2)}{" "}
                    <span style={{ color: "#bbb", fontWeight: 400, fontSize: "0.68rem" }}>USD</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

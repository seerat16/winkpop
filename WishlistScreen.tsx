import { useState, useEffect } from "react";
import { useNavigate } from "../router";
import { ArrowLeft, X, Plus, Search, ArrowLeftRight, ShoppingCart, CheckCircle2, Star } from "lucide-react";
import { PHOTOCARDS, GROUPS } from "../data/mockData";
import { PhotocardImage } from "../components/PhotocardImage";
import { toast } from "sonner";
import { getCurrentUser, removeFromLikes, addToLikes } from "../data/userStore";

type Listing = {
  id: string;
  type: "trade" | "sale";
  seller: string;
  country: string;
  price: number;
  verified: boolean;
  card: typeof PHOTOCARDS[0];
};

function getListingsForCard(cardId: string): { trades: Listing[]; sales: Listing[] } {
  const card = PHOTOCARDS.find(c => c.id === cardId);
  if (!card) return { trades: [], sales: [] };

  const similar = PHOTOCARDS.filter(c => c.memberId === card.memberId && c.id !== cardId);

  const mockSellers = [
    { seller: "kpoptrader_nyc", country: "🇺🇸", verified: true },
    { seller: "sunflower_seoul", country: "🇰🇷", verified: false },
    { seller: "poca_paradise", country: "🇨🇦", verified: true },
    { seller: "cardcollector99", country: "🇬🇧", verified: false },
  ];

  const trades: Listing[] = similar.slice(0, 2).map((c, i) => ({
    id: `trade-${c.id}`,
    type: "trade",
    seller: mockSellers[i % mockSellers.length].seller,
    country: mockSellers[i % mockSellers.length].country,
    price: c.price,
    verified: mockSellers[i % mockSellers.length].verified,
    card: c,
  }));

  const salesSource = [card, ...similar.slice(2, 4)];
  const sales: Listing[] = salesSource.map((c, i) => ({
    id: `sale-${c.id}-${i}`,
    type: "sale",
    seller: mockSellers[(i + 2) % mockSellers.length].seller,
    country: mockSellers[(i + 2) % mockSellers.length].country,
    price: c.price,
    verified: mockSellers[(i + 2) % mockSellers.length].verified,
    card: c,
  })).sort((a, b) => a.price - b.price);

  return { trades, sales };
}

export default function WishlistScreen() {
  const navigate = useNavigate();
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");

  useEffect(() => {
    const user = getCurrentUser();
    if (user) setWishlistIds(user.likesIds || []);

    const result = (() => { try { return JSON.parse(localStorage.getItem("barter_select_result") || "null"); } catch { return null; } })();
    if (result?.mode === "likes" && result.cardIds?.length) {
      localStorage.removeItem("barter_select_result");
      result.cardIds.forEach((id: string) => addToLikes(id));
      const fresh = getCurrentUser();
      setWishlistIds(fresh?.likesIds || []);
      toast.success(`${result.cardIds.length} card${result.cardIds.length !== 1 ? "s" : ""} added to likes!`);
    }
  }, []);

  const wishlistCards = PHOTOCARDS.filter(c => wishlistIds.includes(c.id));

  const handleRemoveFromWishlist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeFromLikes(id);
    setWishlistIds(prev => prev.filter(i => i !== id));
    toast("Removed from likes");
  };

  const toggleWishlistAdd = (id: string) => {
    if (wishlistIds.includes(id)) {
      removeFromLikes(id);
      setWishlistIds(prev => prev.filter(i => i !== id));
    } else {
      addToLikes(id);
      setWishlistIds(prev => [...prev, id]);
    }
  };

  const filteredBrowse = PHOTOCARDS.filter(c => {
    const matchGroup = groupFilter === "all" || c.groupId === groupFilter;
    const matchSearch = !search || c.memberName.toLowerCase().includes(search.toLowerCase()) || c.groupName.toLowerCase().includes(search.toLowerCase()) || c.era.toLowerCase().includes(search.toLowerCase());
    return matchGroup && matchSearch;
  });

  const selectedCard = selectedCardId ? PHOTOCARDS.find(c => c.id === selectedCardId) : null;
  const listings = selectedCardId ? getListingsForCard(selectedCardId) : { trades: [], sales: [] };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-4" style={{ background: "var(--background)" }}>
        <button onClick={() => navigate("/home")} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#fff" }}>
          <ArrowLeft size={18} color="#333" />
        </button>
        <div className="flex-1">
          <h2 style={{ color: "#2d2d2d" }}>Likes</h2>
          <div style={{ fontSize: "0.72rem", color: "#999" }}>Cards you want to own</div>
        </div>
        <button
          onClick={() => navigate("/home")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
          style={{ background: "#D4759A", color: "#fff", fontSize: "0.78rem", fontWeight: 600 }}
        >
          <Plus size={14} /> Add
        </button>
      </div>

      {/* Wishlist grid */}
      {wishlistCards.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8" style={{ color: "#ccc" }}>
          <Star size={48} strokeWidth={1} />
          <p style={{ fontSize: "0.9rem", textAlign: "center" }}>No liked cards yet. Add cards you want to hunt for!</p>
          <button
            onClick={() => navigate("/home")}
            className="px-5 py-2.5 rounded-xl"
            style={{ background: "#D4759A", color: "#fff", fontWeight: 600 }}
          >
            Add Cards
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2.5 px-4 pt-4 pb-6">
          {wishlistCards.map(card => {
            const { trades, sales } = getListingsForCard(card.id);
            const totalListings = trades.length + sales.length;
            return (
              <div
                key={card.id}
                className="rounded-xl overflow-hidden relative cursor-pointer"
                style={{ background: "#fff", border: "1px solid #F0D8E8" }}
                onClick={() => setSelectedCardId(card.id)}
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
                    style={{ aspectRatio: "3/4.5" } as any}
                  />
                  <button
                    onClick={e => handleRemoveFromWishlist(card.id, e)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(255,255,255,0.9)" }}
                  >
                    <X size={11} color="#999" />
                  </button>
                  {totalListings > 0 && (
                    <div
                      className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-full"
                      style={{ background: "#5CC0A8", color: "#fff", fontSize: "0.58rem", fontWeight: 700 }}
                    >
                      {totalListings} listing{totalListings > 1 ? "s" : ""}
                    </div>
                  )}
                </div>
                <div className="p-1.5">
                  <div style={{ fontSize: "0.62rem", color: "#D4759A", fontWeight: 600 }}>{card.memberName}</div>
                  <div style={{ fontSize: "0.58rem", color: "#999" }}>{card.era}</div>
                </div>
              </div>
            );
          })}
          <div
            onClick={() => navigate("/home")}
            className="rounded-xl flex items-center justify-center cursor-pointer"
            style={{ border: "2px dashed #F0D8E8", aspectRatio: "3/4.5", background: "#fff" }}
          >
            <Plus size={22} color="#D4759A" />
          </div>
        </div>
      )}

      {/* Card detail overlay */}
      {selectedCard && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#fff" }}>
          <div className="flex items-center gap-3 px-4 pt-5 pb-4" style={{ background: "var(--background)", flexShrink: 0 }}>
            <button
              onClick={() => setSelectedCardId(null)}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "#fff" }}
            >
              <ArrowLeft size={18} color="#333" />
            </button>
            <div>
              <div style={{ fontWeight: 700, color: "#2d2d2d", fontSize: "0.95rem" }}>{selectedCard.memberName}</div>
              <div style={{ fontSize: "0.72rem", color: "#999" }}>{selectedCard.groupName} · {selectedCard.era}</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-8">
            {/* Card preview */}
            <div className="flex gap-4 py-4">
              <div className="rounded-xl overflow-hidden flex-shrink-0" style={{ width: 90 }}>
                <PhotocardImage
                  groupId={selectedCard.groupId}
                  memberId={selectedCard.memberId}
                  memberName={selectedCard.memberName}
                  imgSeed={selectedCard.imgSeed}
                  className="w-full"
                  style={{ aspectRatio: "3/4.5" } as any}
                />
              </div>
              <div className="flex flex-col justify-center gap-1">
                <div style={{ fontSize: "0.72rem", color: "#999" }}>Type: <span style={{ color: "#555" }}>{selectedCard.type}</span></div>
                <div style={{ fontSize: "0.72rem", color: "#999" }}>Condition varies by listing</div>
                <button
                  onClick={() => { removeFromLikes(selectedCard.id); setWishlistIds(p => p.filter(i => i !== selectedCard.id)); setSelectedCardId(null); toast("Removed from likes"); }}
                  className="mt-2 px-3 py-1.5 rounded-lg self-start"
                  style={{ border: "1.5px solid #F0D8E8", color: "#999", fontSize: "0.72rem" }}
                >
                  Remove from likes
                </button>
              </div>
            </div>

            {/* Trade listings */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "#FFF0F7" }}>
                  <ArrowLeftRight size={14} color="#D4759A" />
                </div>
                <span style={{ fontWeight: 700, color: "#2d2d2d", fontSize: "0.9rem" }}>Trade Listings</span>
                <span className="px-2 py-0.5 rounded-full" style={{ background: "#FFF0F7", color: "#D4759A", fontSize: "0.68rem", fontWeight: 700 }}>
                  {listings.trades.length}
                </span>
              </div>
              {listings.trades.length === 0 ? (
                <div className="py-6 text-center" style={{ color: "#ccc", fontSize: "0.82rem" }}>No trade listings available</div>
              ) : (
                <div className="flex flex-col gap-2">
                  {listings.trades.map(l => (
                    <div key={l.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#fff", border: "1px solid #F0D8E8" }}>
                      <div className="rounded-lg overflow-hidden flex-shrink-0" style={{ width: 52, height: 72 }}>
                        <PhotocardImage
                          groupId={l.card.groupId}
                          memberId={l.card.memberId}
                          memberName={l.card.memberName}
                          imgSeed={l.card.imgSeed}
                          className="w-full h-full"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span style={{ fontWeight: 600, color: "#333", fontSize: "0.8rem" }}>@{l.seller}</span>
                          {l.verified && <CheckCircle2 size={12} color="#5CC0A8" fill="#5CC0A8" />}
                        </div>
                        <div style={{ fontSize: "0.68rem", color: "#999", marginTop: 1 }}>{l.country}</div>
                        <div style={{ fontSize: "0.68rem", color: "#D4759A", marginTop: 2 }}>Offering: {l.card.era}</div>
                      </div>
                      <button
                        onClick={() => navigate(`/card/${l.card.id}`)}
                        className="px-3 py-1.5 rounded-xl flex-shrink-0"
                        style={{ background: "#D4759A", color: "#fff", fontSize: "0.72rem", fontWeight: 700 }}
                      >
                        Trade
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sale listings */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "#EDFAF5" }}>
                  <ShoppingCart size={14} color="#5CC0A8" />
                </div>
                <span style={{ fontWeight: 700, color: "#2d2d2d", fontSize: "0.9rem" }}>Sale Listings</span>
                <span className="px-2 py-0.5 rounded-full" style={{ background: "#EDFAF5", color: "#5CC0A8", fontSize: "0.68rem", fontWeight: 700 }}>
                  {listings.sales.length}
                </span>
                <span style={{ fontSize: "0.65rem", color: "#bbb", marginLeft: "auto" }}>cheapest first</span>
              </div>
              {listings.sales.length === 0 ? (
                <div className="py-6 text-center" style={{ color: "#ccc", fontSize: "0.82rem" }}>No sale listings available</div>
              ) : (
                <div className="flex flex-col gap-2">
                  {listings.sales.map((l, idx) => (
                    <div key={l.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#fff", border: "1px solid #F0D8E8" }}>
                      {idx === 0 && (
                        <div className="absolute" style={{ display: "none" }} />
                      )}
                      <div className="rounded-lg overflow-hidden flex-shrink-0" style={{ width: 52, height: 72 }}>
                        <PhotocardImage
                          groupId={l.card.groupId}
                          memberId={l.card.memberId}
                          memberName={l.card.memberName}
                          imgSeed={l.card.imgSeed}
                          className="w-full h-full"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span style={{ fontWeight: 600, color: "#333", fontSize: "0.8rem" }}>@{l.seller}</span>
                          {l.verified && <CheckCircle2 size={12} color="#5CC0A8" fill="#5CC0A8" />}
                          {idx === 0 && (
                            <span className="px-1.5 py-0.5 rounded-full" style={{ background: "#fff8e1", color: "#F39C12", fontSize: "0.6rem", fontWeight: 700 }}>
                              BEST
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "0.68rem", color: "#999", marginTop: 1 }}>{l.country}</div>
                        <div style={{ fontWeight: 700, color: "#2d2d2d", fontSize: "0.9rem", marginTop: 2 }}>
                          ${l.price.toFixed(2)} <span style={{ color: "#bbb", fontSize: "0.65rem", fontWeight: 400 }}>USD</span>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/card/${l.card.id}`)}
                        className="px-3 py-1.5 rounded-xl flex-shrink-0"
                        style={{ background: "#5CC0A8", color: "#fff", fontSize: "0.72rem", fontWeight: 700 }}
                      >
                        Buy
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add to Wishlist modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#fff" }}>
          {/* Sticky header */}
          <div className="px-4 pt-5 pb-3" style={{ background: "var(--background)", flexShrink: 0 }}>
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: "#fff" }}
              >
                <ArrowLeft size={18} color="#333" />
              </button>
              <h2 style={{ color: "#2d2d2d" }}>Add to Likes</h2>
            </div>
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-3"
              style={{ background: "#fff", border: "1.5px solid #F0D8E8" }}
            >
              <Search size={16} color="#bbb" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by member, group, or era…"
                className="flex-1 outline-none bg-transparent"
                style={{ fontSize: "0.85rem", color: "#333" }}
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              <button
                onClick={() => setGroupFilter("all")}
                className="flex-shrink-0 px-3 py-1.5 rounded-full"
                style={{
                  background: groupFilter === "all" ? "#D4759A" : "#f0f0f0",
                  color: groupFilter === "all" ? "#fff" : "#666",
                  fontSize: "0.72rem", fontWeight: 600,
                }}
              >
                All
              </button>
              {GROUPS.map(g => (
                <button
                  key={g.id}
                  onClick={() => setGroupFilter(g.id)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full"
                  style={{
                    background: groupFilter === g.id ? g.color : "#f0f0f0",
                    color: groupFilter === g.id ? "#fff" : "#666",
                    fontSize: "0.72rem", fontWeight: 600,
                  }}
                >
                  {g.abbr}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable card grid */}
          <div className="flex-1 overflow-y-auto px-4 pt-3" style={{ paddingBottom: 100 }}>
            <div className="grid grid-cols-3 gap-2.5">
              {filteredBrowse.map(card => {
                const inWishlist = wishlistIds.includes(card.id);
                return (
                  <div
                    key={card.id}
                    className="rounded-xl overflow-hidden relative cursor-pointer"
                    style={{
                      background: "#fff",
                      border: inWishlist ? "2px solid #D4759A" : "1px solid #F0D8E8",
                    }}
                    onClick={() => toggleWishlistAdd(card.id)}
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
                        style={{ aspectRatio: "3/4.5" } as any}
                      />
                      {inWishlist && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#D4759A" }}>
                          <CheckCircle2 size={12} color="#fff" />
                        </div>
                      )}
                    </div>
                    <div className="p-1.5">
                      <div style={{ fontSize: "0.6rem", color: "#D4759A", fontWeight: 600 }}>{card.memberName}</div>
                      <div style={{ fontSize: "0.58rem", color: "#999" }} className="line-clamp-1">{card.era}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fixed Done button */}
          <div
            className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-4"
            style={{
              background: "linear-gradient(to top, #fff 70%, transparent)",
              pointerEvents: "none",
            }}
          >
            <button
              onClick={() => setShowAddModal(false)}
              className="w-full py-3.5 rounded-2xl"
              style={{
                background: "#D4759A",
                color: "#fff",
                fontWeight: 700,
                fontSize: "1rem",
                pointerEvents: "auto",
              }}
            >
              Done · {wishlistIds.length} card{wishlistIds.length !== 1 ? "s" : ""}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
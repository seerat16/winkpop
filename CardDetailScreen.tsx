import { useEffect, useState } from "react";
import { useNavigate, useParams } from "../router";
import {
  ArrowLeft, Heart, ShoppingCart, ArrowLeftRight, ShieldCheck,
  ChevronDown, ChevronUp, Flag, Star, MessageCircle, Calendar,
  Check, X, Send,
} from "lucide-react";
import { PHOTOCARDS, MY_COLLECTION_IDS } from "../data/mockData";
import { PhotocardImage } from "../components/PhotocardImage";
import {
  SEED_ACCOUNT,
  getCurrentUser,
  addToCart,
  removeFromCart,
  addToLikes,
  removeFromLikes,
} from "../data/userStore";
import { addTrade } from "../data/tradeStore";
import { recordListingView } from "../data/listingActivityStore";
import { ShareToAccount } from "../components/ShareToAccount";
import { MessageSellerButton } from "../components/MessageSellerButton";
import { toast } from "sonner";

type TradeStep = "idle" | "has-card" | "pick-card" | "confirm" | "done";

interface CardComment { id: string; user: string; text: string; time: string; }
function getCardCommentsKey(cardId: string) { return `barter_card_comments_${cardId}`; }
function loadCardComments(cardId: string): CardComment[] {
  try { return JSON.parse(localStorage.getItem(getCardCommentsKey(cardId)) || "[]"); } catch { return []; }
}
function saveCardComments(cardId: string, data: CardComment[]) {
  localStorage.setItem(getCardCommentsKey(cardId), JSON.stringify(data));
}
function getCardLikesKey(cardId: string) { return `barter_card_likes_${cardId}`; }
function loadCardLikes(cardId: string): { count: number; liked: boolean } {
  try { return JSON.parse(localStorage.getItem(getCardLikesKey(cardId)) || "null") ?? { count: 0, liked: false }; } catch { return { count: 0, liked: false }; }
}
function saveCardLikes(cardId: string, data: { count: number; liked: boolean }) {
  localStorage.setItem(getCardLikesKey(cardId), JSON.stringify(data));
}

const RECENT_TRANSACTIONS = [
  { country: "🇺🇸 United States", date: "2026-05-26", price: 6.30 },
  { country: "🇵🇱 Poland",        date: "2026-05-24", price: 6.30 },
  { country: "🇰🇷 South Korea",   date: "2026-05-22", price: 6.30 },
  { country: "🇮🇹 Italy",         date: "2026-05-20", price: 6.00 },
  { country: "🇫🇷 France",        date: "2026-05-18", price: 5.80 },
];

export default function CardDetailScreen() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const card = PHOTOCARDS.find(c => c.id === id);

  const user = getCurrentUser();
  const [wishlisted, setWishlisted] = useState(() => (getCurrentUser()?.likesIds || []).includes(id || ""));
  const [inCart, setInCart] = useState(() => user?.cartIds.includes(id || "") ?? false);
  const [showPriceHistory, setShowPriceHistory] = useState(false);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [selectedTradeCard, setSelectedTradeCard] = useState<string | null>(null);

  // Comments & likes (real, persisted)
  const [cardLikeData, setCardLikeData] = useState(() => loadCardLikes(id ?? ""));
  const [cardComments, setCardComments] = useState<CardComment[]>(() => loadCardComments(id ?? ""));
  const [showCardComments, setShowCardComments] = useState(false);
  const [cardCommentText, setCardCommentText] = useState("");

  useEffect(() => {
    if (card) {
      recordListingView(card.id, card.sellerId === "me" ? SEED_ACCOUNT.email : null);
    }
  }, [card]);

  const handleCardLike = () => {
    if (!id) return;
    const next = { count: cardLikeData.liked ? cardLikeData.count - 1 : cardLikeData.count + 1, liked: !cardLikeData.liked };
    setCardLikeData(next);
    saveCardLikes(id, next);
  };
  const handleCardComment = () => {
    if (!cardCommentText.trim() || !id) return;
    const user = getCurrentUser();
    const next: CardComment[] = [{ id: Date.now().toString(), user: user?.username || "me", text: cardCommentText.trim(), time: "just now" }, ...cardComments];
    setCardComments(next);
    saveCardComments(id, next);
    setCardCommentText("");
    toast.success("Comment posted!");
  };

  // Wishlist trade flow
  const [tradeStep, setTradeStep] = useState<TradeStep>("idle");
  const [tradeTargetCard, setTradeTargetCard] = useState<typeof PHOTOCARDS[0] | null>(null);
  const [tradeOfferCardId, setTradeOfferCardId] = useState<string | null>(null);

  const openTradeFlow = (wishlistCard: typeof PHOTOCARDS[0]) => {
    setTradeTargetCard(wishlistCard);
    setTradeOfferCardId(null);
    setTradeStep("has-card");
  };
  const resetTradeFlow = () => { setTradeStep("idle"); setTradeTargetCard(null); setTradeOfferCardId(null); };
  const confirmTrade = () => {
    if (!tradeTargetCard || !tradeOfferCardId || !card) return;
    addTrade({
      type: "outgoing",
      offeredCardId: tradeOfferCardId,
      requestedCardId: tradeTargetCard.id,
      status: "pending",  // pending status → goes to Outgoing tab
      fromUser: card.sellerUsername ?? "unknown",
    });
    setTradeStep("done");
  };

  // Cards from MY listed collection that the seller specifically wants to trade for
  const myListedCards = PHOTOCARDS.filter(c => c.sellerId === "me");
  const offerable = tradeTargetCard
    ? myListedCards.filter(c =>
        !tradeTargetCard.sellerWishlistIds?.length ||
        tradeTargetCard.sellerWishlistIds.includes(c.id)
      )
    : myListedCards;

  if (!card) {
    return (
      <div className="flex flex-col items-center justify-center h-screen" style={{ background: "var(--background)", color: "var(--muted-foreground)" }}>
        <p>Card not found</p>
        <button onClick={() => navigate(-1)} style={{ color: "var(--primary)", marginTop: 8 }}>Go back</button>
      </div>
    );
  }

  const isMyCard = card.sellerId === "me";
  const myCollection = PHOTOCARDS.filter(c => MY_COLLECTION_IDS.includes(c.id));
  const similarCards = PHOTOCARDS.filter(c => c.groupId === card.groupId && c.id !== card.id).slice(0, 4);
  const tradeWishlistCards = (card.sellerWishlistIds ?? [])
    .map(wid => PHOTOCARDS.find(c => c.id === wid))
    .filter(Boolean) as typeof PHOTOCARDS;

  const conditionLabel =
    card.condition === "mint" ? "Mint" :
    card.condition === "near mint" ? "Near Mint" :
    card.condition === "good" ? "Good" : "Like New";

  const conditionColor =
    card.condition === "mint" ? "#3A9080" :
    card.condition === "near mint" ? "#2980B9" : "#E67E22";

  const handleBuy = () => {
    if (inCart) { removeFromCart(card.id); setInCart(false); toast(`Removed from cart`); }
    else { addToCart(card.id); setInCart(true); toast.success(`Added to cart!`, { description: `${card.memberName} · ${card.era}` }); }
  };

  const handleWishlist = () => {
    if (wishlisted) { removeFromLikes(card.id); setWishlisted(false); toast("Removed from likes"); }
    else { addToLikes(card.id); setWishlisted(true); toast.success("Added to likes! 💕"); }
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--background)" }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3 sticky top-0 z-10" style={{ background: "var(--background)" }}>
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <ArrowLeft size={18} color="var(--foreground)" />
        </button>
        <div className="flex gap-2">
          <ShareToAccount
            itemType="listing"
            itemTitle={`${card.groupName} ${card.memberName} · ${card.era}`}
            itemPath={`/card/${card.id}`}
            className="!size-9 !bg-card !text-foreground !border-border"
          />
          <button onClick={() => navigate("/cart")} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <ShoppingCart size={18} color="var(--foreground)" />
          </button>
          <button onClick={handleWishlist} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: wishlisted ? "var(--secondary)" : "var(--card)", border: "1px solid var(--border)" }}>
            <Heart size={18} color={wishlisted ? "var(--primary)" : "var(--foreground)"} fill={wishlisted ? "var(--primary)" : "none"} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-28">

        {/* ── Card photo ── */}
        <div className="relative -mx-0 mb-4" style={{ background: "var(--muted)" }}>
          <PhotocardImage
            groupId={card.groupId}
            memberId={card.memberId}
            memberName={card.memberName}
            imgSeed={card.imgSeed}
            databaseImageFilename={card.databaseImageFilename}
            uploadImageFilename={card.uploadImageFilename}
            imageMode="upload"
            className="w-full"
            style={{ aspectRatio: "3/4", borderRadius: 0 } as any}
          />
          {card.damaged && (
            <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: "#F4A07C" }}>
              <span style={{ color: "#fff", fontSize: "0.65rem", fontWeight: 700 }}>⚠ DAMAGED</span>
            </div>
          )}
          <button
            onClick={handleWishlist}
            className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.9)" }}
          >
            <Heart size={18} color={wishlisted ? "var(--primary)" : "#aaa"} fill={wishlisted ? "var(--primary)" : "none"} />
          </button>
        </div>

        <div className="px-4">

          {/* ── Listing type + condition badges ── */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="px-3 py-1 rounded-full" style={{ background: "var(--secondary)", color: "var(--primary)", fontSize: "0.72rem", fontWeight: 700, border: "1px solid var(--border)" }}>
              For Trade
            </span>
            <span className="px-3 py-1 rounded-full" style={{ background: "var(--card)", color: conditionColor, fontSize: "0.72rem", fontWeight: 700, border: "1px solid var(--border)" }}>
              {conditionLabel}
            </span>
            {card.damaged && (
              <span className="px-3 py-1 rounded-full" style={{ background: "#FFF5EE", color: "#F4A07C", fontSize: "0.72rem", fontWeight: 600 }}>⚠ Damaged</span>
            )}
          </div>

          {/* ── Title ── */}
          <div className="mb-1">
            <h2 style={{ color: "var(--foreground)", marginBottom: 2 }}>
              {card.groupName} {card.memberName} · {card.era}
            </h2>
            <div className="flex items-baseline gap-2 mt-1">
              <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--foreground)" }}>${card.price.toFixed(2)}</span>
              <span style={{ fontSize: "0.82rem", color: "var(--muted-foreground)" }}>USD</span>
            </div>
            {card.listedDate && (
              <div className="flex items-center gap-1 mt-1" style={{ color: "var(--muted-foreground)" }}>
                <Calendar size={11} />
                <span style={{ fontSize: "0.7rem" }}>Listed {card.listedDate}</span>
              </div>
            )}
          </div>

          {/* ── Photocard Type ── */}
          <div className="mb-4 mt-4">
            <div style={{ fontWeight: 700, color: "var(--foreground)", fontSize: "0.9rem", marginBottom: 8 }}>Photocard Type</div>
            <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="rounded-xl overflow-hidden flex-shrink-0" style={{ width: 52, border: "1px solid var(--border)" }}>
                <PhotocardImage
                  groupId={card.groupId}
                  memberId={card.memberId}
                  memberName={card.memberName}
                  imgSeed={card.imgSeed}
                  databaseImageFilename={card.databaseImageFilename}
                  uploadImageFilename={card.uploadImageFilename}
                  imageMode="database"
                  className="w-full"
                  style={{ aspectRatio: "3/4.5" } as any}
                />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "var(--foreground)", fontSize: "0.88rem" }}>{card.type}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--primary)", fontWeight: 600, marginTop: 1 }}>{card.groupName}</div>
                <div style={{ fontSize: "0.72rem", color: "var(--muted-foreground)" }}>{card.memberName} · {card.era}</div>
              </div>
            </div>
          </div>

          {/* ── Willing to Trade For ── */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2" style={{ fontWeight: 700, color: "var(--foreground)", fontSize: "0.9rem" }}>
              <ArrowLeftRight size={15} color="var(--primary)" />
              Willing to Trade For
            </div>
            {tradeWishlistCards.length > 0 ? (
              <>
                <div className="flex items-center gap-1.5 mb-2">
                  <Heart size={13} color="var(--primary)" fill="var(--primary)" />
                  <span style={{ fontSize: "0.75rem", color: "var(--primary)", fontWeight: 600 }}>Seller's specific likes</span>
                </div>
                <div className="flex gap-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                  {tradeWishlistCards.map(wc => (
                    <button
                      key={wc.id}
                      onClick={() => openTradeFlow(wc)}
                      className="flex-shrink-0 rounded-xl overflow-hidden text-left"
                      style={{ width: 80, background: "var(--card)", border: "1px solid var(--border)" }}
                    >
                      <PhotocardImage
                        groupId={wc.groupId} memberId={wc.memberId} memberName={wc.memberName}
                        imgSeed={wc.imgSeed} databaseImageFilename={wc.databaseImageFilename}
                        uploadImageFilename={wc.uploadImageFilename} imageMode="database"
                        className="w-full" style={{ aspectRatio: "3/4.5" } as any}
                      />
                      <div className="p-1.5">
                        <div style={{ fontSize: "0.62rem", color: "var(--primary)", fontWeight: 600 }} className="line-clamp-1">{wc.memberName}</div>
                        <div style={{ fontSize: "0.6rem", color: "var(--muted-foreground)" }} className="line-clamp-1">{wc.era}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5 mb-2">
                  <Heart size={13} color="var(--primary)" fill="var(--primary)" />
                  <span style={{ fontSize: "0.75rem", color: "var(--primary)", fontWeight: 600 }}>From seller's likes — auto-updates</span>
                </div>
                <div className="p-3 rounded-2xl flex items-center gap-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <Heart size={18} color="var(--primary)" fill="var(--primary)" />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--foreground)" }}>My entire likes</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--muted-foreground)" }}>No liked cards yet</div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── Condition ── */}
          <div className="mb-4">
            <div style={{ fontWeight: 700, color: "var(--foreground)", fontSize: "0.9rem", marginBottom: 8 }}>Condition</div>
            <div className="p-3 rounded-2xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} color={conditionColor} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--foreground)" }}>{conditionLabel}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--muted-foreground)" }}>
                    {card.condition === "mint" ? "No scratches or marks." :
                     card.condition === "near mint" ? "Very minor handling, barely visible." :
                     "May have minor scratches or marks."}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Seller notes ── */}
          {card.listingNote && (
            <div className="p-3 rounded-2xl mb-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--muted-foreground)", marginBottom: 4, letterSpacing: "0.05em" }}>SELLER NOTES</div>
              <p style={{ fontSize: "0.83rem", color: "var(--foreground)", lineHeight: 1.5 }}>{card.listingNote}</p>
            </div>
          )}

          {/* ── Seller ── */}
          <div
            className="flex items-center gap-3 p-3 rounded-2xl mb-3"
            style={{ background: "var(--card)", border: "1px solid var(--border)", cursor: isMyCard ? "pointer" : "default" }}
            onClick={isMyCard ? () => navigate("/profile") : undefined}
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: card.sellerAvatarColor ?? "var(--accent)", color: "#fff", fontWeight: 700, fontSize: "1rem" }}
            >
              {card.sellerUsername?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--foreground)" }}>
                  {isMyCard ? "@owner" : `@${card.sellerUsername}`}
                </span>
                {isMyCard && <span style={{ fontSize: "0.65rem", color: "var(--primary)", fontWeight: 600, background: "var(--secondary)", padding: "1px 6px", borderRadius: 99 }}>You</span>}
                {card.sellerVerified && <ShieldCheck size={13} color="#5CC0A8" />}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span style={{ fontSize: "0.72rem", color: "var(--muted-foreground)" }}>{card.sellerCountry}</span>
                {card.sellerRating && (
                  <span className="flex items-center gap-0.5" style={{ fontSize: "0.72rem", color: "#F39C12" }}>
                    <Star size={10} fill="#F39C12" /> {card.sellerRating.toFixed(1)}
                  </span>
                )}
                {card.sellerTradeCount && (
                  <span style={{ fontSize: "0.72rem", color: "var(--muted-foreground)" }}>{card.sellerTradeCount} trades</span>
                )}
              </div>
            </div>
            {isMyCard ? (
              <span style={{ fontSize: "0.72rem", color: "var(--muted-foreground)", fontWeight: 500 }}>Tap to view →</span>
            ) : (
              <MessageSellerButton
                sellerUsername={card.sellerUsername || "seller"}
                listingTitle={`${card.groupName} ${card.memberName} · ${card.era}`}
                listingPath={`/card/${card.id}`}
                category="sale"
                className="!bg-secondary !text-primary !border-transparent"
              />
            )}
          </div>

          {/* ── Price history ── */}
          <div className="rounded-2xl overflow-hidden mb-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <button onClick={() => setShowPriceHistory(!showPriceHistory)} className="flex items-center justify-between w-full p-4">
              <span style={{ fontWeight: 600, color: "var(--foreground)", fontSize: "0.9rem" }}>Recent Transactions</span>
              {showPriceHistory ? <ChevronUp size={16} color="var(--muted-foreground)" /> : <ChevronDown size={16} color="var(--muted-foreground)" />}
            </button>
            {showPriceHistory && (
              <div className="px-4 pb-4">
                <div className="flex items-end gap-1 h-16 mb-3">
                  {[5.8, 5.9, 6.0, 6.3, 6.3, 6.3, 6.3].map((p, i) => (
                    <div key={i} className="flex-1 rounded-t" style={{ height: `${((p - 5.5) / 1.5) * 100}%`, background: i === 6 ? "var(--primary)" : "var(--secondary)" }} />
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  {RECENT_TRANSACTIONS.map((t, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div>
                        <div style={{ fontSize: "0.72rem", color: "var(--muted-foreground)" }}>{t.date}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--foreground)" }}>{t.country}</div>
                      </div>
                      <span style={{ fontWeight: 600, color: "var(--foreground)", fontSize: "0.85rem" }}>${t.price.toFixed(2)} USD</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Similar listings ── */}
          {similarCards.length > 0 && (
            <div className="mb-4">
              <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--foreground)", marginBottom: 10 }}>More from this group</div>
              <div className="flex gap-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                {similarCards.map(c => (
                  <button
                    key={c.id}
                    onClick={() => navigate(`/card/${c.id}`)}
                    className="flex-shrink-0 rounded-xl overflow-hidden text-left"
                    style={{ background: "var(--card)", border: "1px solid var(--border)", width: 110 }}
                  >
                    <PhotocardImage
                      groupId={c.groupId} memberId={c.memberId} memberName={c.memberName} imgSeed={c.imgSeed}
                      databaseImageFilename={c.databaseImageFilename} uploadImageFilename={c.uploadImageFilename}
                      imageMode="upload" className="w-full" style={{ aspectRatio: "3/4.5" } as any}
                    />
                    <div className="p-1.5">
                      <div style={{ fontSize: "0.65rem", color: "var(--primary)", fontWeight: 600 }}>{c.memberName}</div>
                      <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--foreground)" }}>${c.price.toFixed(2)}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Comments & Likes ── */}
          <div className="mb-4">
            <div className="flex items-center gap-4 mb-3">
              <button onClick={handleCardLike} className="flex items-center gap-1.5" style={{ color: cardLikeData.liked ? "var(--primary)" : "var(--muted-foreground)" }}>
                <Heart size={20} fill={cardLikeData.liked ? "var(--primary)" : "none"} color={cardLikeData.liked ? "var(--primary)" : "var(--muted-foreground)"} />
                <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{cardLikeData.count}</span>
              </button>
              <button onClick={() => setShowCardComments(s => !s)} className="flex items-center gap-1.5" style={{ color: "var(--muted-foreground)" }}>
                <MessageCircle size={20} color="var(--muted-foreground)" />
                <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{cardComments.length}</span>
              </button>
            </div>
            {showCardComments && (
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <input
                    value={cardCommentText}
                    onChange={e => setCardCommentText(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleCardComment()}
                    placeholder="Add a comment…"
                    className="flex-1 px-3 py-2 rounded-xl outline-none"
                    style={{ border: "1.5px solid var(--border)", background: "var(--card)", fontSize: "0.82rem", color: "var(--foreground)" }}
                  />
                  <button onClick={handleCardComment} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--primary)" }}>
                    <Send size={14} color="#fff" />
                  </button>
                </div>
                {cardComments.length === 0 ? (
                  <p style={{ fontSize: "0.8rem", color: "var(--muted-foreground)", textAlign: "center", padding: "12px 0" }}>No comments yet. Be the first!</p>
                ) : cardComments.map(c => (
                  <div key={c.id} className="flex gap-2">
                    <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: "var(--secondary)", fontSize: "0.6rem", color: "var(--primary)", fontWeight: 700 }}>
                      {c.user[0].toUpperCase()}
                    </div>
                    <div className="flex-1 px-3 py-2 rounded-xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--primary)" }}>@{c.user}</span>
                        <span style={{ fontSize: "0.65rem", color: "var(--muted-foreground)" }}>{c.time}</span>
                      </div>
                      <div style={{ fontSize: "0.82rem", color: "var(--foreground)" }}>{c.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button className="flex items-center gap-2 mb-4" style={{ color: "var(--muted-foreground)", fontSize: "0.8rem" }}>
            <Flag size={13} /> Report this listing
          </button>
        </div>
      </div>

      {/* ── Bottom CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-4 pt-3 max-w-md mx-auto" style={{ background: `linear-gradient(transparent, var(--background) 30%)` }}>
        <div className="flex gap-3">
          <button
            onClick={handleWishlist}
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: "var(--card)", border: "1.5px solid var(--border)" }}
          >
            <Heart size={20} color={wishlisted ? "var(--primary)" : "var(--muted-foreground)"} fill={wishlisted ? "var(--primary)" : "none"} />
          </button>
          <button
            onClick={() => setShowTradeModal(true)}
            className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2"
            style={{ background: "var(--card)", border: "1.5px solid var(--primary)", color: "var(--primary)", fontWeight: 700, fontSize: "0.9rem" }}
          >
            <ArrowLeftRight size={16} /> Trade
          </button>
          <button
            onClick={handleBuy}
            className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2"
            style={{ background: inCart ? "#5CC0A8" : "var(--primary)", color: "#fff", fontWeight: 700, fontSize: "0.9rem" }}
          >
            <ShoppingCart size={16} />
            {inCart ? "In Cart" : "Add to Cart"}
          </button>
        </div>
      </div>

      {/* ── Trade modal (bottom sheet for Add to Cart / Trade buttons) ── */}
      {showTradeModal && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="rounded-t-3xl p-5 max-w-md w-full mx-auto" style={{ background: "var(--card)", maxHeight: "90vh", overflowY: "auto", paddingBottom: "80px" }}>
            <h3 style={{ color: "var(--foreground)", marginBottom: 4 }}>Request a Trade</h3>
            <p style={{ fontSize: "0.82rem", color: "var(--muted-foreground)", marginBottom: 16 }}>Select a card from your collection to offer</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {myCollection.map(c => (
                <button key={c.id} onClick={() => setSelectedTradeCard(c.id)} className="rounded-xl overflow-hidden" style={{ border: `2px solid ${selectedTradeCard === c.id ? "var(--primary)" : "var(--border)"}` }}>
                  <PhotocardImage
                    groupId={c.groupId} memberId={c.memberId} memberName={c.memberName} imgSeed={c.imgSeed}
                    databaseImageFilename={c.databaseImageFilename} uploadImageFilename={c.uploadImageFilename}
                    imageMode="upload" className="w-full" style={{ aspectRatio: "3/4.5" } as any}
                  />
                  <div className="p-1" style={{ fontSize: "0.65rem", color: "var(--foreground)", textAlign: "center" }}>{c.memberName}</div>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowTradeModal(false)} className="flex-1 py-3 rounded-xl" style={{ border: "1.5px solid var(--border)", color: "var(--muted-foreground)", fontWeight: 600 }}>Cancel</button>
              <button
                onClick={() => {
                  if (!selectedTradeCard) { toast.error("Please select a card to offer"); return; }
                  setShowTradeModal(false);
                  toast.success("Trade request sent! 🎴");
                }}
                className="flex-1 py-3 rounded-xl"
                style={{ background: selectedTradeCard ? "var(--primary)" : "var(--muted)", color: selectedTradeCard ? "#fff" : "var(--muted-foreground)", fontWeight: 700 }}
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Wishlist trade flow modal ── */}
      {tradeStep !== "idle" && tradeTargetCard && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.5)" }} onClick={resetTradeFlow}>
          <div
            className="rounded-t-3xl max-w-md w-full mx-auto"
            style={{ background: "var(--card)", maxHeight: "90vh", overflowY: "auto", paddingBottom: "80px" }}
            onClick={e => e.stopPropagation()}
          >
            {/* drag handle */}
            <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-4" style={{ background: "var(--muted)" }} />

            {/* ── Step 1: Do you have this card? ── */}
            {tradeStep === "has-card" && (
              <div className="px-5 pb-8">
                <div className="flex justify-center mb-4">
                  <div className="rounded-2xl overflow-hidden" style={{ width: 120, border: "1px solid var(--border)" }}>
                    <PhotocardImage
                      groupId={tradeTargetCard.groupId} memberId={tradeTargetCard.memberId}
                      memberName={tradeTargetCard.memberName} imgSeed={tradeTargetCard.imgSeed}
                      databaseImageFilename={tradeTargetCard.databaseImageFilename}
                      uploadImageFilename={tradeTargetCard.uploadImageFilename}
                      imageMode="database" className="w-full" style={{ aspectRatio: "3/4.5" } as any}
                    />
                  </div>
                </div>
                <p style={{ fontWeight: 700, fontSize: "1rem", color: "var(--foreground)", textAlign: "center", marginBottom: 4 }}>
                  Do you have this card?
                </p>
                <p style={{ fontSize: "0.8rem", color: "var(--muted-foreground)", textAlign: "center", marginBottom: 20 }}>
                  {tradeTargetCard.groupName} {tradeTargetCard.memberName} · {tradeTargetCard.era}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={resetTradeFlow}
                    className="flex-1 py-3 rounded-2xl flex items-center justify-center gap-2"
                    style={{ border: "1.5px solid var(--border)", color: "var(--muted-foreground)", fontWeight: 600 }}
                  >
                    <X size={16} /> No
                  </button>
                  <button
                    onClick={() => setTradeStep("pick-card")}
                    className="flex-1 py-3 rounded-2xl flex items-center justify-center gap-2"
                    style={{ background: "var(--primary)", color: "#fff", fontWeight: 700 }}
                  >
                    <Check size={16} /> Yes
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 2: Pick a card from your collection ── */}
            {tradeStep === "pick-card" && (
              <div className="px-5 pb-8">
                <p style={{ fontWeight: 700, fontSize: "1rem", color: "var(--foreground)", marginBottom: 4 }}>Select a card to offer</p>
                <p style={{ fontSize: "0.8rem", color: "var(--muted-foreground)", marginBottom: 16 }}>
                  {tradeTargetCard?.sellerWishlistIds?.length
                    ? "Showing your listed cards that match what this seller wants"
                    : "Choose from your posted collection"}
                </p>
                {offerable.length === 0 ? (
                  <div className="py-10 text-center" style={{ color: "var(--muted-foreground)", fontSize: "0.85rem" }}>
                    None of your listed cards match what this seller wants to trade for.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    {offerable.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setTradeOfferCardId(c.id)}
                        className="rounded-xl overflow-hidden"
                        style={{ border: `2.5px solid ${tradeOfferCardId === c.id ? "var(--primary)" : "var(--border)"}`, background: "var(--background)" }}
                      >
                        <PhotocardImage
                          groupId={c.groupId} memberId={c.memberId} memberName={c.memberName}
                          imgSeed={c.imgSeed} databaseImageFilename={c.databaseImageFilename}
                          uploadImageFilename={c.uploadImageFilename} imageMode="upload"
                          className="w-full" style={{ aspectRatio: "3/4.5" } as any}
                        />
                        <div className="p-1.5">
                          <div style={{ fontSize: "0.62rem", color: "var(--primary)", fontWeight: 600 }} className="line-clamp-1">{c.memberName}</div>
                          <div style={{ fontSize: "0.58rem", color: "var(--muted-foreground)" }} className="line-clamp-1">{c.era}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={resetTradeFlow}
                    className="flex-1 py-3 rounded-2xl flex items-center justify-center gap-2"
                    style={{ border: "1.5px solid var(--border)", color: "var(--muted-foreground)", fontWeight: 600 }}
                  >
                    <X size={16} /> No
                  </button>
                  <button
                    onClick={() => { if (tradeOfferCardId) setTradeStep("confirm"); else toast.error("Select a card first"); }}
                    className="flex-1 py-3 rounded-2xl flex items-center justify-center gap-2"
                    style={{ background: tradeOfferCardId ? "var(--primary)" : "var(--muted)", color: tradeOfferCardId ? "#fff" : "var(--muted-foreground)", fontWeight: 700 }}
                  >
                    <Check size={16} /> Yes
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 3: Confirm the trade ── */}
            {tradeStep === "confirm" && (() => {
              const offerCard = PHOTOCARDS.find(c => c.id === tradeOfferCardId);
              return (
                <div className="px-5 pb-8">
                  <p style={{ fontWeight: 700, fontSize: "1rem", color: "var(--foreground)", textAlign: "center", marginBottom: 16 }}>
                    Would you like to trade this card?
                  </p>
                  <div className="flex items-center justify-center gap-4 mb-6">
                    {offerCard && (
                      <div className="flex flex-col items-center gap-1">
                        <div className="rounded-xl overflow-hidden" style={{ width: 90, border: "1px solid var(--border)" }}>
                          <PhotocardImage
                            groupId={offerCard.groupId} memberId={offerCard.memberId} memberName={offerCard.memberName}
                            imgSeed={offerCard.imgSeed} databaseImageFilename={offerCard.databaseImageFilename}
                            uploadImageFilename={offerCard.uploadImageFilename} imageMode="upload"
                            className="w-full" style={{ aspectRatio: "3/4.5" } as any}
                          />
                        </div>
                        <span style={{ fontSize: "0.65rem", color: "var(--muted-foreground)", fontWeight: 600 }}>Your card</span>
                        <span style={{ fontSize: "0.7rem", color: "var(--primary)", fontWeight: 700 }}>{offerCard.memberName}</span>
                      </div>
                    )}
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--secondary)" }}>
                        <ArrowLeftRight size={14} color="var(--primary)" />
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="rounded-xl overflow-hidden" style={{ width: 90, border: "1px solid var(--border)" }}>
                        <PhotocardImage
                          groupId={card.groupId} memberId={card.memberId} memberName={card.memberName}
                          imgSeed={card.imgSeed} databaseImageFilename={card.databaseImageFilename}
                          uploadImageFilename={card.uploadImageFilename} imageMode="upload"
                          className="w-full" style={{ aspectRatio: "3/4.5" } as any}
                        />
                      </div>
                      <span style={{ fontSize: "0.65rem", color: "var(--muted-foreground)", fontWeight: 600 }}>Their card</span>
                      <span style={{ fontSize: "0.7rem", color: "var(--primary)", fontWeight: 700 }}>{card.memberName}</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={resetTradeFlow}
                      className="flex-1 py-3 rounded-2xl flex items-center justify-center gap-2"
                      style={{ border: "1.5px solid var(--border)", color: "var(--muted-foreground)", fontWeight: 600 }}
                    >
                      <X size={16} /> No
                    </button>
                    <button
                      onClick={confirmTrade}
                      className="flex-1 py-3 rounded-2xl flex items-center justify-center gap-2"
                      style={{ background: "var(--primary)", color: "#fff", fontWeight: 700 }}
                    >
                      <Check size={16} /> Yes, Trade
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* ── Step 4: Confirmed ── */}
            {tradeStep === "done" && (
              <div className="px-5 pb-10 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: "var(--secondary)" }}>
                  <Check size={32} color="var(--primary)" strokeWidth={2.5} />
                </div>
                <p style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--foreground)", marginBottom: 6, textAlign: "center" }}>
                  Trade Confirmed! 🎴
                </p>
                <p style={{ fontSize: "0.82rem", color: "var(--muted-foreground)", textAlign: "center", marginBottom: 24 }}>
                  Your trade request has been sent to @{card?.sellerUsername}. You can track it in the Trading section.
                </p>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={resetTradeFlow}
                    className="flex-1 py-3 rounded-2xl"
                    style={{ border: "1.5px solid var(--border)", color: "var(--muted-foreground)", fontWeight: 600 }}
                  >
                    Close
                  </button>
                  <button
                    onClick={() => { resetTradeFlow(); navigate("/transactions"); }}
                    className="flex-1 py-3 rounded-2xl"
                    style={{ background: "var(--primary)", color: "#fff", fontWeight: 700 }}
                  >
                    View Trades
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

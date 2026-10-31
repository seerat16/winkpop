import { useEffect, useState } from "react";
import { useNavigate, useParams } from "../router";
import { ArrowLeft, Edit2, Heart, ShoppingCart, ArrowLeftRight, ShieldCheck, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { PHOTOCARDS } from "../data/mockData";
import { PhotocardImage } from "../components/PhotocardImage";
import { getCurrentUser } from "../data/userStore";
import { recordListingView } from "../data/listingActivityStore";
import { ShareToAccount } from "../components/ShareToAccount";

const PRIMARY = "#D4759A";
const MINT = "#5CC0A8";

function getLikesKey(listingId: string) { return `barter_listing_likes_${listingId}`; }
function getCommentsKey(listingId: string) { return `barter_listing_comments_${listingId}`; }

function loadLikes(listingId: string): { count: number; liked: boolean } {
  try { return JSON.parse(localStorage.getItem(getLikesKey(listingId)) || "null") ?? { count: 0, liked: false }; }
  catch { return { count: 0, liked: false }; }
}
function saveLikes(listingId: string, data: { count: number; liked: boolean }) {
  localStorage.setItem(getLikesKey(listingId), JSON.stringify(data));
}

interface Comment { id: string; user: string; text: string; time: string; }
function loadComments(listingId: string): Comment[] {
  try { return JSON.parse(localStorage.getItem(getCommentsKey(listingId)) || "[]"); }
  catch { return []; }
}
function saveComments(listingId: string, data: Comment[]) {
  localStorage.setItem(getCommentsKey(listingId), JSON.stringify(data));
}

export default function ListingDetailScreen() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [listing, setListing] = useState<any | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    const listings = (() => { try { return JSON.parse(localStorage.getItem("barter_my_listings") || "[]"); } catch { return []; } })();
    const found = listings.find((l: any) => l.id === id);
    setListing(found ?? null);
    if (id && found?.ownerEmail) {
      recordListingView(id, found.ownerEmail);
    }
    if (id) {
      const lk = loadLikes(id);
      setLiked(lk.liked);
      setLikeCount(lk.count);
      setComments(loadComments(id));
    }
  }, [id]);

  const handleLike = () => {
    const next = { count: liked ? likeCount - 1 : likeCount + 1, liked: !liked };
    setLiked(next.liked);
    setLikeCount(next.count);
    if (id) saveLikes(id, next);
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    const newComment: Comment = { id: Date.now().toString(), user: "me", text: commentText.trim(), time: "just now" };
    const next = [newComment, ...comments];
    setComments(next);
    if (id) saveComments(id, next);
    setCommentText("");
    toast.success("Comment posted!");
  };

  if (!listing) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center" style={{ background: "var(--background)" }}>
        <div style={{ color: "#ccc", fontSize: "0.9rem" }}>Listing not found</div>
        <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 rounded-full" style={{ background: PRIMARY, color: "#fff", fontSize: "0.85rem" }}>Go Back</button>
      </div>
    );
  }

  const typeRefCard = listing.typeReferenceCardId ? PHOTOCARDS.find(c => c.id === listing.typeReferenceCardId) : null;
  const user = getCurrentUser();
  const wishlistCardIds = listing.tradeMode === "wishlist" ? (user?.likesIds || []) : (listing.tradeCardIds || []);
  const tradeCards = wishlistCardIds.map((cid: string) => PHOTOCARDS.find(c => c.id === cid)).filter(Boolean);

  const conditionLabel = listing.condition === "like-new" ? "Like New" : "Used";
  const listingTypeLabel = listing.listingType === "for-sale" ? "For Sale" : listing.listingType === "for-trade" ? "For Trade" : "For Sale & Trade";
  const listingTypeColor = listing.listingType === "for-sale" ? MINT : listing.listingType === "for-trade" ? PRIMARY : "#9B82D4";

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3 sticky top-0 z-10" style={{ background: "var(--background)" }}>
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#fff", border: "1px solid #F0D8E8" }}>
          <ArrowLeft size={18} color="#333" />
        </button>
        <span style={{ fontWeight: 700, color: "#2d2d2d", fontSize: "0.95rem" }}>My Listing</span>
        <div className="flex items-center gap-md">
          <ShareToAccount
            itemType="listing"
            itemTitle={listing.title || "Listing"}
            itemPath={`/listing/${id}`}
          />
          <button onClick={() => navigate(`/list-card?edit=${id}`)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#fff", border: "1px solid #F0D8E8" }}>
            <Edit2 size={15} color="#888" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-8">
        {/* Card photo */}
        <div className="mx-4 rounded-2xl overflow-hidden mb-4" style={{ border: "1px solid #F0D8E8" }}>
          {listing.photoUri ? (
            <img src={listing.photoUri} alt="card" className="w-full" style={{ maxHeight: 260, objectFit: "cover" }} />
          ) : (
            <div className="w-full flex items-center justify-center" style={{ minHeight: 200, background: "linear-gradient(135deg, #FFB8D0, #C9A8E0)", fontSize: "4rem" }}>🎴</div>
          )}
        </div>

        {/* Title + badges */}
        <div className="px-4 mb-4">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className="px-2.5 py-0.5 rounded-full"
              style={{ background: `${listingTypeColor}18`, color: listingTypeColor, fontSize: "0.7rem", fontWeight: 700, border: `1px solid ${listingTypeColor}40` }}
            >
              {listingTypeLabel}
            </span>
            <span
              className="px-2.5 py-0.5 rounded-full"
              style={{ background: "#f5f5f5", color: "#888", fontSize: "0.7rem", fontWeight: 600 }}
            >
              {conditionLabel}
            </span>
          </div>
          <h2 style={{ color: "#2d2d2d", marginBottom: 4 }}>{listing.title}</h2>
          {listing.price && (listingTypeLabel === "For Sale" || listingTypeLabel === "For Sale & Trade") && (
            <div style={{ fontWeight: 700, color: "#2d2d2d", fontSize: "1.3rem" }}>
              ${parseFloat(listing.price).toFixed(2)} <span style={{ color: "#bbb", fontWeight: 400, fontSize: "0.8rem" }}>USD</span>
            </div>
          )}
          <div style={{ fontSize: "0.72rem", color: "#bbb", marginTop: 4 }}>
            Listed {new Date(listing.listedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </div>
        </div>

        {/* Description */}
        {listing.description && (
          <div className="px-4 mb-4">
            <div style={{ fontWeight: 700, color: "#2d2d2d", fontSize: "0.85rem", marginBottom: 6 }}>Description</div>
            <div style={{ fontSize: "0.85rem", color: "#555", lineHeight: 1.6 }}>{listing.description}</div>
          </div>
        )}

        {/* Photocard type / reference card */}
        {(listing.cardType || typeRefCard) && (
          <div className="px-4 mb-4">
            <div style={{ fontWeight: 700, color: "#2d2d2d", fontSize: "0.85rem", marginBottom: 8 }}>Photocard Type</div>
            <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: "#fff", border: "1px solid #F0D8E8" }}>
              {typeRefCard && (
                <div className="rounded-xl overflow-hidden flex-shrink-0" style={{ width: 52 }}>
                  <PhotocardImage groupId={typeRefCard.groupId} memberId={typeRefCard.memberId} memberName={typeRefCard.memberName} imgSeed={typeRefCard.imgSeed} className="w-full" style={{ aspectRatio: "3/4.5" } as any} />
                </div>
              )}
              <div>
                <div style={{ fontWeight: 600, color: "#2d2d2d", fontSize: "0.88rem" }}>{listing.cardType}</div>
                {typeRefCard && (
                  <>
                    <div style={{ fontSize: "0.72rem", color: PRIMARY, fontWeight: 600 }}>{typeRefCard.groupName}</div>
                    <div style={{ fontSize: "0.72rem", color: "#888" }}>{typeRefCard.memberName} · {typeRefCard.era}</div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Trade cards */}
        {(listing.listingType === "for-trade" || listing.listingType === "both") && (
          <div className="px-4 mb-4">
            <div style={{ fontWeight: 700, color: "#2d2d2d", fontSize: "0.85rem", marginBottom: 8 }}>
              <div className="flex items-center gap-2">
                <ArrowLeftRight size={15} color={PRIMARY} />
                Willing to Trade For
              </div>
            </div>
            {listing.tradeMode === "wishlist" && (
              <div className="flex items-center gap-2 mb-2">
                <Heart size={14} color={PRIMARY} fill={PRIMARY} />
                <span style={{ fontSize: "0.75rem", color: PRIMARY, fontWeight: 600 }}>From seller's likes — auto-updates</span>
              </div>
            )}
            {tradeCards.length > 0 ? (
              <div>
                <div style={{ fontSize: "0.75rem", color: "#999", marginBottom: 8 }}>
                  {listing.tradeMode === "wishlist" ? `${tradeCards.length} card${tradeCards.length !== 1 ? "s" : ""}:` : `Accepting ${tradeCards.length} specific card${tradeCards.length !== 1 ? "s" : ""}:`}
                </div>
                <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                  {tradeCards.map((card: any) => (
                    <div key={card.id} className="flex-shrink-0 text-center" style={{ width: 60 }}>
                      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #F0D8E8" }}>
                        <PhotocardImage groupId={card.groupId} memberId={card.memberId} memberName={card.memberName} imgSeed={card.imgSeed} databaseImageFilename={card.databaseImageFilename} uploadImageFilename={card.uploadImageFilename} className="w-full" style={{ aspectRatio: "3/4.5" } as any} />
                      </div>
                      <div style={{ fontSize: "0.58rem", color: PRIMARY, fontWeight: 600, marginTop: 2 }} className="line-clamp-1">{card.memberName}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-2xl flex items-center gap-3" style={{ background: "#fff", border: "1px solid #F0D8E8" }}>
                <Heart size={18} color={PRIMARY} fill={PRIMARY} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#2d2d2d" }}>My entire likes</div>
                  <div style={{ fontSize: "0.72rem", color: "#bbb" }}>No liked cards yet</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Condition */}
        <div className="px-4 mb-4">
          <div style={{ fontWeight: 700, color: "#2d2d2d", fontSize: "0.85rem", marginBottom: 8 }}>Condition</div>
          <div className="p-3 rounded-2xl" style={{ background: "#fff", border: "1px solid #F0D8E8" }}>
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} color={listing.condition === "like-new" ? MINT : "#F39C12"} />
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#2d2d2d" }}>{conditionLabel}</div>
                <div style={{ fontSize: "0.72rem", color: "#bbb" }}>
                  {listing.condition === "like-new" ? "No scratches or marks." : "May have minor scratches or marks."}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Likes & Comments */}
        <div className="px-4 mb-4">
          <div className="flex items-center gap-4 mb-3">
            <button onClick={handleLike} className="flex items-center gap-1.5" style={{ color: liked ? PRIMARY : "#aaa" }}>
              <Heart size={20} fill={liked ? PRIMARY : "none"} color={liked ? PRIMARY : "#aaa"} />
              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{likeCount}</span>
            </button>
            <button onClick={() => setShowComments(s => !s)} className="flex items-center gap-1.5" style={{ color: "#aaa" }}>
              <MessageCircle size={20} color="#aaa" />
              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{comments.length}</span>
            </button>
          </div>
          {showComments && (
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <input
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleComment()}
                  placeholder="Add a comment…"
                  className="flex-1 px-3 py-2 rounded-xl outline-none"
                  style={{ border: "1.5px solid #F0D8E8", background: "#fff", fontSize: "0.82rem" }}
                />
                <button onClick={handleComment} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: PRIMARY }}>
                  <Send size={14} color="#fff" />
                </button>
              </div>
              {comments.map(c => (
                <div key={c.id} className="flex gap-2">
                  <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FFB8D0, #C9A8E0)", fontSize: "0.6rem", color: "#fff", fontWeight: 700 }}>
                    {c.user[0].toUpperCase()}
                  </div>
                  <div className="flex-1 px-3 py-2 rounded-xl" style={{ background: "#fff", border: "1px solid #F0D8E8" }}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: PRIMARY }}>@{c.user}</span>
                      <span style={{ fontSize: "0.65rem", color: "#bbb" }}>{c.time}</span>
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "#555" }}>{c.text}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

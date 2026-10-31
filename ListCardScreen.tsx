import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "../router";
import { Camera, Image as ImageIcon, X, ChevronRight, ChevronDown, ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PHOTOCARDS } from "../data/mockData";
import { PhotocardImage } from "../components/PhotocardImage";
import { getCurrentUser } from "../data/userStore";

const PRIMARY = "#D4759A";
const MINT = "#5CC0A8";

const DRAFT_KEY = "barter_listing_draft";
const RESULT_KEY = "barter_select_result";
const PENDING_KEY = "barter_select_pending";

function compressImage(file: File): Promise<string> {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const max = 800;
        let { width, height } = img;
        if (width > max || height > max) {
          if (width > height) { height = (height * max) / width; width = max; }
          else { width = (width * max) / height; height = max; }
        }
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}

type Condition = "like-new" | "used";
type ListingType = "for-sale" | "for-trade" | "both";

export default function ListCardScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [cardType, setCardType] = useState("");
  const [typeReferenceCardId, setTypeReferenceCardId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState<Condition>("like-new");
  const [listingType, setListingType] = useState<ListingType>("for-sale");
  const [price, setPrice] = useState("");
  const [tradeMode, setTradeMode] = useState<"wishlist" | "specific">("wishlist");
  const [tradeCardIds, setTradeCardIds] = useState<string[]>([]);
  const [showTradeExpanded, setShowTradeExpanded] = useState(false);

  const SUGGESTED = "5.50";
  const LAST_SOLD = "6.30";

  // Restore draft / existing listing / consume any select result on mount
  useEffect(() => {
    const draft = (() => { try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); } catch { return null; } })();

    // If editing an existing listing, load it (draft takes priority to preserve mid-edit state)
    if (!draft && editId) {
      const listings = (() => { try { return JSON.parse(localStorage.getItem("barter_my_listings") || "[]"); } catch { return []; } })();
      const existing = listings.find((l: any) => l.id === editId);
      if (existing) {
        setPhotoUri(existing.photoUri ?? null);
        setCardType(existing.cardType ?? "");
        setTypeReferenceCardId(existing.typeReferenceCardId ?? null);
        setTitle(existing.title ?? "");
        setDescription(existing.description ?? "");
        setCondition(existing.condition ?? "like-new");
        setListingType(existing.listingType ?? "for-sale");
        setPrice(existing.price ?? "");
        setTradeMode(existing.tradeMode ?? "wishlist");
        setTradeCardIds(existing.tradeCardIds ?? []);
        if (existing.tradeCardIds?.length) setShowTradeExpanded(true);
      }
    }

    if (draft) {
      setPhotoUri(draft.photoUri ?? null);
      setCardType(draft.cardType ?? "");
      setTypeReferenceCardId(draft.typeReferenceCardId ?? null);
      setTitle(draft.title ?? "");
      setDescription(draft.description ?? "");
      setCondition(draft.condition ?? "like-new");
      setListingType(draft.listingType ?? "for-sale");
      setPrice(draft.price ?? "");
      setTradeMode(draft.tradeMode ?? "wishlist");
      setTradeCardIds(draft.tradeCardIds ?? []);
      localStorage.removeItem(DRAFT_KEY);
    }

    const result = (() => { try { return JSON.parse(localStorage.getItem(RESULT_KEY) || "null"); } catch { return null; } })();
    if (result) {
      localStorage.removeItem(RESULT_KEY);
      if (result.mode === "type" && result.cardIds?.length > 0) {
        const ref = PHOTOCARDS.find(c => c.id === result.cardIds[0]);
        if (ref) {
          setTypeReferenceCardId(ref.id);
          setCardType(ref.type || ref.era);
          setTitle(`${ref.groupName} ${ref.memberName} · ${ref.era}`);
        }
      } else if (result.mode === "trade" && result.cardIds?.length > 0) {
        setTradeCardIds(result.cardIds);
        setTradeMode("specific");
        setShowTradeExpanded(true);
      }
    }
  }, []);

  const saveDraft = () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ photoUri, cardType, typeReferenceCardId, title, description, condition, listingType, price, tradeMode, tradeCardIds, editId }));
  };

  const goToBrowseSelect = (mode: "type" | "trade") => {
    saveDraft();
    localStorage.setItem(PENDING_KEY, JSON.stringify({ mode }));
    const returnPath = editId ? `/list-card?edit=${editId}` : "/list-card";
    navigate(`/browse-select?mode=${mode}&return=${encodeURIComponent(returnPath)}`);
  };

  const handlePhoto = async (file: File) => {
    const uri = await compressImage(file);
    setPhotoUri(uri);
  };

  const handlePublish = () => {
    if (!title.trim()) { toast.error("Please enter a title"); return; }
    if (listingType === "for-sale" || listingType === "both") {
      const p = parseFloat(price);
      if (!price || isNaN(p) || p <= 1) { toast.error("Price must be greater than $1.00"); return; }
    }
    const listings = (() => { try { return JSON.parse(localStorage.getItem("barter_my_listings") || "[]"); } catch { return []; } })();
    const updated = {
      photoUri,
      cardType,
      typeReferenceCardId,
      title,
      description,
      condition,
      listingType,
      price,
      tradeMode,
      tradeCardIds,
      ownerEmail: getCurrentUser()?.email ?? null,
    };
    if (editId) {
      const idx = listings.findIndex((l: any) => l.id === editId);
      if (idx !== -1) listings[idx] = { ...listings[idx], ...updated };
      localStorage.setItem("barter_my_listings", JSON.stringify(listings));
      toast.success("Listing updated! 🎴");
    } else {
      listings.unshift({ id: Date.now().toString(), ...updated, listedAt: new Date().toISOString() });
      localStorage.setItem("barter_my_listings", JSON.stringify(listings));
      toast.success("Card listed! 🎴");
    }
    navigate("/profile");
  };

  const handleDelete = () => {
    if (!editId) return;
    const listings = (() => { try { return JSON.parse(localStorage.getItem("barter_my_listings") || "[]"); } catch { return []; } })();
    localStorage.setItem("barter_my_listings", JSON.stringify(listings.filter((l: any) => l.id !== editId)));
    toast.success("Listing deleted");
    navigate("/profile");
  };

  const typeRefCard = typeReferenceCardId ? PHOTOCARDS.find(c => c.id === typeReferenceCardId) : null;
  const tradeCards = tradeCardIds.map(id => PHOTOCARDS.find(c => c.id === id)).filter(Boolean) as typeof PHOTOCARDS;

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--background)" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3" style={{ background: "var(--background)" }}>
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#fff", border: "1px solid #F0D8E8" }}>
          <ArrowLeft size={18} color="#333" />
        </button>
        <span style={{ fontWeight: 700, color: "#2d2d2d", fontSize: "0.95rem" }}>{editId ? "Edit Listing" : "List a Card"}</span>
        <div className="w-9" />
      </div>

      {/* Photo area */}
      <div
        className="relative flex items-center justify-center flex-shrink-0 mx-4 rounded-2xl overflow-hidden"
        style={{ background: photoUri ? "transparent" : "linear-gradient(135deg, #FFB8D0 0%, #C9A8E0 50%, #7BBFEA 100%)", minHeight: 180 }}
      >
        {photoUri ? (
          <div className="relative w-full">
            <img src={photoUri} alt="card" className="w-full" style={{ maxHeight: 220, objectFit: "cover" }} />
            <button
              onClick={() => setPhotoUri(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.5)" }}
            >
              <X size={15} color="#fff" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-8">
            <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.88rem" }}>Add a photo of your card</div>
            <div className="flex gap-3">
              <button
                onClick={() => cameraRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.25)", color: "#fff", fontSize: "0.82rem", fontWeight: 600 }}
              >
                <Camera size={16} /> Camera
              </button>
              <button
                onClick={() => galleryRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.25)", color: "#fff", fontSize: "0.82rem", fontWeight: 600 }}
              >
                <ImageIcon size={16} /> Gallery
              </button>
            </div>
          </div>
        )}
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => e.target.files?.[0] && handlePhoto(e.target.files[0])} />
        <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handlePhoto(e.target.files[0])} />
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto pb-28">
        <div className="px-4 pt-4">
          <div style={{ fontWeight: 700, color: "#2d2d2d", fontSize: "0.95rem", marginBottom: 12 }}>Item Information</div>

          {/* Photocard type — navigates to browse-select */}
          <button
            onClick={() => goToBrowseSelect("type")}
            className="flex items-center justify-between w-full px-4 py-3 rounded-xl mb-2"
            style={{ background: "#fff", border: `1.5px solid ${typeRefCard ? PRIMARY : "#F0D8E8"}` }}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {typeRefCard && (
                <div className="rounded-lg overflow-hidden flex-shrink-0" style={{ width: 32, height: 44 }}>
                  <PhotocardImage groupId={typeRefCard.groupId} memberId={typeRefCard.memberId} memberName={typeRefCard.memberName} imgSeed={typeRefCard.imgSeed} className="w-full h-full" />
                </div>
              )}
              <span style={{ fontSize: "0.88rem", color: cardType ? "#2d2d2d" : "#bbb" }} className="line-clamp-1">
                {cardType || "Photocard type"}
              </span>
            </div>
            <ChevronRight size={16} color="#bbb" />
          </button>

          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Title (e.g. KARMA SK200 Ver. SOUND WAVE)"
            className="w-full px-4 py-3 rounded-xl mb-2"
            style={{ border: "1.5px solid #F0D8E8", background: "#fff", outline: "none", fontSize: "0.88rem" }}
          />

          {/* Description */}
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Description (Optional)"
            rows={3}
            className="w-full px-4 py-3 rounded-xl mb-1"
            style={{ border: "1.5px solid #F0D8E8", background: "#fff", outline: "none", fontSize: "0.85rem", resize: "none" }}
          />
          <div style={{ fontSize: "0.7rem", color: "#bbb", paddingLeft: 4, marginBottom: 12 }}>
            Items with detailed descriptions sell better. Personal info is not allowed.
          </div>
        </div>

        {/* Item Condition */}
        <div className="px-4 mb-1">
          <div style={{ fontWeight: 700, color: "#2d2d2d", fontSize: "0.95rem", marginBottom: 10 }}>Item Condition</div>
          <div className="flex flex-col gap-2">
            {([
              { id: "like-new" as Condition, label: "Like New", sub: "No scratches or marks." },
              { id: "used" as Condition, label: "Used", sub: "With scratches or marks." },
            ]).map(c => (
              <button
                key={c.id}
                onClick={() => setCondition(c.id)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-left"
                style={{ background: "#fff", border: `1.5px solid ${condition === c.id ? PRIMARY : "#F0D8E8"}` }}
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ border: `2px solid ${condition === c.id ? PRIMARY : "#ddd"}`, background: condition === c.id ? PRIMARY : "#fff" }}
                >
                  {condition === c.id && <div className="w-2 h-2 rounded-full" style={{ background: "#fff" }} />}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: "#2d2d2d", fontSize: "0.88rem" }}>{c.label}</div>
                  <div style={{ fontSize: "0.72rem", color: "#bbb" }}>{c.sub}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Listing type */}
        <div className="px-4 pt-4 mb-1">
          <div style={{ fontWeight: 700, color: "#2d2d2d", fontSize: "0.95rem", marginBottom: 10 }}>Listing Type</div>
          <div className="flex gap-2">
            {([
              { id: "for-sale" as ListingType, label: "for sale" },
              { id: "for-trade" as ListingType, label: "for trade" },
              { id: "both" as ListingType, label: "for sale & trade" },
            ]).map(lt => (
              <button
                key={lt.id}
                onClick={() => setListingType(lt.id)}
                className="flex-1 py-2 rounded-xl"
                style={{
                  background: listingType === lt.id ? PRIMARY : "#fff",
                  color: listingType === lt.id ? "#fff" : "#888",
                  border: `1.5px solid ${listingType === lt.id ? PRIMARY : "#F0D8E8"}`,
                  fontSize: "0.72rem",
                  fontWeight: 600,
                }}
              >
                {lt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Item Price */}
        {(listingType === "for-sale" || listingType === "both") && (
          <div className="px-4 pt-4 mb-1">
            <div style={{ fontWeight: 700, color: "#2d2d2d", fontSize: "0.95rem", marginBottom: 4 }}>Item Price</div>
            <div style={{ fontSize: "0.72rem", color: "#bbb", marginBottom: 10 }}>Show amount in increments of 0.05</div>
            <div className="flex gap-3 mb-3">
              <div className="flex-1 px-3 py-2.5 rounded-xl" style={{ background: "#fff", border: "1.5px solid #F0D8E8" }}>
                <div style={{ fontSize: "0.68rem", color: "#bbb" }}>Suggested Price</div>
                <div style={{ fontWeight: 700, color: PRIMARY, fontSize: "0.95rem" }}>${SUGGESTED} USD</div>
              </div>
              <div className="flex-1 px-3 py-2.5 rounded-xl" style={{ background: "#fff", border: "1.5px solid #F0D8E8" }}>
                <div style={{ fontSize: "0.68rem", color: "#bbb" }}>Last Sold Price</div>
                <div style={{ fontWeight: 700, color: "#9B82D4", fontSize: "0.95rem" }}>${LAST_SOLD} USD</div>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <div style={{ fontSize: "0.8rem", color: "#555", fontWeight: 600, minWidth: 40 }}>Price</div>
              <input
                type="number"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="0.00"
                className="flex-1 px-3 py-2.5 rounded-xl text-center"
                style={{ border: "1.5px solid #F0D8E8", background: "#fff", outline: "none", fontSize: "0.95rem", fontWeight: 600 }}
              />
              <div className="px-3 py-2.5 rounded-xl flex items-center justify-center" style={{ background: "#F5E5EE", color: PRIMARY, fontWeight: 700, fontSize: "0.82rem", minWidth: 48 }}>
                USD
              </div>
            </div>
          </div>
        )}

        {/* Trade selection */}
        {(listingType === "for-trade" || listingType === "both") && (
          <div className="px-4 pt-4">
            <div style={{ fontWeight: 700, color: "#2d2d2d", fontSize: "0.95rem", marginBottom: 10 }}>Trade Selection</div>
            <div className="rounded-2xl overflow-hidden" style={{ border: "1.5px solid #F0D8E8", background: "#fff" }}>
              {/* Wishlist option */}
              <button
                onClick={() => {
                  setTradeMode("wishlist");
                  const user = getCurrentUser();
                  setTradeCardIds(user?.likesIds || []);
                  setShowTradeExpanded(true);
                }}
                className="flex items-center gap-3 w-full px-4 py-3 text-left"
                style={{ borderBottom: "1px solid #f5f5f5" }}
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ border: `2px solid ${tradeMode === "wishlist" ? PRIMARY : "#ddd"}`, background: tradeMode === "wishlist" ? PRIMARY : "#fff" }}
                >
                  {tradeMode === "wishlist" && <div className="w-2 h-2 rounded-full" style={{ background: "#fff" }} />}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#2d2d2d" }}>Trade for my entire likes</div>
                  <div style={{ fontSize: "0.72rem", color: "#bbb" }}>Auto-updates with your likes</div>
                </div>
              </button>

              {/* Specific cards option — navigates to browse-select */}
              <button
                onClick={() => { setTradeMode("specific"); goToBrowseSelect("trade"); }}
                className="flex items-center gap-3 w-full px-4 py-3 text-left"
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ border: `2px solid ${tradeMode === "specific" ? PRIMARY : "#ddd"}`, background: tradeMode === "specific" ? PRIMARY : "#fff" }}
                >
                  {tradeMode === "specific" && <div className="w-2 h-2 rounded-full" style={{ background: "#fff" }} />}
                </div>
                <div className="flex-1">
                  <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#2d2d2d" }}>Select specific cards</div>
                  <div style={{ fontSize: "0.72rem", color: "#bbb" }}>Choose cards you'll accept</div>
                </div>
                <ChevronRight size={14} color="#bbb" />
              </button>
            </div>

            {/* Selected trade cards thumbnails */}
            {tradeCards.length > 0 && (
              <div className="mt-3">
                <div style={{ fontSize: "0.75rem", color: "#999", marginBottom: 8 }}>{tradeMode === "wishlist" ? `From your likes (${tradeCards.length}):` : `Accepting trades for (${tradeCards.length}):`}</div>
                <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                  {tradeCards.map(card => (
                    <div key={card.id} className="flex-shrink-0 relative">
                      <div className="rounded-xl overflow-hidden" style={{ width: 52 }}>
                        <PhotocardImage groupId={card.groupId} memberId={card.memberId} memberName={card.memberName} imgSeed={card.imgSeed} databaseImageFilename={card.databaseImageFilename} uploadImageFilename={card.uploadImageFilename} className="w-full" style={{ aspectRatio: "3/4.5" } as any} />
                      </div>
                      <button
                        onClick={() => setTradeCardIds(prev => prev.filter(id => id !== card.id))}
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ background: "#E74C3C" }}
                      >
                        <X size={8} color="#fff" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => goToBrowseSelect("trade")}
                    className="flex-shrink-0 w-14 rounded-xl flex items-center justify-center"
                    style={{ border: "2px dashed #F0D8E8", minHeight: 70, color: PRIMARY }}
                  >
                    <span style={{ fontSize: "1.2rem" }}>+</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 max-w-md mx-auto flex flex-col gap-2"
        style={{ background: "linear-gradient(transparent, var(--background) 30%)" }}
      >
        <button
          onClick={handlePublish}
          className="w-full py-3.5 rounded-2xl"
          style={{
            background: "linear-gradient(135deg, #E880A4 0%, #C9A8E0 60%, #7BBFEA 100%)",
            color: "#fff",
            fontWeight: 700,
            fontSize: "1rem",
          }}
        >
          {editId ? "Save Changes" : "Publish Listing"}
        </button>
        {editId && (
          <button
            onClick={handleDelete}
            className="w-full py-3 rounded-2xl flex items-center justify-center gap-2"
            style={{ background: "#fff", border: "1.5px solid #F0D8E8", color: "#E05C5C", fontWeight: 600, fontSize: "0.9rem" }}
          >
            <Trash2 size={16} />
            Delete Listing
          </button>
        )}
      </div>
    </div>
  );
}

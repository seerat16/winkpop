import { useState, useEffect } from "react";
import { useNavigate } from "../router";
import { Heart, ShoppingCart, Search, Tag, ArrowLeft, Trash2, Check } from "lucide-react";
import { PHOTOCARDS } from "../data/mockData";
import { PhotocardImage } from "../components/PhotocardImage";
import { toast } from "sonner";
import { getCurrentUser, removeFromCart } from "../data/userStore";

const SERVICE_FEE_RATE = 0.05;

type SalesTab = "hub" | "cart";

export default function SalesScreen() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<SalesTab>("hub");

  // Cart state - read from current user
  const currentUser = getCurrentUser();
  const [cartIds, setCartIds] = useState<string[]>(currentUser?.cartIds || []);
  const [selected, setSelected] = useState<string[]>(currentUser?.cartIds || []);
  const [coupon, setCoupon] = useState("");
  const [payMethod, setPayMethod] = useState<"wallet" | "quick" | "paypal" | "card">("wallet");
  const [purchased, setPurchased] = useState(false);

  // Sync local state with user account changes
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCartIds(user.cartIds);
    }
  }, []);

  const cartCards = PHOTOCARDS.filter(c => cartIds.includes(c.id));
  const selectedCards = cartCards.filter(c => selected.includes(c.id));
  const subtotal = selectedCards.reduce((sum, c) => sum + c.price, 0);
  const fee = subtotal * SERVICE_FEE_RATE;
  const total = subtotal + fee;

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };
  
  const handleRemoveFromCart = (id: string) => {
    removeFromCart(id);
    setCartIds(prev => prev.filter(i => i !== id));
    setSelected(prev => prev.filter(i => i !== id));
    toast("Removed from cart");
  };
  
  const handlePurchase = () => {
    if (selected.length === 0) { toast.error("Please select items to purchase"); return; }
    setPurchased(true);
  };

  if (purchased) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 gap-6" style={{ background: "var(--background)" }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "#5CC0A8" }}>
          <Check size={40} color="#fff" strokeWidth={3} />
        </div>
        <div className="text-center">
          <h2 style={{ color: "#2d2d2d" }}>Purchase Successful! 🎉</h2>
          <p style={{ color: "#999", fontSize: "0.85rem", marginTop: 6 }}>
            Your cards are on their way. Check your email for tracking info.
          </p>
        </div>
        <div className="w-full p-4 rounded-2xl" style={{ background: "#fff" }}>
          <div className="flex justify-between mb-1">
            <span style={{ color: "#666", fontSize: "0.85rem" }}>Total paid</span>
            <span style={{ fontWeight: 700, color: "#2d2d2d" }}>${total.toFixed(2)} USD</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "#666", fontSize: "0.85rem" }}>Items</span>
            <span style={{ color: "#333", fontSize: "0.85rem" }}>{selected.length} card{selected.length !== 1 ? "s" : ""}</span>
          </div>
        </div>
        <button onClick={() => { setPurchased(false); setTab("hub"); }} className="w-full py-3.5 rounded-xl" style={{ background: "#D4759A", color: "#fff", fontWeight: 700 }}>
          Back to Sales
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 sticky top-0 z-10" style={{ background: "var(--background)" }}>
        <div className="flex items-center justify-between mb-4">
          {tab !== "hub" ? (
            <button onClick={() => setTab("hub")} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#fff" }}>
              <ArrowLeft size={18} color="#333" />
            </button>
          ) : (
            <div />
          )}
          <h2 style={{ color: "#2d2d2d" }}>
            {tab === "hub" ? "Sales" : "Shopping Cart"}
          </h2>
          <div className="w-9" />
        </div>

        {tab === "hub" && (
          <div className="flex gap-1" style={{ background: "#F5E5EE", borderRadius: 12, padding: 4 }}>
            {(["wishlist", "cart"] as const).map(t => (
              <button
                key={t}
                onClick={() => t === "wishlist" ? navigate("/wishlist") : setTab("cart")}
                className="flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5"
                style={{
                  background: "transparent",
                  color: "#999",
                  fontWeight: 600,
                  fontSize: "0.82rem",
                }}
              >
                {t === "wishlist" ? <Heart size={13} /> : <ShoppingCart size={13} />}
                {t === "wishlist" ? "Likes" : "Cart"}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hub View */}
      {tab === "hub" && (
        <div className="px-4 pb-6 flex flex-col gap-4">
          {/* Wishlist card */}
          <button
            onClick={() => navigate("/wishlist")}
            className="w-full p-5 rounded-2xl text-left relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #FFB8D0 0%, #C9A8E0 100%)" }}
          >
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10">
              <Heart size={80} color="#fff" fill="#fff" />
            </div>
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: "rgba(255,255,255,0.25)" }}>
                <Heart size={20} color="#fff" fill="#fff" />
              </div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: "1.1rem" }}>Likes</div>
              <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.8rem", marginTop: 3 }}>
                Cards you want to own — track trades & sales
              </div>
            </div>
          </button>

          {/* Cart card */}
          <button
            onClick={() => setTab("cart")}
            className="w-full p-5 rounded-2xl text-left relative overflow-hidden"
            style={{ background: "#fff", border: "1.5px solid #F0D8E8" }}
          >
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-5">
              <ShoppingCart size={80} color="#333" />
            </div>
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: "#f5f0f0" }}>
                <ShoppingCart size={20} color="#D4759A" />
              </div>
              <div style={{ color: "#2d2d2d", fontWeight: 700, fontSize: "1.1rem" }}>
                Shopping Cart
                {cartIds.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 rounded-full text-white" style={{ background: "#D4759A", fontSize: "0.7rem" }}>
                    {cartIds.length}
                  </span>
                )}
              </div>
              <div style={{ color: "#999", fontSize: "0.8rem", marginTop: 3 }}>
                {cartIds.length > 0 ? `${cartIds.length} item${cartIds.length !== 1 ? "s" : ""} ready to purchase` : "Your cart is empty"}
              </div>
            </div>
          </button>

          {/* Browse CTA */}
          <button
            onClick={() => navigate("/browse")}
            className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2"
            style={{ background: "#f5f0f0", color: "#D4759A", fontWeight: 600, fontSize: "0.9rem" }}
          >
            <Search size={16} />
            Browse Photocards
          </button>

          {/* Recent deals section */}
          <div className="mt-2">
            <div className="flex items-center gap-2 mb-3">
              <Tag size={14} color="#999" />
              <span style={{ fontSize: "0.78rem", color: "#999", fontWeight: 600 }}>FEATURED DEALS</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {PHOTOCARDS.slice(0, 4).map(card => (
                <button
                  key={card.id}
                  onClick={() => navigate(`/card/${card.id}`)}
                  className="rounded-2xl overflow-hidden text-left"
                  style={{ background: "#fff", border: "1px solid #F0D8E8" }}
                >
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
                  <div className="p-2.5">
                    <div style={{ fontSize: "0.65rem", color: "#D4759A", fontWeight: 700 }}>{card.memberName}</div>
                    <div style={{ fontWeight: 700, color: "#2d2d2d", fontSize: "0.88rem", marginTop: 2 }}>${card.price.toFixed(2)}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cart View */}
      {tab === "cart" && (
        <>
          {cartCards.length > 0 && (
            <div className="mx-4 mb-3 px-3 py-2.5 rounded-xl flex items-start gap-2" style={{ background: "#fff8e1", border: "1px solid #ffe082" }}>
              <span style={{ fontSize: "0.9rem" }}>⚠️</span>
              <p style={{ fontSize: "0.75rem", color: "#7d6608" }}>
                Items auto-removed after 30 days. Price and stock may vary.
              </p>
            </div>
          )}

          {cartCards.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20" style={{ color: "#ccc" }}>
              <ShoppingCart size={48} strokeWidth={1} />
              <p style={{ fontSize: "0.9rem" }}>Your cart is empty</p>
              <button onClick={() => navigate("/browse")} className="px-5 py-2.5 rounded-xl" style={{ background: "#D4759A", color: "#fff", fontWeight: 600 }}>
                Browse Cards
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-4 pb-56">
              <div className="flex items-center gap-3 mb-3">
                <button onClick={() => setSelected(selected.length === cartCards.length ? [] : cartCards.map(c => c.id))} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded border-2 flex items-center justify-center" style={{ borderColor: selected.length === cartCards.length ? "#D4759A" : "#ddd", background: selected.length === cartCards.length ? "#D4759A" : "#fff" }}>
                    {selected.length === cartCards.length && <Check size={12} color="#fff" strokeWidth={3} />}
                  </div>
                  <span style={{ fontSize: "0.82rem", color: "#555" }}>Select All ({cartIds.length}/{cartIds.length})</span>
                </button>
                {selected.length > 0 && (
                  <button onClick={() => { setCartIds(prev => prev.filter(id => !selected.includes(id))); setSelected([]); }} className="ml-auto" style={{ color: "#D4759A", fontSize: "0.78rem", fontWeight: 600 }}>
                    Delete Selected
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-3 mb-4">
                {cartCards.map(card => (
                  <div key={card.id} className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: "#fff", border: "1px solid #F0D8E8" }}>
                    <button onClick={() => toggleSelect(card.id)}>
                      <div className="w-5 h-5 rounded border-2 flex items-center justify-center" style={{ borderColor: selected.includes(card.id) ? "#D4759A" : "#ddd", background: selected.includes(card.id) ? "#D4759A" : "#fff" }}>
                        {selected.includes(card.id) && <Check size={11} color="#fff" strokeWidth={3} />}
                      </div>
                    </button>
                    <div className="rounded-xl overflow-hidden flex-shrink-0" style={{ width: 52, height: 72 }} onClick={() => navigate(`/card/${card.id}`)}>
                      <PhotocardImage groupId={card.groupId} memberId={card.memberId} memberName={card.memberName} imgSeed={card.imgSeed} databaseImageFilename={card.databaseImageFilename} uploadImageFilename={card.uploadImageFilename} className="w-full h-full" />
                    </div>
                    <div className="flex-1">
                      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#2d2d2d" }}>{card.era}</div>
                      <div style={{ fontSize: "0.72rem", color: "#999" }}>{card.groupName} | {card.memberName}</div>
                      <div style={{ fontWeight: 700, color: "#D4759A", marginTop: 3, fontSize: "0.88rem" }}>${card.price.toFixed(2)} USD</div>
                    </div>
                    <button onClick={() => handleRemoveFromCart(card.id)}>
                      <Trash2 size={16} color="#ddd" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-2xl mb-4" style={{ background: "#fff", border: "1px solid #F0D8E8" }}>
                <div style={{ fontWeight: 600, color: "#333", fontSize: "0.9rem", marginBottom: 8 }}>Coupon</div>
                <div className="flex gap-2">
                  <input value={coupon} onChange={e => setCoupon(e.target.value)} placeholder="Enter coupon code..." className="flex-1 px-3 py-2 rounded-lg outline-none" style={{ background: "#f8f8f8", fontSize: "0.82rem", color: "#555" }} />
                  {coupon && <button onClick={() => setCoupon("")} style={{ color: "#D4759A", fontSize: "0.8rem", fontWeight: 600 }}>Clear</button>}
                </div>
              </div>

              <div className="p-4 rounded-2xl mb-4" style={{ background: "#fff", border: "1px solid #F0D8E8" }}>
                <div style={{ fontWeight: 600, color: "#333", fontSize: "0.9rem", marginBottom: 10 }}>Payment Method</div>
                <div className="flex flex-col gap-2">
                  {[
                    { id: "wallet", label: "Wallet", sub: "Balance: $0.00" },
                    { id: "quick", label: "Quick & Easy", sub: "Apple Pay · Google Pay · Klarna" },
                    { id: "paypal", label: "PayPal", sub: "" },
                    { id: "card", label: "Credit / Debit Card", sub: "" },
                  ].map(opt => (
                    <label key={opt.id} className="flex items-center gap-3 cursor-pointer p-2 rounded-xl" style={{ background: payMethod === opt.id ? "#fff0ee" : "transparent" }}>
                      <div onClick={() => setPayMethod(opt.id as any)} className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: payMethod === opt.id ? "#D4759A" : "#ddd" }}>
                        {payMethod === opt.id && <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#D4759A" }} />}
                      </div>
                      <div>
                        <div style={{ fontSize: "0.85rem", color: "#333", fontWeight: 500 }}>{opt.label}</div>
                        {opt.sub && <div style={{ fontSize: "0.72rem", color: "#999" }}>{opt.sub}</div>}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {cartCards.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-4" style={{ background: "#fff", borderTop: "1px solid #F0D8E8", paddingBottom: "env(safe-area-inset-bottom, 16px)" }}>
              <div className="py-3 flex flex-col gap-1">
                <div className="flex justify-between" style={{ fontSize: "0.8rem", color: "#999" }}>
                  <span>Subtotal ({selected.length} items)</span>
                  <span style={{ color: "#333" }}>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between" style={{ fontSize: "0.8rem", color: "#999" }}>
                  <span>Service fee (5%)</span>
                  <span style={{ color: "#333" }}>${fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span style={{ fontWeight: 700, color: "#2d2d2d" }}>Total</span>
                  <span style={{ fontWeight: 800, color: "#D4759A", fontSize: "1rem" }}>${total.toFixed(2)}</span>
                </div>
              </div>
              <button
                onClick={handlePurchase}
                className="w-full py-3.5 rounded-xl mb-3"
                style={{ background: selected.length > 0 ? "#D4759A" : "#F0D8E8", color: selected.length > 0 ? "#fff" : "#bbb", fontWeight: 700, fontSize: "0.95rem" }}
              >
                Purchase {selected.length > 0 ? `(${selected.length})` : ""}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
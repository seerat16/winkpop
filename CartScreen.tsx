import { useState, useEffect } from "react";
import { useNavigate } from "../router";
import { ArrowLeft, Home, Trash2, Check, Plus } from "lucide-react";
import { PHOTOCARDS } from "../data/mockData";
import { PhotocardImage } from "../components/PhotocardImage";
import { getCurrentUser, updateCurrentUser, addToCart } from "../data/userStore";
import { toast } from "sonner";

const SERVICE_FEE_RATE = 0.05;

export default function CartScreen() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const initialIds = user?.cartIds ?? [];
  const [cartIds, setCartIds] = useState<string[]>(initialIds);
  const [selected, setSelected] = useState<string[]>(initialIds);

  useEffect(() => {
    const result = (() => { try { return JSON.parse(localStorage.getItem("barter_select_result") || "null"); } catch { return null; } })();
    if (result?.mode === "cart" && result.cardIds?.length) {
      localStorage.removeItem("barter_select_result");
      result.cardIds.forEach((id: string) => addToCart(id));
      const updated = getCurrentUser()?.cartIds || [];
      setCartIds(updated);
      setSelected(updated);
      toast.success(`${result.cardIds.length} card${result.cardIds.length !== 1 ? "s" : ""} added to cart!`);
    }
  }, []);
  const [coupon, setCoupon] = useState("");
  const [payMethod, setPayMethod] = useState<"wallet" | "quick" | "paypal" | "card">("wallet");
  const [purchased, setPurchased] = useState(false);

  const cartCards = PHOTOCARDS.filter(c => cartIds.includes(c.id));
  const selectedCards = cartCards.filter(c => selected.includes(c.id));
  const subtotal = selectedCards.reduce((sum, c) => sum + c.price, 0);
  const fee = subtotal * SERVICE_FEE_RATE;
  const total = subtotal + fee;

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const removeFromCart = (id: string) => {
    const next = cartIds.filter(i => i !== id);
    setCartIds(next);
    setSelected(prev => prev.filter(i => i !== id));
    updateCurrentUser({ cartIds: next });
    toast("Removed from cart");
  };

  const handlePurchase = () => {
    if (selected.length === 0) {
      toast.error("Please select items to purchase");
      return;
    }
    setPurchased(true);
  };

  if (purchased) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 gap-6" style={{ background: "var(--background)" }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "#27AE60" }}>
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
        <button
          onClick={() => navigate("/home")}
          className="w-full py-3.5 rounded-xl"
          style={{ background: "#D4759A", color: "#fff", fontWeight: 700 }}
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-4 sticky top-0 z-10" style={{ background: "var(--background)" }}>
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#fff" }}>
          <ArrowLeft size={18} color="#333" />
        </button>
        <h2 style={{ color: "#2d2d2d" }}>Cart</h2>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => navigate("/browse-select?mode=cart&return=/cart")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
            style={{ background: "#D4759A", color: "#fff", fontSize: "0.78rem", fontWeight: 600 }}
          >
            <Plus size={14} /> Add
          </button>
          <button onClick={() => navigate("/home")} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#fff" }}>
            <Home size={18} color="#333" />
          </button>
        </div>
      </div>

      {/* Warning */}
      {cartCards.length > 0 && (
        <div className="mx-4 mb-3 px-3 py-2.5 rounded-xl flex items-start gap-2" style={{ background: "#fff8e1", border: "1px solid #ffe082" }}>
          <span style={{ fontSize: "0.9rem" }}>⚠️</span>
          <p style={{ fontSize: "0.75rem", color: "#7d6608" }}>
            If not purchased within 30 days, items will be auto-removed. Price and stock may vary.
          </p>
        </div>
      )}

      {cartCards.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4" style={{ color: "#ccc" }}>
          <div style={{ fontSize: "3rem" }}>🛒</div>
          <p style={{ fontSize: "0.9rem" }}>Your cart is empty</p>
          <button onClick={() => navigate("/home")} className="px-5 py-2.5 rounded-xl" style={{ background: "#D4759A", color: "#fff", fontWeight: 600 }}>
            Browse Cards
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 pb-56">
          {/* Select all */}
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => setSelected(selected.length === cartCards.length ? [] : cartCards.map(c => c.id))}
              className="flex items-center gap-2"
            >
              <div
                className="w-5 h-5 rounded border-2 flex items-center justify-center"
                style={{ borderColor: selected.length === cartCards.length ? "#D4759A" : "#ddd", background: selected.length === cartCards.length ? "#D4759A" : "#fff" }}
              >
                {selected.length === cartCards.length && <Check size={12} color="#fff" strokeWidth={3} />}
              </div>
              <span style={{ fontSize: "0.82rem", color: "#555" }}>Select All ({cartIds.length}/{cartIds.length})</span>
            </button>
            {selected.length > 0 && (
              <button
                onClick={() => { const next = cartIds.filter(id => !selected.includes(id)); setCartIds(next); setSelected([]); updateCurrentUser({ cartIds: next }); }}
                className="ml-auto"
                style={{ color: "#D4759A", fontSize: "0.78rem", fontWeight: 600 }}
              >
                Delete Selected
              </button>
            )}
          </div>

          {/* Items */}
          <div className="flex flex-col gap-3 mb-4">
            {cartCards.map(card => (
              <div
                key={card.id}
                className="flex items-center gap-3 p-3 rounded-2xl"
                style={{ background: "#fff", border: "1px solid #F0D8E8" }}
              >
                <button onClick={() => toggleSelect(card.id)}>
                  <div
                    className="w-5 h-5 rounded border-2 flex items-center justify-center"
                    style={{ borderColor: selected.includes(card.id) ? "#D4759A" : "#ddd", background: selected.includes(card.id) ? "#D4759A" : "#fff" }}
                  >
                    {selected.includes(card.id) && <Check size={11} color="#fff" strokeWidth={3} />}
                  </div>
                </button>
                <div
                  className="rounded-xl overflow-hidden flex-shrink-0"
                  style={{ width: 52, height: 72 }}
                  onClick={() => navigate(`/card/${card.id}`)}
                >
                  <PhotocardImage
                    groupId={card.groupId}
                    memberId={card.memberId}
                    memberName={card.memberName}
                    imgSeed={card.imgSeed}
                    databaseImageFilename={card.databaseImageFilename}
                    uploadImageFilename={card.uploadImageFilename}
                    className="w-full h-full"
                  />
                </div>
                <div className="flex-1">
                  <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#2d2d2d" }}>{card.era}</div>
                  <div style={{ fontSize: "0.72rem", color: "#999" }}>{card.groupName} | {card.memberName}</div>
                  <div style={{ fontWeight: 700, color: "#D4759A", marginTop: 3, fontSize: "0.88rem" }}>
                    ${card.price.toFixed(2)} USD
                  </div>
                </div>
                <button onClick={() => removeFromCart(card.id)}>
                  <Trash2 size={16} color="#ddd" />
                </button>
              </div>
            ))}
          </div>

          {/* Coupon */}
          <div className="p-4 rounded-2xl mb-4" style={{ background: "#fff", border: "1px solid #F0D8E8" }}>
            <div style={{ fontWeight: 600, color: "#333", fontSize: "0.9rem", marginBottom: 8 }}>Coupon</div>
            <div className="flex gap-2">
              <input
                value={coupon}
                onChange={e => setCoupon(e.target.value)}
                placeholder="Please select a coupon..."
                className="flex-1 px-3 py-2 rounded-lg outline-none"
                style={{ background: "#f8f8f8", fontSize: "0.82rem", color: "#555" }}
              />
              {coupon && (
                <button onClick={() => setCoupon("")} style={{ color: "#D4759A", fontSize: "0.8rem", fontWeight: 600 }}>
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Payment method */}
          <div className="p-4 rounded-2xl mb-4" style={{ background: "#fff", border: "1px solid #F0D8E8" }}>
            <div style={{ fontWeight: 600, color: "#333", fontSize: "0.9rem", marginBottom: 10 }}>Payment Method</div>
            <div className="flex flex-col gap-2">
              {[
                { id: "wallet", label: "Wallet", sub: `Balance: $${(24.50).toFixed(2)}` },
                { id: "quick", label: "Quick & Easy", sub: "Apple Pay · Google Pay · Klarna" },
                { id: "paypal", label: "PayPal", sub: "" },
                { id: "card", label: "Credit / Debit Card", sub: "" },
              ].map(opt => (
                <label key={opt.id} className="flex items-center gap-3 cursor-pointer p-2 rounded-xl" style={{ background: payMethod === opt.id ? "#FFF0F7" : "transparent" }}>
                  <div
                    onClick={() => setPayMethod(opt.id as any)}
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                    style={{ borderColor: payMethod === opt.id ? "#D4759A" : "#ddd" }}
                  >
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

      {/* Bottom summary */}
      {cartCards.length > 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-4 pb-safe"
          style={{ background: "#fff", borderTop: "1px solid #F0D8E8", paddingBottom: "env(safe-area-inset-bottom, 16px)" }}
        >
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
            style={{
              background: selected.length > 0 ? "#D4759A" : "#F0D8E8",
              color: selected.length > 0 ? "#fff" : "#bbb",
              fontWeight: 700,
              fontSize: "0.95rem",
            }}
          >
            Purchase {selected.length > 0 ? `(${selected.length})` : ""}
          </button>
        </div>
      )}
    </div>
  );
}

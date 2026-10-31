import { useState } from "react";
import { useNavigate } from "../router";
import { ArrowLeftRight, Plus, Check, X, Clock, ChevronRight } from "lucide-react";
import { PHOTOCARDS, TRADE_REQUESTS, MY_COLLECTION_IDS } from "../data/mockData";
import { PhotocardImage } from "../components/PhotocardImage";
import { toast } from "sonner";

export default function TradingTransactionsContent() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"incoming" | "outgoing">("incoming");
  const [trades, setTrades] = useState(TRADE_REQUESTS);

  const myCollectionCards = PHOTOCARDS.filter(c => MY_COLLECTION_IDS.includes(c.id));

  const incoming = trades.filter(t => t.type === "incoming");
  const outgoing = trades.filter(t => t.type === "outgoing");
  const displayed = activeTab === "incoming" ? incoming : outgoing;

  const getCard = (id: string) => PHOTOCARDS.find(c => c.id === id);

  const acceptTrade = (tradeId: string) => {
    setTrades(prev => prev.map(t => t.id === tradeId ? { ...t, status: "accepted" as const } : t));
    toast.success("Trade accepted! 🎉 Remember to ship promptly.");
  };

  const declineTrade = (tradeId: string) => {
    setTrades(prev => prev.map(t => t.id === tradeId ? { ...t, status: "declined" as const } : t));
    toast("Trade declined");
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const cfg = {
      pending: { color: "#F39C12", bg: "#fff8e1", label: "Pending" },
      accepted: { color: "#5CC0A8", bg: "#EDFAF5", label: "Accepted" },
      declined: { color: "#E74C3C", bg: "#fff0f0", label: "Declined" },
    }[status] || { color: "#ccc", bg: "#f5f5f5", label: status };

    return (
      <span className="px-2.5 py-1 rounded-full" style={{ background: cfg.bg, color: cfg.color, fontSize: "0.72rem", fontWeight: 700 }}>
        {cfg.label}
      </span>
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="px-4 pt-5 pb-0" style={{ background: "var(--background)" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ color: "#2d2d2d" }}>Trades</h2>
          <button
            onClick={() => navigate("/home")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
            style={{ background: "#D4759A", color: "#fff", fontSize: "0.78rem", fontWeight: 600 }}
          >
            <Plus size={14} />
            Browse to Trade
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1" style={{ background: "#F5E5EE", borderRadius: 12, padding: 4 }}>
          {(["incoming", "outgoing"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-2 rounded-lg flex items-center justify-center gap-2"
              style={{
                background: activeTab === tab ? "#fff" : "transparent",
                color: activeTab === tab ? "#D4759A" : "#999",
                fontWeight: 600,
                fontSize: "0.85rem",
                boxShadow: activeTab === tab ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {tab === "incoming" ? "Incoming" : "Outgoing"}
              <span
                className="px-1.5 rounded-full"
                style={{
                  background: activeTab === tab ? "#D4759A" : "#ddd",
                  color: "#fff",
                  fontSize: "0.68rem",
                  fontWeight: 700,
                }}
              >
                {(tab === "incoming" ? incoming : outgoing).filter(t => t.status === "pending").length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* My Collection quick view */}
      <div className="px-4 pt-4 pb-2">
        <div style={{ fontSize: "0.8rem", color: "#999", fontWeight: 500, marginBottom: 8 }}>Your Collection (for trading)</div>
        <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {myCollectionCards.map(card => (
            <button
              key={card.id}
              onClick={() => navigate(`/card/${card.id}`)}
              className="flex-shrink-0 rounded-xl overflow-hidden"
              style={{ width: 60, border: "1px solid #F0D8E8" }}
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
            </button>
          ))}
          <button
            onClick={() => navigate("/collection")}
            className="flex-shrink-0 w-16 rounded-xl flex items-center justify-center"
            style={{ border: "2px dashed #F0D8E8", height: 90, color: "#D4759A" }}
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Trade list */}
      <div className="flex-1 px-4 pb-4">
        {displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3" style={{ color: "#ccc" }}>
            <ArrowLeftRight size={40} strokeWidth={1} />
            <p style={{ fontSize: "0.9rem" }}>No {activeTab} trade requests</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {displayed.map(trade => {
              const offered = getCard(trade.offeredCardId);
              const requested = getCard(trade.requestedCardId);
              if (!offered || !requested) return null;

              return (
                <div
                  key={trade.id}
                  className="p-4 rounded-2xl"
                  style={{ background: "#fff", border: "1px solid #F0D8E8" }}
                >
                  {/* Header row */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "#999" }}>{trade.date}</div>
                      <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#333" }}>
                        {activeTab === "incoming" ? `From @${trade.fromUser}` : `To @${trade.fromUser}`}
                      </div>
                    </div>
                    <StatusBadge status={trade.status} />
                  </div>

                  {/* Cards */}
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center gap-1">
                      <div className="rounded-xl overflow-hidden" style={{ width: 64, height: 88 }}>
                        <PhotocardImage
                          groupId={offered.groupId}
                          memberId={offered.memberId}
                          memberName={offered.memberName}
                          imgSeed={offered.imgSeed}
                          className="w-full h-full"
                        />
                      </div>
                      <span style={{ fontSize: "0.62rem", color: "#999" }}>{activeTab === "incoming" ? "Offered" : "Your card"}</span>
                    </div>

                    <div className="flex flex-col items-center gap-1">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ background: "#FFF0F7" }}
                      >
                        <ArrowLeftRight size={14} color="#D4759A" />
                      </div>
                      {trade.topUp && trade.topUp > 0 ? (
                        <span style={{ fontSize: "0.65rem", color: "#5CC0A8", fontWeight: 600 }}>
                          +${trade.topUp} top-up
                        </span>
                      ) : null}
                    </div>

                    <div className="flex flex-col items-center gap-1">
                      <div className="rounded-xl overflow-hidden" style={{ width: 64, height: 88 }}>
                        <PhotocardImage
                          groupId={requested.groupId}
                          memberId={requested.memberId}
                          memberName={requested.memberName}
                          imgSeed={requested.imgSeed}
                          className="w-full h-full"
                        />
                      </div>
                      <span style={{ fontSize: "0.62rem", color: "#999" }}>{activeTab === "incoming" ? "Wants" : "Requested"}</span>
                    </div>

                    <div className="flex-1 flex flex-col gap-1.5 ml-1">
                      <div>
                        <div style={{ fontSize: "0.65rem", color: "#D4759A", fontWeight: 600 }}>{offered.groupName}</div>
                        <div style={{ fontSize: "0.72rem", color: "#555" }} className="line-clamp-1">{offered.era}</div>
                      </div>
                      <div style={{ fontSize: "0.65rem", color: "#999" }}>↕</div>
                      <div>
                        <div style={{ fontSize: "0.65rem", color: "#D4759A", fontWeight: 600 }}>{requested.groupName}</div>
                        <div style={{ fontSize: "0.72rem", color: "#555" }} className="line-clamp-1">{requested.era}</div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {trade.status === "pending" && activeTab === "incoming" && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => declineTrade(trade.id)}
                        className="flex-1 py-2 rounded-xl flex items-center justify-center gap-1"
                        style={{ border: "1.5px solid #F0D8E8", color: "#999", fontSize: "0.82rem", fontWeight: 600 }}
                      >
                        <X size={14} /> Decline
                      </button>
                      <button
                        onClick={() => acceptTrade(trade.id)}
                        className="flex-1 py-2 rounded-xl flex items-center justify-center gap-1"
                        style={{ background: "#D4759A", color: "#fff", fontSize: "0.82rem", fontWeight: 700 }}
                      >
                        <Check size={14} /> Accept
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

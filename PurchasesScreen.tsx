import { useState } from "react";
import { useNavigate } from "../router";
import { ArrowLeft, ShoppingBag, Package } from "lucide-react";
import { matchesTrackingFilters, TrackingSearchFilters } from "../components/TrackingSearchFilters";
import type { CardType } from "../data/mockData";

const PRIMARY = "#D4759A";
const MINT = "#5CC0A8";

export const MOCK_PURCHASES = [
  { id: "p1", title: "BTS Jimin · Proof", description: "Proof album Jimin photocard with original album packaging.", group: "BTS", idol: "Jimin", categoryType: "Korean Album" as CardType, seller: "@seoyeontrading", price: 5.50, date: "2026-05-28", status: "delivered", imgGrad: "linear-gradient(135deg,#FFB8D0,#C9A8E0)" },
  { id: "p2", title: "BTS Jungkook · Butter", description: "Butter Jungkook photocard in mint condition.", group: "BTS", idol: "Jungkook", categoryType: "Japanese Album" as CardType, seller: "@pocafan99", price: 8.00, date: "2026-05-20", status: "delivered", imgGrad: "linear-gradient(135deg,#C9A8E0,#7BBFEA)" },
  { id: "p3", title: "TWICE Nayeon · With You", description: "With You era Nayeon album photocard, sleeved and protected.", group: "TWICE", idol: "Nayeon", categoryType: "Album benefit" as CardType, seller: "@hanaluvspc", price: 6.30, date: "2026-05-10", status: "in transit", imgGrad: "linear-gradient(135deg,#7BBFEA,#5CC0A8)" },
  { id: "p4", title: "aespa Karina · MY WORLD", description: "MY WORLD Karina photocard with no visible marks.", group: "aespa", idol: "Karina", categoryType: "Collab" as CardType, seller: "@minjipc", price: 12.00, date: "2026-04-28", status: "pending", imgGrad: "linear-gradient(135deg,#FFB845,#F4A07C)" },
];

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  delivered: { label: "Delivered", color: MINT, bg: "#EDFAF5" },
  "in transit": { label: "In Transit", color: "#9B82D4", bg: "#F5F0FF" },
  pending: { label: "Pending", color: "#F39C12", bg: "#FFF8E1" },
};

export default function PurchasesScreen() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "delivered" | "in transit" | "pending">("all");
  const [query, setQuery] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedIdols, setSelectedIdols] = useState<string[]>([]);
  const [selectedCategoryTypes, setSelectedCategoryTypes] = useState<CardType[]>([]);

  const displayed = MOCK_PURCHASES.filter(purchase =>
    (filter === "all" || purchase.status === filter) &&
    matchesTrackingFilters(purchase, query, selectedGroups, selectedIdols, selectedCategoryTypes)
  );

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--background)" }}>
      <div className="flex items-center gap-3 px-4 pt-5 pb-3 sticky top-0 z-10" style={{ background: "var(--background)" }}>
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#fff", border: "1px solid #F0D8E8" }}>
          <ArrowLeft size={18} color="#333" />
        </button>
        <h3 style={{ color: "#2d2d2d" }}>Purchases</h3>
      </div>

      {/* Summary card */}
      <div className="mx-4 mb-4 p-4 rounded-2xl" style={{ background: "linear-gradient(135deg,#FFB8D0 0%,#C9A8E0 60%,#B8DEFF 100%)" }}>
        <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.75rem", fontWeight: 600, marginBottom: 6 }}>Total Spent</div>
        <div style={{ color: "#fff", fontWeight: 800, fontSize: "1.6rem" }}>
          ${MOCK_PURCHASES.reduce((s, p) => s + p.price, 0).toFixed(2)}
        </div>
        <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.72rem", marginTop: 2 }}>{MOCK_PURCHASES.length} purchases</div>
      </div>

      <TrackingSearchFilters
        items={MOCK_PURCHASES}
        query={query}
        onQueryChange={setQuery}
        selectedGroups={selectedGroups}
        onGroupToggle={group =>
          setSelectedGroups(current =>
            current.includes(group)
              ? current.filter(value => value !== group)
              : [...current, group]
          )
        }
        selectedIdols={selectedIdols}
        onIdolToggle={idol =>
          setSelectedIdols(current =>
            current.includes(idol)
              ? current.filter(value => value !== idol)
              : [...current, idol]
          )
        }
        selectedCategoryTypes={selectedCategoryTypes}
        onCategoryTypeToggle={categoryType =>
          setSelectedCategoryTypes(current =>
            current.includes(categoryType)
              ? current.filter(value => value !== categoryType)
              : [...current, categoryType]
          )
        }
      />

      {/* Filter chips */}
      <div className="flex gap-2 px-4 mb-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {(["all", "delivered", "in transit", "pending"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full"
            style={{
              background: filter === f ? PRIMARY : "#fff",
              color: filter === f ? "#fff" : "#888",
              border: `1.5px solid ${filter === f ? PRIMARY : "#F0D8E8"}`,
              fontSize: "0.75rem",
              fontWeight: 600,
            }}
          >
            {f === "all" ? "All" : f === "in transit" ? "In Transit" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8 flex flex-col gap-3">
        {displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3" style={{ color: "#ccc" }}>
            <ShoppingBag size={36} strokeWidth={1} />
            <p style={{ fontSize: "0.88rem" }}>No matching purchases</p>
          </div>
        ) : displayed.map(p => {
          const s = STATUS_MAP[p.status];
          return (
            <div key={p.id} className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: "#fff", border: "1px solid #F0D8E8" }}>
              <div className="rounded-xl flex-shrink-0 flex items-center justify-center" style={{ width: 54, height: 72, background: p.imgGrad, fontSize: "1.4rem" }}>🎴</div>
              <div className="flex-1 min-w-0">
                <div style={{ fontWeight: 600, color: "#2d2d2d", fontSize: "0.88rem" }} className="line-clamp-1">{p.title}</div>
                <div style={{ fontSize: "0.72rem", color: "#bbb", marginTop: 2 }}>{p.seller} · {p.date}</div>
                <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color, fontSize: "0.65rem", fontWeight: 700 }}>{s.label}</span>
              </div>
              <div style={{ fontWeight: 700, color: "#2d2d2d", fontSize: "0.95rem", flexShrink: 0 }}>${p.price.toFixed(2)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

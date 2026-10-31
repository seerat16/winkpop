import { useState } from "react";
import { useNavigate } from "../router";
import { ArrowLeft, Star } from "lucide-react";

const PRIMARY = "#D4759A";

const REVIEWS = [
  { id: "1", username: "seoyeontrading", country: "🇰🇷 South Korea", stars: 5, card: "BTS Jimin · Proof", text: "Perfect condition! Packaged so carefully. Would definitely buy again 💕", date: "2026-05-28" },
  { id: "2", username: "pocafan99", country: "🇺🇸 United States", stars: 5, card: "BTS Jungkook · Butter", text: "Super fast shipping and card was exactly as described. Thank you!", date: "2026-05-24" },
  { id: "3", username: "hanaluvspc", country: "🇯🇵 Japan", stars: 4, card: "BTS V · Map of the Soul", text: "Great seller, slight delay in shipping but communicated well.", date: "2026-05-20" },
  { id: "4", username: "minjipc", country: "🇬🇧 United Kingdom", stars: 5, card: "BTS RM · Love Yourself", text: "Card arrived in perfect condition. Seller is trustworthy and responsive!", date: "2026-05-15" },
  { id: "5", username: "armybrasil", country: "🇧🇷 Brazil", stars: 3, card: "BTS Suga · Wings", text: "Card was okay but took longer than expected.", date: "2026-05-10" },
  { id: "6", username: "kpopluver_eu", country: "🇩🇪 Germany", stars: 5, card: "BTS Jin · Proof", text: "Amazing seller! Card was in mint condition and shipped within 24 hours ✨", date: "2026-05-05" },
  { id: "7", username: "trademaster22", country: "🇫🇷 France", stars: 4, card: "BTS J-Hope · Hope World", text: "Smooth transaction. Card was well protected. Would trade again!", date: "2026-04-28" },
  { id: "8", username: "pocaaddict", country: "🇵🇭 Philippines", stars: 5, card: "BTS Taehyung · Butter", text: "10/10! Best trade I've ever done. Card is gorgeous 🥰", date: "2026-04-20" },
];

const TOTAL = REVIEWS.length;
const AVG = (REVIEWS.reduce((a, r) => a + r.stars, 0) / TOTAL).toFixed(1);

export default function ReviewsScreen() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<number | null>(null);
  const displayed = filter ? REVIEWS.filter(r => r.stars === filter) : REVIEWS;

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--background)" }}>
      <div className="flex items-center gap-3 px-4 pt-5 pb-3 sticky top-0 z-10" style={{ background: "var(--background)" }}>
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#fff" }}>
          <ArrowLeft size={18} color="#333" />
        </button>
        <h3 style={{ color: "#2d2d2d" }}>Reviews</h3>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {/* Summary */}
        <div className="p-5 rounded-2xl mb-5" style={{ background: "#fff", border: "1px solid #F0D8E8" }}>
          <div className="flex items-start gap-6">
            <div className="flex flex-col items-center">
              <div style={{ fontSize: "3rem", fontWeight: 900, color: "#2d2d2d", lineHeight: 1 }}>{AVG}</div>
              <div className="flex gap-0.5 mt-1">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={16} color="#FFB845" fill="#FFB845" />)}
              </div>
              <div style={{ fontSize: "0.72rem", color: "#bbb", marginTop: 3 }}>{TOTAL} reviews</div>
            </div>
            <div className="flex-1">
              {[5, 4, 3, 2, 1].map(s => {
                const count = REVIEWS.filter(r => r.stars === s).length;
                return (
                  <div key={s} className="flex items-center gap-2 mb-1">
                    <span style={{ fontSize: "0.72rem", color: "#999", minWidth: 8 }}>{s}</span>
                    <Star size={11} color="#FFB845" fill="#FFB845" />
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "#F0D8E8" }}>
                      <div className="h-full rounded-full" style={{ background: "#FFB845", width: `${(count / TOTAL) * 100}%` }} />
                    </div>
                    <span style={{ fontSize: "0.72rem", color: "#bbb", minWidth: 16 }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4" style={{ scrollbarWidth: "none" }}>
          <button onClick={() => setFilter(null)} className="flex-shrink-0 px-4 py-1.5 rounded-full" style={{ background: filter === null ? PRIMARY : "#fff", color: filter === null ? "#fff" : "#666", border: `1.5px solid ${filter === null ? PRIMARY : "#F0D8E8"}`, fontSize: "0.78rem", fontWeight: 600 }}>All</button>
          {[5, 4, 3, 2, 1].map(s => (
            <button key={s} onClick={() => setFilter(filter === s ? null : s)} className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full" style={{ background: filter === s ? "#FFB845" : "#fff", color: filter === s ? "#fff" : "#666", border: `1.5px solid ${filter === s ? "#FFB845" : "#F0D8E8"}`, fontSize: "0.78rem", fontWeight: 600 }}>
              <Star size={11} color={filter === s ? "#fff" : "#FFB845"} fill={filter === s ? "#fff" : "#FFB845"} />{s}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {displayed.map(r => (
            <div key={r.id} className="p-4 rounded-2xl" style={{ background: "#fff", border: "1px solid #F0D8E8" }}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white flex-shrink-0" style={{ background: "linear-gradient(135deg, #FFB8D0, #C9A8E0)", fontWeight: 700, fontSize: "0.85rem" }}>
                    {r.username[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#333" }}>@{r.username}</div>
                    <div style={{ fontSize: "0.7rem", color: "#bbb" }}>{r.country}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={12} color={i < r.stars ? "#FFB845" : "#E0E0E0"} fill={i < r.stars ? "#FFB845" : "none"} />)}
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "#bbb" }}>{r.date}</div>
                </div>
              </div>
              <div style={{ fontSize: "0.7rem", color: PRIMARY, fontWeight: 600, marginBottom: 4 }}>{r.card}</div>
              <p style={{ fontSize: "0.82rem", color: "#555", lineHeight: 1.5 }}>{r.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

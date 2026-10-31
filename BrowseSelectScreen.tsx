import { useState } from "react";
import { useNavigate, useSearchParams } from "../router";
import { ArrowLeft, Check, ChevronRight, Search } from "lucide-react";
import { PHOTOCARDS, GROUPS, MEMBERS } from "../data/mockData";
import { PhotocardImage } from "../components/PhotocardImage";

const PRIMARY = "#D4759A";
const RESULT_KEY = "barter_select_result";
const PENDING_KEY = "barter_select_pending";

type Mode = "type" | "trade" | "likes" | "wishlist" | "collection" | "cart";

const MODE_CONFIG: Record<Mode, { title: string; multi: boolean; action: string }> = {
  type:       { title: "Select Photocard Type",         multi: false, action: "Select" },
  trade:      { title: "Select Cards to Trade For",     multi: true,  action: "Add to Trade" },
  likes:      { title: "Add to Likes",                   multi: true,  action: "Add to Likes" },
  wishlist:   { title: "Add to Likes",                   multi: true,  action: "Add to Likes" },
  collection: { title: "Add to Collection",             multi: true,  action: "Add to Collection" },
  cart:       { title: "Add to Cart",                   multi: true,  action: "Add to Cart" },
};

export default function BrowseSelectScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = (searchParams.get("mode") || "trade") as Mode;
  const config = MODE_CONFIG[mode] || MODE_CONFIG.trade;

  const [view, setView] = useState<"groups" | "cards">("groups");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const filteredGroups = GROUPS.filter(g =>
    search === "" || g.name.toLowerCase().includes(search.toLowerCase())
  );

  const groupMembers = selectedGroup ? (MEMBERS[selectedGroup] || []) : [];
  const cards = PHOTOCARDS.filter(c => {
    if (selectedGroup && c.groupId !== selectedGroup) return false;
    if (selectedMember && c.memberId !== selectedMember) return false;
    if (view === "cards" && search) {
      const q = search.toLowerCase();
      return c.memberName.toLowerCase().includes(q) || c.era.toLowerCase().includes(q);
    }
    return true;
  });

  const toggleCard = (id: string) => {
    if (config.multi) {
      setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    } else {
      setSelectedIds([id]);
    }
  };

  const handleDone = () => {
    localStorage.setItem(RESULT_KEY, JSON.stringify({ mode, cardIds: selectedIds }));
    localStorage.removeItem(PENDING_KEY);
    navigate(-1);
  };

  const handleBack = () => {
    if (view === "cards" && selectedMember) {
      setSelectedMember(null);
      setSearch("");
    } else if (view === "cards") {
      setView("groups");
      setSelectedGroup(null);
      setSearch("");
    } else {
      localStorage.removeItem(PENDING_KEY);
      navigate(-1);
    }
  };

  const groupForDisplay = selectedGroup ? GROUPS.find(g => g.id === selectedGroup) : null;

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3 sticky top-0 z-10" style={{ background: "var(--background)" }}>
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#fff", border: "1px solid #F0D8E8" }}>
            <ArrowLeft size={18} color="#333" />
          </button>
          <div>
            <div style={{ fontWeight: 700, color: "#2d2d2d", fontSize: "0.95rem" }}>{config.title}</div>
            {view === "cards" && groupForDisplay && (
              <div style={{ fontSize: "0.72rem", color: PRIMARY }}>
                {groupForDisplay.name}
                {selectedMember && ` · ${groupMembers.find(m => m.id === selectedMember)?.name}`}
              </div>
            )}
          </div>
        </div>
        {selectedIds.length > 0 && (
          <button
            onClick={handleDone}
            className="px-4 py-1.5 rounded-full"
            style={{ background: PRIMARY, color: "#fff", fontSize: "0.82rem", fontWeight: 700 }}
          >
            Done{config.multi ? ` (${selectedIds.length})` : ""}
          </button>
        )}
      </div>

      {/* Search bar */}
      <div className="px-4 mb-3">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: "#fff", border: "1.5px solid #F0D8E8" }}>
          <Search size={14} color="#bbb" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={view === "groups" ? "Search groups…" : "Search cards…"}
            className="flex-1 outline-none bg-transparent"
            style={{ fontSize: "0.85rem" }}
          />
        </div>
      </div>

      {/* Groups view */}
      {view === "groups" && (
        <div className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col gap-2">
          {filteredGroups.map(group => (
            <button
              key={group.id}
              onClick={() => { setSelectedGroup(group.id); setView("cards"); setSearch(""); }}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-left"
              style={{ background: "#fff", border: "1px solid #F0D8E8" }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: group.color, color: "#fff", fontWeight: 700, fontSize: "0.7rem" }}>
                {group.abbr}
              </div>
              <div className="flex-1">
                <div style={{ fontWeight: 600, color: "#2d2d2d", fontSize: "0.9rem" }}>{group.name}</div>
                <div style={{ fontSize: "0.7rem", color: "#bbb" }}>
                  {(MEMBERS[group.id] || []).length} members · {PHOTOCARDS.filter(c => c.groupId === group.id).length} cards
                </div>
              </div>
              <ChevronRight size={16} color="#ccc" />
            </button>
          ))}
        </div>
      )}

      {/* Cards view */}
      {view === "cards" && (
        <div className="flex-1 overflow-y-auto pb-24">
          {/* Member filter strip */}
          <div className="flex gap-2 px-4 mb-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            <button
              onClick={() => setSelectedMember(null)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full"
              style={{ background: selectedMember === null ? PRIMARY : "#fff", color: selectedMember === null ? "#fff" : "#888", border: `1.5px solid ${selectedMember === null ? PRIMARY : "#F0D8E8"}`, fontSize: "0.75rem", fontWeight: 600 }}
            >
              All
            </button>
            {groupMembers.map(m => (
              <button
                key={m.id}
                onClick={() => setSelectedMember(selectedMember === m.id ? null : m.id)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full"
                style={{ background: selectedMember === m.id ? m.color : "#fff", color: selectedMember === m.id ? "#fff" : "#888", border: `1.5px solid ${selectedMember === m.id ? m.color : "#F0D8E8"}`, fontSize: "0.75rem", fontWeight: 600 }}
              >
                {m.name}
              </button>
            ))}
          </div>

          {/* Card grid */}
          <div className="px-4 grid grid-cols-3 gap-2">
            {cards.map(card => {
              const isSelected = selectedIds.includes(card.id);
              return (
                <button
                  key={card.id}
                  onClick={() => toggleCard(card.id)}
                  className="relative rounded-xl overflow-hidden text-left"
                  style={{ border: `2px solid ${isSelected ? PRIMARY : "#F0D8E8"}`, background: "#fff" }}
                >
                  <PhotocardImage groupId={card.groupId} memberId={card.memberId} memberName={card.memberName} imgSeed={card.imgSeed} databaseImageFilename={card.databaseImageFilename} uploadImageFilename={card.uploadImageFilename} className="w-full" style={{ aspectRatio: "3/4.5" } as any} />
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: PRIMARY }}>
                      <Check size={11} color="#fff" strokeWidth={3} />
                    </div>
                  )}
                  <div className="p-1.5">
                    <div style={{ fontSize: "0.6rem", color: PRIMARY, fontWeight: 600 }} className="line-clamp-1">{card.memberName}</div>
                    <div style={{ fontSize: "0.58rem", color: "#888" }} className="line-clamp-1">{card.era}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Done button */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-4 pb-6 pt-3" style={{ background: "linear-gradient(transparent, var(--background) 30%)" }}>
          <button
            onClick={handleDone}
            className="w-full py-3.5 rounded-2xl"
            style={{ background: "linear-gradient(135deg, #E880A4 0%, #C9A8E0 60%, #7BBFEA 100%)", color: "#fff", fontWeight: 700, fontSize: "1rem" }}
          >
            {config.action}{config.multi ? ` · ${selectedIds.length} selected` : ""}
          </button>
        </div>
      )}
    </div>
  );
}

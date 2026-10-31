import { useState } from "react";
import { useNavigate, useParams } from "../router";
import { ArrowLeft, UserX, SlidersHorizontal, X } from "lucide-react";
import { GROUP_MAP } from "../data/groupData";
import { PHOTOCARDS, CARD_TYPES, GROUP_ERAS, type CardType } from "../data/mockData";
import { PhotocardImage } from "../components/PhotocardImage";

export default function GroupDetailScreen() {
  const navigate = useNavigate();
  const params = useParams();
  const groupId = params.id as string;
  const group = GROUP_MAP[groupId];

  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [selectedEra, setSelectedEra] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<CardType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p style={{ color: "#999" }}>Group not found</p>
        <button onClick={() => navigate(-1)} style={{ color: "#D4759A" }}>Go back</button>
      </div>
    );
  }

  const activeMembers = group.members.filter(m => !m.former);
  const formerMembers = group.members.filter(m => m.former);

  // Filter photocards for this specific group only
  const groupCards = PHOTOCARDS.filter(c => c.groupId === groupId);
  const filteredCards = groupCards.filter(card => {
    if (selectedMember && card.memberId !== selectedMember) return false;
    if (selectedEra && card.era !== selectedEra) return false;
    if (selectedTypes.length > 0 && !selectedTypes.includes(card.type)) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        card.title.toLowerCase().includes(query) ||
        card.memberName.toLowerCase().includes(query) ||
        card.era.toLowerCase().includes(query) ||
        card.type.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Era label → just the name before the year for display
  const eraLabel = (era: string) => era.replace(/\s*\(\d{4}\)$/, "");

  const toggleType = (t: CardType) =>
    setSelectedTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const activeFilterCount = (selectedTypes.length > 0 ? 1 : 0);

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 pt-5 pb-4"
        style={{ background: group.color + "18", borderBottom: `3px solid ${group.color}30` }}
      >
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "#fff" }}
        >
          <ArrowLeft size={18} color="#333" />
        </button>
        <div className="flex-1">
          <h2 style={{ color: "#2d2d2d" }}>{group.name}</h2>
          <div style={{ fontSize: "0.72rem", color: "#999" }}>
            {group.gender === "girl" ? "Girl Group" : "Boy Group"} · {group.generation}G · {group.company} · Debut {group.debutYear}
          </div>
        </div>
        <div
          className="px-3 py-1 rounded-full"
          style={{ background: group.color, color: "#fff", fontSize: "0.7rem", fontWeight: 700 }}
        >
          {group.abbr}
        </div>
      </div>

      {/* Members — horizontal scroll, top section */}
      <div style={{ background: "#fff", borderBottom: "1px solid #F0D8E8", flexShrink: 0 }}>
        <div className="px-4 pt-3 pb-1" style={{ fontSize: "0.72rem", color: "#999", fontWeight: 600 }}>
          MEMBERS
        </div>
        <div className="flex gap-3 px-4 pb-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {/* "All" pill */}
          <button
            onClick={() => setSelectedMember(null)}
            className="flex-shrink-0 flex flex-col items-center gap-1.5"
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: selectedMember === null ? group.color : "#f5f5f5",
                border: selectedMember === null ? `3px solid ${group.color}` : "3px solid transparent",
              }}
            >
              <span style={{ fontSize: "0.6rem", fontWeight: 700, color: selectedMember === null ? "#fff" : "#999" }}>ALL</span>
            </div>
            <span style={{ fontSize: "0.62rem", color: selectedMember === null ? group.color : "#999", fontWeight: 600 }}>All</span>
          </button>

          {activeMembers.map(member => {
            const isSelected = selectedMember === member.id;
            const initials = member.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
            return (
              <button
                key={member.id}
                onClick={() => setSelectedMember(isSelected ? null : member.id)}
                className="flex-shrink-0 flex flex-col items-center gap-1.5"
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{
                    background: isSelected ? group.color : group.color + "20",
                    border: `3px solid ${isSelected ? group.color : "transparent"}`,
                    color: isSelected ? "#fff" : group.color,
                    fontWeight: 700,
                    fontSize: "0.75rem",
                  }}
                >
                  {initials}
                </div>
                <span
                  style={{
                    fontSize: "0.62rem",
                    color: isSelected ? group.color : "#666",
                    fontWeight: isSelected ? 700 : 500,
                    maxWidth: 56,
                    textAlign: "center",
                    lineHeight: 1.2,
                  }}
                  className="line-clamp-2"
                >
                  {member.name}
                </span>
              </button>
            );
          })}

          {/* Former members */}
          {formerMembers.length > 0 && (
            <>
              <div className="flex-shrink-0 w-px self-stretch my-1" style={{ background: "#F0D8E8" }} />
              {formerMembers.map(member => {
                const isSelected = selectedMember === member.id;
                const initials = member.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <button
                    key={member.id}
                    onClick={() => setSelectedMember(isSelected ? null : member.id)}
                    className="flex-shrink-0 flex flex-col items-center gap-1.5"
                  >
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center relative"
                      style={{
                        background: isSelected ? "#999" : "#f0f0f0",
                        border: `3px solid ${isSelected ? "#999" : "transparent"}`,
                        color: isSelected ? "#fff" : "#aaa",
                        fontWeight: 700,
                        fontSize: "0.75rem",
                      }}
                    >
                      {initials}
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "#fff" }}>
                        <UserX size={10} color="#aaa" />
                      </div>
                    </div>
                    <span style={{ fontSize: "0.62rem", color: "#bbb", fontWeight: 500, maxWidth: 56, textAlign: "center", lineHeight: 1.2 }} className="line-clamp-2">
                      {member.name}
                    </span>
                    <span style={{ fontSize: "0.55rem", color: "#ccc", marginTop: -4 }}>
                      {member.formerNote}
                    </span>
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* Eras — scrollable bubbles, takes lower half */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4">
        <div className="flex items-center justify-between mb-3">
          <span style={{ fontSize: "0.72rem", color: "#999", fontWeight: 600 }}>ERAS</span>
          <div className="flex items-center gap-2">
            {/* Search input */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: "#fff", border: "1.5px solid #F0D8E8", maxWidth: 160 }}>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search cards..."
                className="flex-1 outline-none bg-transparent"
                style={{ fontSize: "0.72rem", color: "#333", minWidth: 0 }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}>
                  <X size={12} color="#ccc" />
                </button>
              )}
            </div>
            {/* Filter button */}
            <button
              onClick={() => setShowFilters(true)}
              className="relative w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: showFilters || activeFilterCount > 0 ? "#D4759A" : "#fff", border: "1.5px solid #F0D8E8" }}
            >
              <SlidersHorizontal size={14} color={showFilters || activeFilterCount > 0 ? "#fff" : "#555"} />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center" style={{ background: "#333", color: "#fff", fontSize: "8px", fontWeight: 700 }}>
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {[...group.eras].reverse().map(era => {
            const isSelected = selectedEra === era;
            return (
              <button
                key={era}
                onClick={() => setSelectedEra(isSelected ? null : era)}
                className="px-4 py-2.5 rounded-2xl"
                style={{
                  background: isSelected ? group.color : "#fff",
                  border: `2px solid ${isSelected ? group.color : group.color + "40"}`,
                  transition: "all 0.15s",
                  minWidth: "fit-content",
                }}
              >
                <span
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? "#fff" : "#333",
                  }}
                >
                  {eraLabel(era)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active filters summary */}
        {(selectedMember || selectedEra || selectedTypes.length > 0) && (
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span style={{ fontSize: "0.72rem", color: "#999" }}>Showing:</span>
            {selectedMember && (
              <span
                className="px-2.5 py-1 rounded-full"
                style={{ background: group.color + "18", color: group.color, fontSize: "0.72rem", fontWeight: 600 }}
              >
                {group.members.find(m => m.id === selectedMember)?.name}
              </span>
            )}
            {selectedEra && (
              <span
                className="px-2.5 py-1 rounded-full"
                style={{ background: group.color + "18", color: group.color, fontSize: "0.72rem", fontWeight: 600 }}
              >
                {eraLabel(selectedEra)}
              </span>
            )}
            {selectedTypes.map(t => (
              <span
                key={t}
                className="px-2.5 py-1 rounded-full"
                style={{ background: group.color + "18", color: group.color, fontSize: "0.72rem", fontWeight: 600 }}
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Photocard grid */}
        <div style={{ fontSize: "0.72rem", color: "#999", fontWeight: 600, marginBottom: 10 }}>PHOTOCARDS</div>
        {filteredCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3" style={{ color: "#ccc" }}>
            <p style={{ fontSize: "0.88rem" }}>No photocards found for this filter</p>
            <button
              onClick={() => { setSelectedMember(null); setSelectedEra(null); setSelectedTypes([]); }}
              className="px-4 py-2 rounded-xl"
              style={{ background: "#D4759A", color: "#fff", fontWeight: 600, fontSize: "0.82rem" }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {filteredCards.map(card => (
              <div
                key={card.id}
                className="rounded-xl overflow-hidden cursor-pointer"
                style={{ border: "1px solid #F0D8E8", background: "#fff" }}
                onClick={() => navigate(`/card/${card.id}`)}
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
                <div className="p-1.5">
                  <div style={{ fontSize: "0.6rem", color: group.color, fontWeight: 600 }}>{card.memberName}</div>
                  <div style={{ fontSize: "0.58rem", color: "#999" }} className="line-clamp-1">{card.era}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter Modal */}
      {showFilters && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setShowFilters(false)}>
          <div
            className="rounded-t-3xl p-5 max-w-md w-full mx-auto flex flex-col"
            style={{ background: "#fff", maxHeight: "70vh" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 style={{ color: "#2d2d2d" }}>Filter by Type</h3>
              <button onClick={() => setShowFilters(false)}><X size={20} color="#aaa" /></button>
            </div>

            {/* Type */}
            <div className="mb-5 flex-1 overflow-y-auto">
              <h4 style={{ color: "#333", marginBottom: 12 }}>Card Type</h4>
              <div className="flex flex-wrap gap-2">
                {CARD_TYPES.map(t => (
                  <button
                    key={t}
                    onClick={() => toggleType(t)}
                    className="px-3 py-1.5 rounded-full"
                    style={{
                      background: selectedTypes.includes(t) ? group.color : "#f5f5f5",
                      color: selectedTypes.includes(t) ? "#fff" : "#555",
                      fontSize: "0.78rem", fontWeight: 500,
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-3" style={{ borderTop: "1px solid #f0f0f0" }}>
              <button
                onClick={() => { setSelectedTypes([]); }}
                className="flex-1 py-3 rounded-xl"
                style={{ border: "1.5px solid #F0D8E8", color: "#666", fontWeight: 600, fontSize: "0.88rem" }}
              >
                Reset
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="flex-1 py-3 rounded-xl"
                style={{ background: group.color, color: "#fff", fontWeight: 700, fontSize: "0.88rem" }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
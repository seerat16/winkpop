import { useState, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "../router";
import { Search, SlidersHorizontal, Heart, X, ChevronDown, Users, ShoppingCart } from "lucide-react";
import { PHOTOCARDS, GROUPS, MEMBERS, CARD_TYPES, type CardType } from "../data/mockData";
import { GROUP_MAP } from "../data/groupData";
import { GROUPS_DATA } from "../data/groupData";
import { PhotocardImage } from "../components/PhotocardImage";
import { getCurrentUser, addToLikes, removeFromLikes, addToCart, removeFromCart } from "../data/userStore";
import { toast } from "sonner";
import { StoriesRow } from "../components/StoriesRow";
import { saveUploadedStory, type Story } from "../data/storiesStore";
import { ShareToAccount } from "../components/ShareToAccount";

const PRICE_RANGES = [
  { label: "All Prices", min: 0, max: Infinity },
  { label: "Under $5", min: 0, max: 5 },
  { label: "$5 – $20", min: 5, max: 20 },
  { label: "$20 – $50", min: 20, max: 50 },
  { label: "$50+", min: 50, max: Infinity },
];

export default function BrowseScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialGroup = searchParams.get("group") || "all";
  const storyInputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState(initialGroup);
  const [activeMember, setActiveMember] = useState("all");
  const [activeEra, setActiveEra] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState(0);
  const [selectedTypes, setSelectedTypes] = useState<CardType[]>([]);
  const [hideOutOfStock, setHideOutOfStock] = useState(false);
  const [sort, setSort] = useState<"popular" | "price_asc" | "price_desc" | "new">(
    (searchParams.get("sort") as any) || "popular"
  );
  const [wishlist, setWishlist] = useState<string[]>(getCurrentUser()?.likesIds || []);
  const [cartIds, setCartIds] = useState<string[]>(getCurrentUser()?.cartIds || []);
  const [browseMode, setBrowseMode] = useState<"cards" | "groups">("groups");
  const [groupGender, setGroupGender] = useState<"all" | "girl" | "boy">("all");
  const [groupGen, setGroupGen] = useState<"all" | 2 | 3 | 4 | 5>("all");

  const members = activeGroup !== "all" ? (MEMBERS[activeGroup] || []) : [];
  // eras newest→oldest in groupData; reverse to show oldest→newest for filter UX
  const eras = activeGroup !== "all" ? ([...(GROUP_MAP[activeGroup]?.eras || [])].reverse()) : [];

  const filteredGroups = GROUPS_DATA.filter(g => {
    if (groupGender !== "all" && g.gender !== groupGender) return false;
    if (groupGen !== "all" && g.generation !== (groupGen as number)) return false;
    return true;
  });

  const filtered = useMemo(() => {
    let cards = PHOTOCARDS;
    if (activeGroup !== "all") cards = cards.filter(c => c.groupId === activeGroup);
    if (activeMember !== "all") cards = cards.filter(c => c.memberId === activeMember);
    if (activeEra !== "all") cards = cards.filter(c => c.era === activeEra);
    if (query) cards = cards.filter(c =>
      c.memberName.toLowerCase().includes(query.toLowerCase()) ||
      c.era.toLowerCase().includes(query.toLowerCase()) ||
      c.groupName.toLowerCase().includes(query.toLowerCase()) ||
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.type.toLowerCase().includes(query.toLowerCase())
    );
    if (hideOutOfStock) cards = cards.filter(c => c.available);
    const range = PRICE_RANGES[priceRange];
    cards = cards.filter(c => c.price >= range.min && c.price < range.max);
    if (selectedTypes.length > 0) cards = cards.filter(c => selectedTypes.includes(c.type));
    if (sort === "popular") cards = [...cards].sort((a, b) => b.popularity - a.popularity);
    if (sort === "price_asc") cards = [...cards].sort((a, b) => a.price - b.price);
    if (sort === "price_desc") cards = [...cards].sort((a, b) => b.price - a.price);
    return cards;
  }, [activeGroup, activeMember, activeEra, query, hideOutOfStock, priceRange, selectedTypes, sort]);

  const toggleType = (t: CardType) =>
    setSelectedTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const toggleWishlist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (wishlist.includes(id)) {
      removeFromLikes(id);
      setWishlist(prev => prev.filter(i => i !== id));
    } else {
      addToLikes(id);
      setWishlist(prev => [...prev, id]);
    }
  };

  const toggleCart = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (cartIds.includes(id)) {
      removeFromCart(id);
      setCartIds(prev => prev.filter(i => i !== id));
      toast("Removed from cart");
    } else {
      addToCart(id);
      setCartIds(prev => [...prev, id]);
      toast.success("Added to cart!");
    }
  };

  const activeFilterCount = (priceRange !== 0 ? 1 : 0) + selectedTypes.length + (hideOutOfStock ? 1 : 0);
  const currentUser = getCurrentUser();

  const handleStoryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      const story: Story = {
        id: `user-${Date.now()}`,
        userId: currentUser.email,
        username: currentUser.username || currentUser.displayName || "me",
        avatarColor: "#7B3FA8",
        avatarBase64: currentUser.avatarBase64 ?? undefined,
        imageBase64: base64,
        timestamp: Date.now(),
        viewed: false,
      };
      saveUploadedStory(story);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="flex flex-col" style={{ minHeight: "100vh", background: "var(--background)" }}>
      {/* Sticky header — stories + search + filters */}
      <div className="sticky top-0 z-20" style={{ background: "var(--background)" }}>

        {/* Stories row */}
        <StoriesRow onAddStory={() => storyInputRef.current?.click()} />
        <input
          ref={storyInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleStoryUpload}
        />

        {/* Search + filters */}
        <div className="px-4 pt-3 pb-3">
        {/* Search */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: "var(--card)", border: "1.5px solid var(--border)" }}>
            <Search size={15} color="#ccc" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search photocards..."
              className="flex-1 outline-none bg-transparent"
              style={{ fontSize: "0.88rem", color: "#333" }}
            />
            {query && <button onClick={() => setQuery("")}><X size={14} color="#ccc" /></button>}
          </div>
          <button
            onClick={() => navigate("/cart")}
            className="relative w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "#fff", border: "1.5px solid #F0D8E8" }}
          >
            <ShoppingCart size={16} color="#555" />
            {cartIds.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "#D4759A", color: "#fff", fontSize: "9px", fontWeight: 700 }}>
                {cartIds.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowFilters(true)}
            className="relative w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: showFilters || activeFilterCount > 0 ? "#D4759A" : "#fff", border: "1.5px solid #F0D8E8" }}
          >
            <SlidersHorizontal size={16} color={showFilters || activeFilterCount > 0 ? "#fff" : "#555"} />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "#333", color: "#fff", fontSize: "9px", fontWeight: 700 }}>
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-1 mb-3" style={{ background: "#F5E5EE", borderRadius: 10, padding: 3 }}>
          {(["groups", "cards"] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setBrowseMode(mode)}
              className="flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5"
              style={{
                background: browseMode === mode ? "#fff" : "transparent",
                color: browseMode === mode ? "#D4759A" : "#999",
                fontWeight: 600, fontSize: "0.82rem",
              }}
            >
              {mode === "groups" ? <><Users size={13} />Groups</> : <><Search size={13} />Photocards</>}
            </button>
          ))}
        </div>

        {/* Group tabs — only in cards mode */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none", display: browseMode === "cards" ? undefined : "none" }}>
          <button
            onClick={() => { setActiveGroup("all"); setActiveMember("all"); setActiveEra("all"); }}
            className="flex-shrink-0 px-3 py-1.5 rounded-full"
            style={{
              background: activeGroup === "all" ? "#D4759A" : "#fff",
              color: activeGroup === "all" ? "#fff" : "#555",
              fontSize: "0.75rem", fontWeight: 600,
              border: "1.5px solid #F0D8E8",
            }}
          >
            All
          </button>
          {GROUPS.map(g => (
            <button
              key={g.id}
              onClick={() => { setActiveGroup(g.id); setActiveMember("all"); setActiveEra("all"); }}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{
                background: activeGroup === g.id ? g.color : "#fff",
                color: activeGroup === g.id ? "#fff" : "#555",
                fontSize: "0.75rem", fontWeight: 600,
                border: `1.5px solid ${activeGroup === g.id ? g.color : "#F0D8E8"}`,
              }}
            >
              {g.name}
            </button>
          ))}
        </div>

        {/* Member tabs — cards mode only */}
        {browseMode === "cards" && members.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pt-2 pb-0.5" style={{ scrollbarWidth: "none" }}>
            <button
              onClick={() => setActiveMember("all")}
              className="flex-shrink-0 px-3 py-1 rounded-full"
              style={{
                background: activeMember === "all" ? "#333" : "#f5f5f5",
                color: activeMember === "all" ? "#fff" : "#777",
                fontSize: "0.72rem", fontWeight: 500,
              }}
            >
              All Members
            </button>
            {members.map(m => (
              <button
                key={m.id}
                onClick={() => setActiveMember(m.id)}
                className="flex-shrink-0 px-3 py-1 rounded-full"
                style={{
                  background: activeMember === m.id ? m.color : "#f5f5f5",
                  color: activeMember === m.id ? "#fff" : "#777",
                  fontSize: "0.72rem", fontWeight: 500,
                }}
              >
                {m.name}
              </button>
            ))}
          </div>
        )}

        {/* Era tabs — cards mode, when a group with eras is selected */}
        {browseMode === "cards" && eras.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pt-2 pb-0.5" style={{ scrollbarWidth: "none" }}>
            <button
              onClick={() => setActiveEra("all")}
              className="flex-shrink-0 px-3 py-1 rounded-full"
              style={{
                background: activeEra === "all" ? "#333" : "#f5f5f5",
                color: activeEra === "all" ? "#fff" : "#777",
                fontSize: "0.72rem", fontWeight: 500,
              }}
            >
              All Eras
            </button>
            {eras.map(era => (
              <button
                key={era}
                onClick={() => setActiveEra(era)}
                className="flex-shrink-0 px-3 py-1 rounded-full"
                style={{
                  background: activeEra === era ? "#D4759A" : "#f5f5f5",
                  color: activeEra === era ? "#fff" : "#777",
                  fontSize: "0.72rem", fontWeight: 500,
                  border: activeEra === era ? "none" : "1px solid #f0e0e8",
                }}
              >
                {era}
              </button>
            ))}
          </div>
        )}

        {/* Sort & count — cards mode only */}
        <div className="flex items-center justify-between mt-2.5" style={{ display: browseMode === "cards" ? undefined : "none" }}>
          <span style={{ fontSize: "0.8rem", color: "#999" }}>
            Total <span style={{ fontWeight: 700, color: "#333" }}>{filtered.length.toLocaleString()}</span>
          </span>
          <button
            onClick={() => {
              const opts: typeof sort[] = ["popular", "new", "price_asc", "price_desc"];
              const idx = opts.indexOf(sort);
              setSort(opts[(idx + 1) % opts.length]);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg"
            style={{ background: "#fff", border: "1.5px solid #F0D8E8", fontSize: "0.75rem", color: "#555", fontWeight: 500 }}
          >
            {sort === "popular" ? "Popular" : sort === "new" ? "Newest" : sort === "price_asc" ? "Price ↑" : "Price ↓"}
            <ChevronDown size={12} />
          </button>
        </div>
        </div> {/* end search+filters inner */}
      </div> {/* end sticky outer */}

      {/* Groups grid */}
      {browseMode === "groups" && (
        <div className="px-4 pb-4 pt-1">
          {/* Filters row */}
          <div className="flex gap-2 mb-3 flex-wrap">
            {(["all", "girl", "boy"] as const).map(g => (
              <button
                key={g}
                onClick={() => setGroupGender(g)}
                className="px-3 py-1.5 rounded-full"
                style={{
                  background: groupGender === g ? "#D4759A" : "#fff",
                  color: groupGender === g ? "#fff" : "#666",
                  border: "1.5px solid #F0D8E8",
                  fontSize: "0.75rem", fontWeight: 600,
                }}
              >
                {g === "all" ? "All" : g === "girl" ? "Girl Groups" : "Boy Groups"}
              </button>
            ))}
          </div>
          <div className="flex gap-2 mb-4 flex-wrap">
            {(["all", 2, 3, 4, 5] as const).map(g => (
              <button
                key={String(g)}
                onClick={() => setGroupGen(g as any)}
                className="px-3 py-1.5 rounded-full"
                style={{
                  background: groupGen === g ? "#2d2d2d" : "#fff",
                  color: groupGen === g ? "#fff" : "#666",
                  border: "1.5px solid #F0D8E8",
                  fontSize: "0.75rem", fontWeight: 600,
                }}
              >
                {g === "all" ? "All Gens" : `${g}${g === 2 ? "nd" : g === 3 ? "rd" : "th"} Gen`}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            {(groupGen === "all"
              ? ([2, 3, 4, 5] as const).filter(gen => filteredGroups.some(g => g.generation === gen))
              : [groupGen]
            ).map(gen => {
              const genGroups = filteredGroups.filter(g => g.generation === gen);
              if (genGroups.length === 0) return null;
              return (
                <div key={gen}>
                  {groupGen === "all" && (
                    <div className="flex items-center gap-2 mb-2 mt-1">
                      <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#999", letterSpacing: "0.05em" }}>
                        {gen}{gen === 2 ? "ND" : gen === 3 ? "RD" : "TH"} GENERATION
                      </span>
                      <div className="flex-1 h-px" style={{ background: "#F0D8E8" }} />
                    </div>
                  )}
                  {genGroups.map(group => (
              <button
                key={group.id}
                onClick={() => navigate(`/group/${group.id}`)}
                className="flex items-center gap-4 p-4 rounded-2xl text-left"
                style={{ background: "#fff", border: `1.5px solid ${group.color}30` }}
              >
                {/* Color swatch / initial */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${group.color}, ${group.color}99)` }}
                >
                  <span style={{ color: "#fff", fontWeight: 800, fontSize: "0.65rem", textAlign: "center", lineHeight: 1.2, padding: "0 4px" }}>
                    {group.abbr}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span style={{ fontWeight: 700, color: "#2d2d2d", fontSize: "0.95rem" }}>{group.name}</span>
                    <span
                      className="px-2 py-0.5 rounded-full"
                      style={{
                        background: group.gender === "girl" ? "#FF6B9D18" : "#3498DB18",
                        color: group.gender === "girl" ? "#FF6B9D" : "#3498DB",
                        fontSize: "0.58rem", fontWeight: 700,
                      }}
                    >
                      {group.gender === "girl" ? "GG" : "BG"}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-full"
                      style={{ background: "#f5f5f5", color: "#999", fontSize: "0.58rem", fontWeight: 600 }}
                    >
                      {group.generation}G
                    </span>
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#999", marginTop: 2 }}>
                    {group.company} · Debut {group.debutYear}
                  </div>
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    {group.members.filter(m => !m.former).slice(0, 5).map(m => (
                      <span key={m.id} className="px-2 py-0.5 rounded-full" style={{ background: group.color + "15", color: group.color, fontSize: "0.6rem", fontWeight: 600 }}>
                        {m.name}
                      </span>
                    ))}
                    {group.members.filter(m => !m.former).length > 5 && (
                      <span className="px-2 py-0.5 rounded-full" style={{ background: "#f5f5f5", color: "#999", fontSize: "0.6rem" }}>
                        +{group.members.filter(m => !m.former).length - 5}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span style={{ fontSize: "0.72rem", color: group.color, fontWeight: 700 }}>
                    {group.members.filter(m => !m.former).length}
                  </span>
                  <span style={{ fontSize: "0.6rem", color: "#bbb" }}>
                    members
                  </span>
                </div>
              </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cards Grid */}
      {browseMode === "cards" && <div className="px-4 pb-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20" style={{ color: "#ccc" }}>
            <div style={{ fontSize: "3rem" }}>🔍</div>
            <p style={{ marginTop: 8, fontSize: "0.9rem" }}>No cards found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(card => (
              <div
                key={card.id}
                className="rounded-2xl overflow-hidden text-left cursor-pointer"
                style={{ background: "#fff", border: "1px solid #F0D8E8", opacity: card.available ? 1 : 0.6 }}
              >
                <div className="relative" onClick={() => navigate(`/card/${card.id}`)}>
                  <PhotocardImage
                    groupId={card.groupId}
                    memberId={card.memberId}
                    memberName={card.memberName}
                    imgSeed={card.imgSeed}
                    databaseImageFilename={card.databaseImageFilename}
                    uploadImageFilename={card.uploadImageFilename}
                    imageMode="upload"
                    className="w-full"
                    style={{ aspectRatio: "3/4.5" } as any}
                  />
                  {!card.available && (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.35)" }}>
                      <span style={{ color: "#fff", fontWeight: 700, fontSize: "0.75rem", background: "rgba(0,0,0,0.5)", padding: "3px 8px", borderRadius: 6 }}>SOLD OUT</span>
                    </div>
                  )}
                  {card.damaged && (
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded" style={{ background: "#F4A07C", color: "#fff", fontSize: "8px", fontWeight: 700 }}>⚠ DMG</div>
                  )}
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.85)", fontSize: "0.65rem", color: "#555", fontWeight: 600 }}>
                    {card.type}
                  </div>
                  <div className="absolute right-2 top-2 flex gap-1">
                    <ShareToAccount
                      itemType="listing"
                      itemTitle={`${card.groupName} ${card.memberName} · ${card.era}`}
                      itemPath={`/card/${card.id}`}
                      compact
                    />
                    <button
                      onClick={e => toggleCart(card.id, e)}
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: cartIds.includes(card.id) ? "#5CC0A8" : "rgba(255,255,255,0.92)" }}
                    >
                      <ShoppingCart size={11} color={cartIds.includes(card.id) ? "#fff" : "#888"} />
                    </button>
                    <button
                      onClick={e => toggleWishlist(card.id, e)}
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(255,255,255,0.92)" }}
                    >
                      <Heart size={11} color={wishlist.includes(card.id) ? "#D4759A" : "#999"} fill={wishlist.includes(card.id) ? "#D4759A" : "none"} />
                    </button>
                  </div>
                </div>
                
                <div className="p-2.5" onClick={() => navigate(`/card/${card.id}`)}>
                  <div style={{ fontSize: "0.65rem", color: "#D4759A", fontWeight: 700 }}>{card.memberName}</div>
                  <div style={{ fontSize: "0.68rem", color: "#777", marginTop: 1 }} className="line-clamp-1">{card.era}</div>
                  <div style={{ fontWeight: 700, color: "#2d2d2d", fontSize: "0.9rem", marginTop: 3 }}>
                    ${card.price.toFixed(2)} <span style={{ color: "#999", fontSize: "0.7rem", fontWeight: 400 }}>USD</span>
                  </div>
                  {card.sellerUsername && (
                    <div style={{ fontSize: "0.62rem", color: "#bbb", marginTop: 2 }}>@{card.sellerUsername}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>}

      {/* Filter Modal */}
      {showFilters && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setShowFilters(false)}>
          <div
            className="rounded-t-3xl p-5 max-w-md w-full mx-auto"
            style={{ background: "#fff", maxHeight: "90vh", overflowY: "auto", paddingBottom: "80px" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 style={{ color: "#2d2d2d" }}>Filters</h3>
              <button onClick={() => setShowFilters(false)}><X size={20} color="#aaa" /></button>
            </div>

            {/* Price */}
            <div className="mb-5">
              <h4 style={{ color: "#333", marginBottom: 12 }}>Price</h4>
              <div className="flex flex-col gap-2">
                {PRICE_RANGES.map((r, i) => (
                  <label key={r.label} className="flex items-center gap-3 cursor-pointer">
                    <div
                      onClick={() => setPriceRange(i)}
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                      style={{ borderColor: priceRange === i ? "#D4759A" : "#ddd" }}
                    >
                      {priceRange === i && <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#D4759A" }} />}
                    </div>
                    <span style={{ fontSize: "0.88rem", color: "#444" }}>{r.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Type */}
            <div className="mb-5">
              <h4 style={{ color: "#333", marginBottom: 12 }}>Type</h4>
              <div className="flex flex-wrap gap-2">
                {CARD_TYPES.map(t => (
                  <button
                    key={t}
                    onClick={() => toggleType(t)}
                    className="px-3 py-1.5 rounded-full"
                    style={{
                      background: selectedTypes.includes(t) ? "#D4759A" : "#f5f5f5",
                      color: selectedTypes.includes(t) ? "#fff" : "#555",
                      fontSize: "0.78rem", fontWeight: 500,
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div className="flex items-center justify-between mb-6">
              <span style={{ fontSize: "0.88rem", color: "#444", fontWeight: 500 }}>Hide Out of Stock</span>
              <button
                onClick={() => setHideOutOfStock(!hideOutOfStock)}
                className="w-12 h-6 rounded-full transition-all"
                style={{ background: hideOutOfStock ? "#D4759A" : "#ddd" }}
              >
                <div className="w-5 h-5 rounded-full bg-white shadow-sm transition-all" style={{ marginLeft: hideOutOfStock ? 26 : 2, marginTop: 2 }} />
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setPriceRange(0); setSelectedTypes([]); setHideOutOfStock(false); }}
                className="flex-1 py-3 rounded-xl"
                style={{ border: "1.5px solid #F0D8E8", color: "#666", fontWeight: 600, fontSize: "0.88rem" }}
              >
                Reset
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="flex-1 py-3 rounded-xl"
                style={{ background: "#D4759A", color: "#fff", fontWeight: 700, fontSize: "0.88rem" }}
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

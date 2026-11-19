import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { PhotocardTile } from "@/components/PhotocardTile";
import { Button, Chip, EmptyState } from "@/components/ui";
import { GROUPS, GROUP_MAP } from "@/data/groups";
import { PHOTOCARDS } from "@/data/photocards";
import { CARD_TYPES, type CardType } from "@/data/types";
import { searchPhotocards, type SortKey } from "@/data/search";

const PRICE_RANGES = [
  { label: "All Prices", min: 0, max: Infinity },
  { label: "Under $5", min: 0, max: 5 },
  { label: "$5–$20", min: 5, max: 20 },
  { label: "$20–$50", min: 20, max: 50 },
  { label: "$50+", min: 50, max: Infinity },
];

const SORT_LABELS: Record<SortKey, string> = {
  popular: "Popular",
  new: "Newest",
  price_asc: "Price ↑",
  price_desc: "Price ↓",
};

export default function BrowseScreen() {
  const [query, setQuery] = useState("");
  const [groupId, setGroupId] = useState("all");
  const [memberId, setMemberId] = useState("all");
  const [era, setEra] = useState("all");
  const [types, setTypes] = useState<CardType[]>([]);
  const [priceIdx, setPriceIdx] = useState(0);
  const [hideOOS, setHideOOS] = useState(false);
  const [sort, setSort] = useState<SortKey>("popular");
  const [showFilters, setShowFilters] = useState(false);

  const group = groupId !== "all" ? GROUP_MAP[groupId] : undefined;
  const members = group?.members.filter((m) => !m.former) ?? [];
  const eras = group?.eras ?? [];

  const results = useMemo(() => {
    const range = PRICE_RANGES[priceIdx];
    return searchPhotocards(PHOTOCARDS, {
      query,
      groupId,
      memberId,
      era,
      types,
      minPrice: range.min,
      maxPrice: range.max === Infinity ? undefined : range.max,
      hideOutOfStock: hideOOS,
      sort,
    });
  }, [query, groupId, memberId, era, types, priceIdx, hideOOS, sort]);

  const activeFilterCount = (priceIdx !== 0 ? 1 : 0) + types.length + (hideOOS ? 1 : 0);
  const toggleType = (t: CardType) =>
    setTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  const cycleSort = () => {
    const order: SortKey[] = ["popular", "new", "price_asc", "price_desc"];
    setSort(order[(order.indexOf(sort) + 1) % order.length]);
  };

  return (
    <div className="px-4 pt-2">
      {/* search + filter */}
      <div className="mb-3 flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-card border border-wink-pink-border bg-white px-3 py-2.5">
          <Search size={15} color="#9A9A9A" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search photocards…"
            className="flex-1 bg-transparent text-sm text-wink-ink outline-none"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label="Clear search">
              <X size={14} color="#9A9A9A" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(true)}
          aria-label="Filters"
          className="flex h-10 w-10 items-center justify-center rounded-card border border-wink-pink-border"
          style={{ background: activeFilterCount > 0 ? "#D4759A" : "#fff" }}
        >
          <SlidersHorizontal size={16} color={activeFilterCount > 0 ? "#fff" : "#2D2D2D"} />
        </button>
      </div>

      {/* group chips */}
      <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
        <Chip
          label="All"
          active={groupId === "all"}
          onClick={() => {
            setGroupId("all");
            setMemberId("all");
            setEra("all");
          }}
        />
        {GROUPS.map((g) => (
          <Chip
            key={g.id}
            label={g.name}
            active={groupId === g.id}
            activeColor={g.color}
            onClick={() => {
              setGroupId(g.id);
              setMemberId("all");
              setEra("all");
            }}
          />
        ))}
      </div>

      {/* member chips */}
      {members.length > 0 && (
        <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
          <Chip
            label="All Members"
            active={memberId === "all"}
            onClick={() => setMemberId("all")}
          />
          {members.map((m) => (
            <Chip
              key={m.id}
              label={m.name}
              active={memberId === m.id}
              activeColor={m.color}
              onClick={() => setMemberId(m.id)}
            />
          ))}
        </div>
      )}

      {/* era chips */}
      {eras.length > 0 && (
        <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
          <Chip label="All Eras" active={era === "all"} onClick={() => setEra("all")} />
          {eras.map((e) => (
            <Chip key={e} label={e} active={era === e} onClick={() => setEra(e)} />
          ))}
        </div>
      )}

      {/* count + sort */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-wink-muted">
          <span className="font-display font-bold text-wink-ink">
            {results.length.toLocaleString()}
          </span>{" "}
          results
        </span>
        <button
          type="button"
          onClick={cycleSort}
          className="rounded-card border border-wink-pink-border bg-white px-3 py-1.5 text-xs text-wink-ink"
        >
          {SORT_LABELS[sort]}
        </button>
      </div>

      {/* results */}
      {results.length === 0 ? (
        <EmptyState
          title="No cards found"
          subtitle="Try clearing a filter or searching a different member."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {results.slice(0, 60).map((card) => (
            <PhotocardTile key={card.id} card={card} />
          ))}
        </div>
      )}

      {/* filter sheet */}
      {showFilters && (
        <div
          className="fixed inset-0 z-[60] mx-auto flex max-w-md flex-col justify-end bg-black/40"
          onClick={() => setShowFilters(false)}
        >
          <div
            className="rounded-t-3xl bg-white px-5 pb-10 pt-5"
            onClick={(e) => e.stopPropagation()}
            style={{ paddingBottom: "calc(var(--sab) + 40px)" }}
          >
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-wink-ink">Filters</h3>
              <button type="button" onClick={() => setShowFilters(false)} aria-label="Close">
                <X size={20} color="#9A9A9A" />
              </button>
            </div>

            <p className="mb-2 font-display font-bold text-wink-ink">Price</p>
            <div className="mb-5 flex flex-wrap gap-2">
              {PRICE_RANGES.map((r, i) => (
                <Chip
                  key={r.label}
                  label={r.label}
                  active={priceIdx === i}
                  onClick={() => setPriceIdx(i)}
                />
              ))}
            </div>

            <p className="mb-2 font-display font-bold text-wink-ink">Type</p>
            <div className="mb-5 flex flex-wrap gap-2">
              {CARD_TYPES.map((t) => (
                <Chip key={t} label={t} active={types.includes(t)} onClick={() => toggleType(t)} />
              ))}
            </div>

            <button
              type="button"
              onClick={() => setHideOOS(!hideOOS)}
              className="mb-6 flex w-full items-center justify-between"
            >
              <span className="text-wink-ink">Hide sold out</span>
              <span
                className="h-6 w-11 rounded-full p-0.5 transition"
                style={{ background: hideOOS ? "#D4759A" : "#ddd" }}
              >
                <span
                  className="block h-5 w-5 rounded-full bg-white transition"
                  style={{ marginLeft: hideOOS ? 20 : 0 }}
                />
              </span>
            </button>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  setPriceIdx(0);
                  setTypes([]);
                  setHideOOS(false);
                }}
              >
                Reset
              </Button>
              <Button fullWidth onClick={() => setShowFilters(false)}>
                Apply
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

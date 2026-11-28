import { useMemo, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "@/rn";
import { useRouter } from "@/rn/router";
import { Bookmark, Search, ShoppingCart, SlidersHorizontal, X } from "lucide-react";
import {
  Button,
  Chip,
  EmptyState,
  ListingGrid,
  PhotocardImage,
  Pill,
  Screen,
  Sheet,
  StoriesRow,
  Tabs,
  Text,
  Toggle,
} from "@/components";
import {
  CARD_TYPES,
  CATALOG_CATEGORIES,
  GROUPS,
  GROUP_MAP,
  searchCatalog,
  searchPhotocards,
  type CardType,
  type CatalogCategory,
  type SortKey,
} from "@/data";
import { allListings, useAppStore, EMPTY } from "@/data/appStore";
import { useUserStore } from "@/data/userStore";
import { colors } from "@/theme/colors";

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

type Mode = "photocards" | "groups";

/**
 * Browse & Search (§4): photocard-native search with group → member → era
 * tabs, price / type / category / stock filters, sort, saved searches and
 * catalog reference cards — plus a Groups directory filterable by girl/boy
 * group and generation.
 */
export default function BrowseScreen() {
  const router = useRouter();
  const listingsState = useAppStore((s) => s.listings);
  const soldIds = useAppStore((s) => s.soldIds);
  const saveSearch = useUserStore((s) => s.saveSearch);
  const savedSearches = useUserStore((s) => s.user?.savedSearches ?? EMPTY);
  const removeSavedSearch = useUserStore((s) => s.removeSavedSearch);
  const cartCount = useUserStore((s) => s.user?.cartIds.length ?? 0);
  const columns = useUserStore((s) => s.user?.listingsPerRow ?? 2);

  const [mode, setMode] = useState<Mode>("photocards");
  const [query, setQuery] = useState("");
  const [groupId, setGroupId] = useState("all");
  const [memberId, setMemberId] = useState("all");
  const [era, setEra] = useState("all");
  const [types, setTypes] = useState<CardType[]>([]);
  const [category, setCategory] = useState<CatalogCategory | undefined>();
  const [priceIdx, setPriceIdx] = useState(0);
  const [hideOOS, setHideOOS] = useState(false);
  const [showRefs, setShowRefs] = useState(false);
  const [sort, setSort] = useState<SortKey>("popular");
  const [showFilters, setShowFilters] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [gender, setGender] = useState<"all" | "girl" | "boy">("all");
  const [gen, setGen] = useState<0 | 2 | 3 | 4 | 5>(0);

  const group = groupId !== "all" ? GROUP_MAP[groupId] : undefined;
  const members = group?.members.filter((m) => !m.former) ?? [];
  const eras = group?.eras ?? [];
  const listings = useMemo(() => allListings({ listings: listingsState, soldIds }), [listingsState, soldIds]);

  const results = useMemo(() => {
    const range = PRICE_RANGES[priceIdx];
    return searchPhotocards(listings, {
      query,
      groupId,
      memberId,
      era,
      types,
      category,
      minPrice: range.min,
      maxPrice: range.max === Infinity ? undefined : range.max,
      hideOutOfStock: hideOOS,
      sort,
    });
  }, [listings, query, groupId, memberId, era, types, category, priceIdx, hideOOS, sort]);

  // Catalog reference cards (no price) for cards nobody is selling right now (§4EE).
  const refs = useMemo(() => {
    if (!showRefs) return [];
    const listed = new Set(results.map((r) => `${r.memberId}|${r.era}|${r.type}`));
    return searchCatalog({ query, groupId, memberId, era, category })
      .filter((c) => !listed.has(`${c.memberId}|${c.era}|${c.type}`))
      .filter((c) => types.length === 0 || types.includes(c.type))
      .slice(0, 30);
  }, [showRefs, results, query, groupId, memberId, era, category, types]);

  const activeFilterCount = (priceIdx !== 0 ? 1 : 0) + types.length + (hideOOS ? 1 : 0) + (category ? 1 : 0) + (showRefs ? 1 : 0);
  const filterTags = [
    priceIdx ? PRICE_RANGES[priceIdx].label : null,
    category ?? null,
    ...types,
    hideOOS ? "In stock" : null,
  ].filter(Boolean) as string[];

  const toggleType = (t: CardType) => setTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  const cycleSort = () => {
    const order: SortKey[] = ["popular", "new", "price_asc", "price_desc"];
    setSort(order[(order.indexOf(sort) + 1) % order.length]);
  };
  const resetFilters = () => {
    setPriceIdx(0);
    setTypes([]);
    setHideOOS(false);
    setCategory(undefined);
    setShowRefs(false);
  };

  const groupsShown = GROUPS.filter((g) => (gender === "all" || g.gender === gender) && (gen === 0 || g.generation === gen)).sort(
    (a, b) => a.generation - b.generation || a.debutYear - b.debutYear,
  );

  return (
    <Screen padded={false}>
      <View className="px-4 pt-2">
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="font-display text-2xl text-wink-ink">Browse</Text>
          <Pressable accessibilityLabel="Cart" onPress={() => router.push("/cart")} hitSlop={8}>
            <ShoppingCart size={21} color={colors.muted} />
            {cartCount ? (
              <View className="absolute -right-2 -top-2 h-4 w-4 items-center justify-center rounded-full bg-wink-pink">
                <Text className="font-display text-white" style={{ fontSize: 9 }}>
                  {cartCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>
        <StoriesRow />
        <Tabs
          value={mode}
          onChange={setMode}
          tabs={[
            { key: "photocards", label: "Photocards" },
            { key: "groups", label: "Groups" },
          ]}
        />

        {mode === "groups" ? (
          <>
            <View className="mb-2 flex-row flex-wrap gap-2">
              <Chip label="All" active={gender === "all"} onPress={() => setGender("all")} />
              <Chip label="Girl Groups" active={gender === "girl"} onPress={() => setGender("girl")} />
              <Chip label="Boy Groups" active={gender === "boy"} onPress={() => setGender("boy")} />
            </View>
            <View className="mb-3 flex-row flex-wrap gap-2">
              <Chip label="All gens" active={gen === 0} onPress={() => setGen(0)} />
              {([2, 3, 4, 5] as const).map((g) => (
                <Chip key={g} label={`${g}${g === 2 ? "nd" : g === 3 ? "rd" : "th"} Gen`} active={gen === g} onPress={() => setGen(g)} />
              ))}
            </View>
            {groupsShown.map((g) => (
              <Pressable
                key={g.id}
                onPress={() => router.push(`/group/${g.id}`)}
                className="mb-3 flex-row items-center gap-3 rounded-card border border-wink-pink-border bg-white p-3"
              >
                <View className="h-12 w-12 items-center justify-center rounded-card" style={{ backgroundColor: g.color }}>
                  <Text className="font-display text-white" style={{ fontSize: 10 }}>
                    {g.abbr.slice(0, 5)}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="font-display text-wink-ink">{g.name}</Text>
                  <Text className="text-xs text-wink-muted">
                    {g.company} · debut {g.debutYear} · {g.generation}G · {g.members.filter((m) => !m.former).length} members
                  </Text>
                  <Text className="text-xs text-wink-muted" numberOfLines={1}>
                    {g.members.filter((m) => !m.former).map((m) => m.name).join(", ")}
                  </Text>
                </View>
              </Pressable>
            ))}
          </>
        ) : (
          <>
            {/* search + filter toggle */}
            <View className="mb-3 flex-row items-center gap-2">
              <View className="flex-1 flex-row items-center gap-2 rounded-card border border-wink-pink-border bg-white px-3 py-2.5">
                <Search size={15} color={colors.muted} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Member, group, era, version, #hashtag…"
                  placeholderTextColor={colors.muted}
                  className="flex-1 text-sm text-wink-ink"
                />
                {query ? (
                  <Pressable accessibilityLabel="Clear search" onPress={() => setQuery("")} hitSlop={8}>
                    <X size={14} color={colors.muted} />
                  </Pressable>
                ) : null}
              </View>
              <Pressable
                accessibilityLabel="Saved searches"
                onPress={() => setShowSaved(true)}
                className="h-10 w-10 items-center justify-center rounded-card border border-wink-pink-border bg-white"
              >
                <Bookmark size={16} color={colors.ink} />
              </Pressable>
              <Pressable
                accessibilityLabel={`Filters${activeFilterCount ? ` (${activeFilterCount} active)` : ""}`}
                onPress={() => setShowFilters(true)}
                className="h-10 w-10 items-center justify-center rounded-card border border-wink-pink-border"
                style={{ backgroundColor: activeFilterCount > 0 ? colors.pink : colors.white }}
              >
                <SlidersHorizontal size={16} color={activeFilterCount > 0 ? colors.white : colors.ink} />
                {activeFilterCount ? (
                  <View className="absolute -right-1.5 -top-1.5 h-4 w-4 items-center justify-center rounded-full bg-wink-ink">
                    <Text className="text-white" style={{ fontSize: 9 }}>
                      {activeFilterCount}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            </View>

            {/* group chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
              <View className="flex-row gap-2">
                <Chip
                  label="All"
                  active={groupId === "all"}
                  onPress={() => {
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
                    onPress={() => {
                      setGroupId(g.id);
                      setMemberId("all");
                      setEra("all");
                    }}
                  />
                ))}
              </View>
            </ScrollView>

            {members.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                <View className="flex-row gap-2">
                  <Chip label="All Members" active={memberId === "all"} onPress={() => setMemberId("all")} />
                  {members.map((m) => (
                    <Chip key={m.id} label={m.name} active={memberId === m.id} activeColor={m.color} onPress={() => setMemberId(m.id)} />
                  ))}
                </View>
              </ScrollView>
            ) : null}

            {eras.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                <View className="flex-row gap-2">
                  <Chip label="All Eras" active={era === "all"} onPress={() => setEra("all")} />
                  {eras.map((e, i) => (
                    <Chip key={e} label={i === eras.length - 1 ? `${e} (old era)` : e} active={era === e} onPress={() => setEra(e)} />
                  ))}
                </View>
              </ScrollView>
            ) : null}

            {filterTags.length ? (
              <View className="mb-2 flex-row flex-wrap items-center gap-1">
                {filterTags.map((t) => (
                  <Pill key={t} label={t} />
                ))}
                <Pressable onPress={resetFilters}>
                  <Text className="ml-1 text-xs text-wink-pink">Clear</Text>
                </Pressable>
              </View>
            ) : null}

            {/* count + sort + save */}
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-sm text-wink-muted">
                <Text className="font-display text-wink-ink">{results.length.toLocaleString()}</Text> results
              </Text>
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() =>
                    saveSearch({
                      label: [query, group?.name, members.find((m) => m.id === memberId)?.name, era !== "all" ? era : ""].filter(Boolean).join(" · ") || "All photocards",
                      query,
                      groupId,
                      memberId,
                      era,
                      notify: true,
                    })
                  }
                  className="rounded-card border border-wink-pink-border bg-white px-3 py-1.5"
                >
                  <Text className="text-xs text-wink-ink">Save search</Text>
                </Pressable>
                <Pressable onPress={cycleSort} className="rounded-card border border-wink-pink-border bg-white px-3 py-1.5">
                  <Text className="text-xs text-wink-ink">{SORT_LABELS[sort]}</Text>
                </Pressable>
              </View>
            </View>

            {results.length === 0 && refs.length === 0 ? (
              <EmptyState title="No cards found" subtitle="Try clearing a filter or searching a different member." />
            ) : (
              <ListingGrid cards={results.slice(0, 60)} columns={columns} />
            )}

            {refs.length ? (
              <>
                <Text className="mb-2 mt-2 font-display text-wink-ink">Catalog reference cards</Text>
                <View className="flex-row flex-wrap justify-between">
                  {refs.map((c) => (
                    <Pressable key={c.id} onPress={() => router.push(`/catalog/${c.id}`)} className="mb-3 w-[31.5%]">
                      <PhotocardImage groupId={c.groupId} memberName={c.memberName} imgSeed={c.imgSeed} />
                      <Text className="mt-1 text-wink-ink" style={{ fontSize: 10 }} numberOfLines={2}>
                        {c.name}
                      </Text>
                      <Text className="text-wink-muted" style={{ fontSize: 9 }}>
                        No listings yet
                      </Text>
                    </Pressable>
                  ))}
                  {refs.length % 3 === 2 ? <View className="w-[31.5%]" /> : null}
                </View>
              </>
            ) : null}
          </>
        )}
      </View>

      {/* filter sheet */}
      <Sheet visible={showFilters} onClose={() => setShowFilters(false)} title={`Filters${activeFilterCount ? ` (${activeFilterCount})` : ""}`}>
        <Text className="mb-2 font-display text-wink-ink">Price</Text>
        <View className="mb-5 flex-row flex-wrap gap-2">
          {PRICE_RANGES.map((r, i) => (
            <Chip key={r.label} label={r.label} active={priceIdx === i} onPress={() => setPriceIdx(i)} />
          ))}
        </View>
        <Text className="mb-2 font-display text-wink-ink">Catalog category</Text>
        <View className="mb-5 flex-row flex-wrap gap-2">
          {CATALOG_CATEGORIES.map((c) => (
            <Chip key={c} label={c} active={category === c} onPress={() => setCategory(category === c ? undefined : c)} />
          ))}
        </View>
        <Text className="mb-2 font-display text-wink-ink">Type</Text>
        <View className="mb-5 flex-row flex-wrap gap-2">
          {CARD_TYPES.map((t) => (
            <Chip key={t} label={t} active={types.includes(t)} onPress={() => toggleType(t)} />
          ))}
        </View>
        <Toggle label="Hide sold out" value={hideOOS} onChange={setHideOOS} />
        <Toggle label="Show catalog reference cards" sub="Database cards with no active listing" value={showRefs} onChange={setShowRefs} />
        <View className="mt-4 flex-row gap-3">
          <View className="flex-1">
            <Button title="Reset" variant="secondary" fullWidth onPress={resetFilters} />
          </View>
          <View className="flex-1">
            <Button title="Apply" fullWidth onPress={() => setShowFilters(false)} />
          </View>
        </View>
      </Sheet>

      {/* saved searches */}
      <Sheet visible={showSaved} onClose={() => setShowSaved(false)} title="Saved searches">
        {savedSearches.length === 0 ? (
          <Text className="text-sm text-wink-muted">Tap “Save search” to get notified when new matching cards are listed.</Text>
        ) : (
          savedSearches.map((s) => (
            <View key={s.id} className="flex-row items-center border-b border-wink-pink-border py-3">
              <Pressable
                className="flex-1"
                onPress={() => {
                  setQuery(s.query);
                  setGroupId(s.groupId ?? "all");
                  setMemberId(s.memberId ?? "all");
                  setEra(s.era ?? "all");
                  setShowSaved(false);
                }}
              >
                <Text className="text-wink-ink">{s.label}</Text>
                <Text className="text-xs text-wink-muted">{s.notify ? "🔔 Alerts on" : "Alerts off"}</Text>
              </Pressable>
              <Pressable accessibilityLabel="Delete saved search" onPress={() => removeSavedSearch(s.id)} hitSlop={8}>
                <X size={16} color={colors.muted} />
              </Pressable>
            </View>
          ))
        )}
      </Sheet>
    </Screen>
  );
}

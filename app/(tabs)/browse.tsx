import { useMemo, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { Search, SlidersHorizontal, X } from "lucide-react-native";
import { Button, Chip, EmptyState, PhotocardTile, Screen, Text } from "@/components";
import { GROUPS, GROUP_MAP } from "@/data/groups";
import { PHOTOCARDS } from "@/data/photocards";
import { CARD_TYPES, type CardType } from "@/data/types";
import { searchPhotocards, type SortKey } from "@/data/search";
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
    <Screen padded={false}>
      <View className="px-4 pt-2">
        {/* search + filter toggle */}
        <View className="mb-3 flex-row items-center gap-2">
          <View className="flex-1 flex-row items-center gap-2 rounded-card border border-wink-pink-border bg-white px-3 py-2.5">
            <Search size={15} color={colors.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search photocards…"
              placeholderTextColor={colors.muted}
              className="flex-1 text-sm text-wink-ink"
            />
            {query ? (
              <Pressable onPress={() => setQuery("")} hitSlop={8}>
                <X size={14} color={colors.muted} />
              </Pressable>
            ) : null}
          </View>
          <Pressable
            onPress={() => setShowFilters(true)}
            className="h-10 w-10 items-center justify-center rounded-card border border-wink-pink-border"
            style={{ backgroundColor: activeFilterCount > 0 ? colors.pink : colors.white }}
          >
            <SlidersHorizontal
              size={16}
              color={activeFilterCount > 0 ? colors.white : colors.ink}
            />
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

        {/* member chips */}
        {members.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
            <View className="flex-row gap-2">
              <Chip
                label="All Members"
                active={memberId === "all"}
                onPress={() => setMemberId("all")}
              />
              {members.map((m) => (
                <Chip
                  key={m.id}
                  label={m.name}
                  active={memberId === m.id}
                  activeColor={m.color}
                  onPress={() => setMemberId(m.id)}
                />
              ))}
            </View>
          </ScrollView>
        ) : null}

        {/* era chips */}
        {eras.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
            <View className="flex-row gap-2">
              <Chip label="All Eras" active={era === "all"} onPress={() => setEra("all")} />
              {eras.map((e) => (
                <Chip key={e} label={e} active={era === e} onPress={() => setEra(e)} />
              ))}
            </View>
          </ScrollView>
        ) : null}

        {/* count + sort */}
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-sm text-wink-muted">
            <Text className="font-display text-wink-ink">{results.length.toLocaleString()}</Text>{" "}
            results
          </Text>
          <Pressable
            onPress={cycleSort}
            className="rounded-card border border-wink-pink-border bg-white px-3 py-1.5"
          >
            <Text className="text-xs text-wink-ink">{SORT_LABELS[sort]}</Text>
          </Pressable>
        </View>

        {/* results grid */}
        {results.length === 0 ? (
          <EmptyState
            title="No cards found"
            subtitle="Try clearing a filter or searching a different member."
          />
        ) : (
          <View className="flex-row flex-wrap justify-between">
            {results.slice(0, 60).map((card) => (
              <View key={card.id} className="mb-3 w-[48.5%]">
                <PhotocardTile card={card} />
              </View>
            ))}
          </View>
        )}
      </View>

      {/* filter sheet */}
      {showFilters ? (
        <View className="absolute inset-0 justify-end bg-black/40">
          <Pressable className="flex-1" onPress={() => setShowFilters(false)} />
          <View className="rounded-t-3xl bg-white px-5 pb-10 pt-5">
            <View className="mb-5 flex-row items-center justify-between">
              <Text className="font-display text-lg text-wink-ink">Filters</Text>
              <Pressable onPress={() => setShowFilters(false)} hitSlop={8}>
                <X size={20} color={colors.muted} />
              </Pressable>
            </View>

            <Text className="mb-2 font-display text-wink-ink">Price</Text>
            <View className="mb-5 flex-row flex-wrap gap-2">
              {PRICE_RANGES.map((r, i) => (
                <Chip
                  key={r.label}
                  label={r.label}
                  active={priceIdx === i}
                  onPress={() => setPriceIdx(i)}
                />
              ))}
            </View>

            <Text className="mb-2 font-display text-wink-ink">Type</Text>
            <View className="mb-5 flex-row flex-wrap gap-2">
              {CARD_TYPES.map((t) => (
                <Chip key={t} label={t} active={types.includes(t)} onPress={() => toggleType(t)} />
              ))}
            </View>

            <Pressable
              onPress={() => setHideOOS(!hideOOS)}
              className="mb-6 flex-row items-center justify-between"
            >
              <Text className="text-wink-ink">Hide sold out</Text>
              <View
                className="h-6 w-11 rounded-full p-0.5"
                style={{ backgroundColor: hideOOS ? colors.pink : "#ddd" }}
              >
                <View
                  className="h-5 w-5 rounded-full bg-white"
                  style={{ marginLeft: hideOOS ? 20 : 0 }}
                />
              </View>
            </Pressable>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Button
                  title="Reset"
                  variant="secondary"
                  fullWidth
                  onPress={() => {
                    setPriceIdx(0);
                    setTypes([]);
                    setHideOOS(false);
                  }}
                />
              </View>
              <View className="flex-1">
                <Button title="Apply" fullWidth onPress={() => setShowFilters(false)} />
              </View>
            </View>
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

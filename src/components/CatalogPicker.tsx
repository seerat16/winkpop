import { useMemo, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { Check, Search, X } from "lucide-react-native";
import {
  CATALOG_CATEGORIES,
  categoryForType,
  GROUPS,
  GROUP_MAP,
  searchCatalog,
  type CatalogCategory,
} from "@/data";
import { allListings } from "@/data/appStore";
import { colors } from "@/theme/colors";
import { Button } from "./Button";
import { Chip } from "./Chip";
import { PhotocardImage } from "./PhotocardImage";
import { Sheet } from "./ui";
import { Text } from "./Text";

interface PickerItem {
  id: string;
  groupId: string;
  memberName: string;
  imgSeed: number;
  title: string;
  sub: string;
}

/**
 * Database picker (§3X): browse by group → member → category, search, and
 * multi-select. Reused by collection, cart, wishlist, trade-for and listing
 * flows. `mode="catalog"` returns database ids; `mode="listings"` returns live
 * marketplace listing ids (for cart / collection).
 */
export function CatalogPicker({
  visible,
  onClose,
  onDone,
  title = "Pick photocards",
  cta = "Select",
  multi = true,
  mode = "catalog",
  initialGroupId,
  initialSelected = [],
}: {
  visible: boolean;
  onClose: () => void;
  onDone: (ids: string[]) => void;
  title?: string;
  cta?: string;
  multi?: boolean;
  mode?: "catalog" | "listings";
  initialGroupId?: string;
  initialSelected?: string[];
}) {
  const [groupId, setGroupId] = useState(initialGroupId ?? GROUPS[0].id);
  const [memberId, setMemberId] = useState("all");
  const [category, setCategory] = useState<CatalogCategory | "all">("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>(initialSelected);

  const group = GROUP_MAP[groupId];
  const items: PickerItem[] = useMemo(() => {
    if (mode === "catalog") {
      return searchCatalog({
        groupId: query ? undefined : groupId,
        memberId,
        category: category === "all" ? undefined : category,
        query,
      })
        .slice(0, 120)
        .map((c) => ({ id: c.id, groupId: c.groupId, memberName: c.memberName, imgSeed: c.imgSeed, title: c.name, sub: `${c.category} · ${c.version}` }));
    }
    const q = query.trim().toLowerCase();
    return allListings()
      .filter((l) => l.available)
      .filter((l) => (q ? `${l.title} ${l.groupName}`.toLowerCase().includes(q) : l.groupId === groupId))
      .filter((l) => memberId === "all" || l.memberId === memberId)
      .filter((l) => category === "all" || categoryForType(l.type) === category)
      .slice(0, 120)
      .map((l) => ({ id: l.id, groupId: l.groupId, memberName: l.memberName, imgSeed: l.imgSeed, title: l.title, sub: `$${l.price.toFixed(2)} · @${l.sellerUsername}` }));
  }, [mode, groupId, memberId, category, query]);

  const toggle = (id: string) => {
    if (!multi) return setSelected([id]);
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={title} full>
      <View className="mb-2 flex-row items-center gap-2 rounded-card border border-wink-pink-border px-3 py-2">
        <Search size={14} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search member, era, version, outfit…"
          placeholderTextColor={colors.muted}
          className="flex-1 text-sm text-wink-ink"
        />
        {query ? (
          <Pressable onPress={() => setQuery("")} accessibilityLabel="Clear search">
            <X size={14} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
        <View className="flex-row gap-2">
          {GROUPS.map((g) => (
            <Chip
              key={g.id}
              label={g.name}
              active={g.id === groupId}
              activeColor={g.color}
              onPress={() => {
                setGroupId(g.id);
                setMemberId("all");
              }}
            />
          ))}
        </View>
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
        <View className="flex-row gap-2">
          <Chip label="All members" active={memberId === "all"} onPress={() => setMemberId("all")} />
          {group?.members.map((m) => (
            <Chip key={m.id} label={m.former ? `${m.name} (former)` : m.name} active={memberId === m.id} activeColor={m.color} onPress={() => setMemberId(m.id)} />
          ))}
        </View>
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
        <View className="flex-row gap-2">
          <Chip label="All categories" active={category === "all"} onPress={() => setCategory("all")} />
          {CATALOG_CATEGORIES.map((c) => (
            <Chip key={c} label={c} active={category === c} onPress={() => setCategory(c)} />
          ))}
        </View>
      </ScrollView>

      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-xs text-wink-muted">{items.length} cards</Text>
        {multi ? (
          <Pressable
            onPress={() => {
              const ids = items.map((i) => i.id);
              const all = ids.every((id) => selected.includes(id));
              setSelected((s) => (all ? s.filter((x) => !ids.includes(x)) : [...new Set([...s, ...ids])]));
            }}
          >
            <Text className="text-xs text-wink-pink">Select all shown</Text>
          </Pressable>
        ) : null}
      </View>

      <View className="flex-row flex-wrap gap-2">
        {items.map((it) => {
          const on = selected.includes(it.id);
          return (
            <Pressable
              key={it.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={it.title}
              onPress={() => toggle(it.id)}
              className="w-[31%]"
            >
              <View className="relative">
                <PhotocardImage groupId={it.groupId} memberName={it.memberName} imgSeed={it.imgSeed} />
                {on ? (
                  <View className="absolute right-1 top-1 h-6 w-6 items-center justify-center rounded-full bg-wink-pink">
                    <Check size={14} color={colors.white} />
                  </View>
                ) : null}
              </View>
              <Text className="mt-1 text-wink-ink" style={{ fontSize: 10 }} numberOfLines={2}>
                {it.title}
              </Text>
              <Text className="text-wink-muted" style={{ fontSize: 9 }} numberOfLines={1}>
                {it.sub}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="mt-4">
        <Button
          title={`${cta}${selected.length ? ` (${selected.length})` : ""}`}
          fullWidth
          disabled={selected.length === 0}
          onPress={() => {
            onDone(selected);
            setSelected([]);
          }}
        />
      </View>
    </Sheet>
  );
}

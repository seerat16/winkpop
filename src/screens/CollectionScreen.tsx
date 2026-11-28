import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "@/rn";
import { useRouter } from "@/rn/router";
import { Minus, Plus, Tag } from "lucide-react";
import {
  Button,
  Card,
  CatalogPicker,
  Chip,
  EmptyState,
  MenuItem,
  Notice,
  Page,
  PhotocardImage,
  SectionTitle,
  Sheet,
  Tabs,
  Text,
  Toggle,
} from "@/components";
import {
  categoryForType,
  collectionStats,
  collectionValueTrend,
  getPhotocard,
  GROUP_MAP,
  PHOTOCARDS,
  type Photocard,
} from "@/data";
import { useAppStore } from "@/data/appStore";
import { useUserStore } from "@/data/userStore";
import { colors } from "@/theme/colors";

type View_ = "groups" | "all" | "duplicates" | "wants";
type Segment = "group" | "era" | "category" | "member";

/**
 * My Collection (§11): totals and estimated value, by group, all cards,
 * haves / wants / duplicates, organize by album / era / category / member,
 * cost by group & member (hideable), value trend, add via database picker or
 * a whole album, one-tap list a duplicate.
 */
export default function CollectionScreen() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const addToCollection = useUserStore((s) => s.addToCollection);
  const setQty = useUserStore((s) => s.setCollectionQty);
  const updateUser = useUserStore((s) => s.updateUser);
  const wishlists = useAppStore((s) => s.wishlists);
  const [tab, setTab] = useState<View_>("groups");
  const [segment, setSegment] = useState<Segment>("group");
  const [picker, setPicker] = useState(false);
  const [addMenu, setAddMenu] = useState(false);
  const [albumSheet, setAlbumSheet] = useState(false);
  const [notice, setNotice] = useState("");

  // Memoised so the empty fallbacks don't change identity on every render.
  const ids = useMemo(() => user?.collectionIds ?? [], [user?.collectionIds]);
  const qty = useMemo(() => user?.collectionQty ?? {}, [user?.collectionQty]);
  const stats = useMemo(() => collectionStats(ids, qty, user?.collectionCost), [ids, qty, user?.collectionCost]);
  const trend = useMemo(() => collectionValueTrend(ids, qty), [ids, qty]);
  const cards = ids.map(getPhotocard).filter((c): c is Photocard => Boolean(c));
  const hideCost = user?.hideCollectionCost ?? false;

  const segmented = useMemo(() => {
    const m = new Map<string, Photocard[]>();
    for (const c of cards) {
      const key = segment === "group" ? c.groupName : segment === "era" ? `${c.groupName} · ${c.era}` : segment === "category" ? categoryForType(c.type) : c.memberName;
      m.set(key, [...(m.get(key) ?? []), c]);
    }
    return [...m.entries()];
  }, [cards, segment]);

  const wantCount = wishlists.reduce((s, w) => s + w.cardIds.length + w.descriptions.length, 0);
  const maxV = Math.max(...trend.map((t) => t.value), 1);

  const importAlbum = (groupId: string, era: string) => {
    const album = PHOTOCARDS.filter((p) => p.groupId === groupId && p.era === era && p.type === "Album");
    addToCollection(album.map((a) => a.id));
    setNotice(`Imported ${album.length} cards from ${GROUP_MAP[groupId].name} · ${era}`);
    setAlbumSheet(false);
  };

  return (
    <Page title="My Collection" right={<Button size="sm" title="+ Add Cards" onPress={() => setAddMenu(true)} />}>
      <Card>
        <View className="flex-row justify-around">
          <Stat label="Total cards" value={String(stats.totalCards)} />
          <Stat label="Groups" value={String(stats.groups)} />
          <Stat label="Est. value" value={`$${stats.estimatedValue.toFixed(0)}`} />
          {!hideCost ? <Stat label="Spent" value={`$${stats.totalCost.toFixed(0)}`} /> : null}
        </View>
        {trend.length ? (
          <>
            <View className="mt-3 h-12 flex-row items-end gap-0.5">
              {trend.map((t) => (
                <View key={t.date} className="flex-1 rounded-t" style={{ height: `${(t.value / maxV) * 100}%`, backgroundColor: colors.mintSoft }} />
              ))}
            </View>
            <Text className="mt-1 text-xs text-wink-muted">Collection value · last 12 months</Text>
          </>
        ) : null}
        <Toggle label="Hide collection cost" value={hideCost} onChange={(v) => updateUser({ hideCollectionCost: v })} />
      </Card>
      {notice ? <Notice tone="success" text={notice} /> : null}

      <View className="mt-3">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { key: "groups", label: "By group" },
            { key: "all", label: "All", count: stats.uniqueCards },
            { key: "duplicates", label: "Dupes", count: stats.duplicates },
            { key: "wants", label: "Wants", count: wantCount },
          ]}
        />
      </View>

      {cards.length === 0 && tab !== "wants" ? (
        <>
          <EmptyState emoji="📒" title="Your binder is empty" subtitle="Add cards from the database, or import a whole album." />
          <Button title="+ Add Cards" fullWidth onPress={() => setAddMenu(true)} />
        </>
      ) : null}

      {tab === "groups" && cards.length ? (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
            <View className="flex-row gap-2">
              {(["group", "era", "category", "member"] as Segment[]).map((s) => (
                <Chip key={s} label={`By ${s === "era" ? "album / era" : s}`} active={segment === s} onPress={() => setSegment(s)} />
              ))}
            </View>
          </ScrollView>
          {segmented.map(([key, list]) => (
            <View key={key} className="mb-3">
              <Text className="mb-1 font-display text-sm text-wink-ink">
                {key} <Text className="text-xs text-wink-muted">({list.reduce((s, c) => s + (qty[c.id] ?? 1), 0)})</Text>
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {list.map((c) => (
                    <Pressable key={c.id} onPress={() => router.push(`/card/${c.id}`)} className="w-16">
                      <PhotocardImage groupId={c.groupId} memberName={c.memberName} imgSeed={c.imgSeed} />
                      {(qty[c.id] ?? 1) > 1 ? (
                        <View className="absolute right-1 top-1 rounded-full bg-wink-pink px-1.5">
                          <Text className="text-white" style={{ fontSize: 9 }}>
                            ×{qty[c.id]}
                          </Text>
                        </View>
                      ) : null}
                    </Pressable>
                  ))}
                  <Pressable accessibilityLabel="Add cards" onPress={() => setPicker(true)} className="h-[85px] w-16 items-center justify-center rounded-card border border-dashed border-wink-pink-border">
                    <Plus size={16} color={colors.muted} />
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          ))}
          {!hideCost ? (
            <>
              <SectionTitle title="Cost by group" />
              {stats.byGroup.map((g) => (
                <View key={g.groupId} className="flex-row justify-between py-1">
                  <Text className="text-sm text-wink-ink">{g.name}</Text>
                  <Text className="text-sm text-wink-muted">
                    {g.count} cards · ${g.cost.toFixed(2)} spent · ${g.value.toFixed(2)} value
                  </Text>
                </View>
              ))}
              <SectionTitle title="Cost by member" />
              {stats.byMember.slice(0, 8).map((m) => (
                <View key={m.memberName + m.groupId} className="flex-row justify-between py-1">
                  <Text className="text-sm text-wink-ink">{m.memberName}</Text>
                  <Text className="text-sm text-wink-muted">
                    {m.count} · ${m.cost.toFixed(2)}
                  </Text>
                </View>
              ))}
            </>
          ) : null}
        </>
      ) : null}

      {tab === "all" || tab === "duplicates"
        ? cards
            .filter((c) => tab === "all" || (qty[c.id] ?? 1) > 1)
            .map((c) => (
              <View key={c.id} className="mb-2 flex-row items-center gap-3 rounded-card border border-wink-pink-border bg-white p-3">
                <Pressable className="w-12" onPress={() => router.push(`/card/${c.id}`)}>
                  <PhotocardImage groupId={c.groupId} memberName={c.memberName} imgSeed={c.imgSeed} />
                </Pressable>
                <View className="flex-1">
                  <Text className="font-display text-sm text-wink-ink">{c.memberName}</Text>
                  <Text className="text-xs text-wink-muted">
                    {c.era} · {categoryForType(c.type)}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Pressable accessibilityLabel="Decrease quantity" onPress={() => setQty(c.id, (qty[c.id] ?? 1) - 1)}>
                    <Minus size={16} color={colors.muted} />
                  </Pressable>
                  <Text className="font-display text-wink-ink">{qty[c.id] ?? 1}</Text>
                  <Pressable accessibilityLabel="Increase quantity" onPress={() => setQty(c.id, (qty[c.id] ?? 1) + 1)}>
                    <Plus size={16} color={colors.muted} />
                  </Pressable>
                </View>
                {(qty[c.id] ?? 1) > 1 || tab === "duplicates" ? (
                  <Pressable accessibilityLabel="List duplicate" onPress={() => router.push(`/listing/new?fromCollection=${c.id}`)} className="flex-row items-center gap-1 rounded-pill bg-wink-pink px-2 py-1">
                    <Tag size={11} color={colors.white} />
                    <Text className="text-white" style={{ fontSize: 10 }}>
                      List
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ))
        : null}

      {tab === "wants" ? (
        <>
          {wishlists.map((w) => (
            <Pressable key={w.id} onPress={() => router.push(`/wishlists/${w.id}`)} className="mb-2 rounded-card border border-wink-pink-border bg-white p-3">
              <Text className="font-display text-wink-ink">{w.name}</Text>
              <Text className="text-xs text-wink-muted">
                {GROUP_MAP[w.groupId]?.name} · {w.cardIds.length + w.descriptions.length} wants
              </Text>
            </Pressable>
          ))}
          <Button title="Manage wishlists" variant="secondary" fullWidth onPress={() => router.push("/wishlists")} />
        </>
      ) : null}

      <Sheet visible={addMenu} onClose={() => setAddMenu(false)} title="Add cards">
        <MenuItem label="Pick from the database" sub="Select by group, member, category or search" onPress={() => { setAddMenu(false); setPicker(true); }} />
        <MenuItem label="Import a whole album" sub="Add every album card from an era in one tap" onPress={() => { setAddMenu(false); setAlbumSheet(true); }} />
        <MenuItem label="Scan a filled-out template or photo" sub="Match cards from a well-lit photo against the database" onPress={() => { setAddMenu(false); router.push("/database"); }} />
      </Sheet>

      <Sheet visible={albumSheet} onClose={() => setAlbumSheet(false)} title="Import an album">
        {(user?.collectingGroupIds.length ? user.collectingGroupIds : Object.keys(GROUP_MAP)).map((g) => (
          <View key={g} className="mb-3">
            <Text className="mb-1 font-display text-sm text-wink-ink">{GROUP_MAP[g]?.name}</Text>
            <View className="flex-row flex-wrap gap-2">
              {GROUP_MAP[g]?.eras.map((e) => (
                <Chip key={e} label={e} onPress={() => importAlbum(g, e)} />
              ))}
            </View>
          </View>
        ))}
      </Sheet>

      <CatalogPicker
        visible={picker}
        mode="listings"
        title="Add to collection"
        cta="Add to Collection"
        initialGroupId={user?.collectingGroupIds[0]}
        onClose={() => setPicker(false)}
        onDone={(sel) => {
          addToCollection(sel);
          setPicker(false);
          setNotice(`Added ${sel.length} card${sel.length > 1 ? "s" : ""}`);
        }}
      />
    </Page>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="items-center">
      <Text className="font-display text-lg text-wink-ink">{value}</Text>
      <Text className="text-xs text-wink-muted">{label}</Text>
    </View>
  );
}

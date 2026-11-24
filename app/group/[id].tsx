import { useMemo, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Bell, BellOff, Search, X } from "lucide-react-native";
import { Button, Card, Chip, EmptyState, ListingGrid, Page, Pill, SectionTitle, Text } from "@/components";
import { CARD_TYPES, getGroupPriceGuide, GROUP_MAP, searchPhotocards, type CardType } from "@/data";
import { allListings, useAppStore } from "@/data/appStore";
import { useUserStore } from "@/data/userStore";
import { colors } from "@/theme/colors";

/**
 * Group page (§4FF–GG): girl/boy group, generation, company, debut year,
 * members (including former members with notes), follow for new-listing
 * notifications (§4L), price guide (§8D), and filterable cards.
 */
export default function GroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const group = GROUP_MAP[id ?? ""];
  const followed = useUserStore((s) => s.user?.followedGroupIds.includes(id ?? "") ?? false);
  const toggleFollowGroup = useUserStore((s) => s.toggleFollowGroup);
  const listingsState = useAppStore((s) => s.listings);
  const soldIds = useAppStore((s) => s.soldIds);
  const columns = useUserStore((s) => s.user?.listingsPerRow ?? 2);
  const [memberId, setMemberId] = useState("all");
  const [era, setEra] = useState("all");
  const [type, setType] = useState<CardType | "all">("all");
  const [query, setQuery] = useState("");

  const cards = useMemo(
    () =>
      group
        ? searchPhotocards(allListings({ listings: listingsState, soldIds }), {
            groupId: group.id,
            memberId,
            era,
            types: type === "all" ? undefined : [type],
            query,
          })
        : [],
    [group, listingsState, soldIds, memberId, era, type, query],
  );
  const guide = useMemo(() => (group ? getGroupPriceGuide(group.id) : []), [group]);

  if (!group) return <Page title="Group">{<EmptyState title="Group not found" />}</Page>;

  const tags = [
    memberId !== "all" ? group.members.find((m) => m.id === memberId)?.name : null,
    era !== "all" ? era : null,
    type !== "all" ? type : null,
  ].filter(Boolean) as string[];

  return (
    <Page title={group.name}>
      <Card>
        <View className="flex-row items-center gap-3">
          <View className="h-14 w-14 items-center justify-center rounded-card" style={{ backgroundColor: group.color }}>
            <Text className="font-display text-white" style={{ fontSize: 11 }}>
              {group.abbr.slice(0, 5)}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="font-display text-lg text-wink-ink">{group.name}</Text>
            <Text className="text-xs text-wink-muted">
              {group.gender === "girl" ? "Girl group" : "Boy group"} · {group.generation}G · {group.company} · debut {group.debutYear}
            </Text>
          </View>
        </View>
        <View className="mt-3">
          <Button
            size="sm"
            variant={followed ? "secondary" : "primary"}
            title={followed ? "Following · notifications on" : "Follow group"}
            icon={followed ? <BellOff size={14} color={colors.ink} /> : <Bell size={14} color={colors.white} />}
            onPress={() => toggleFollowGroup(group.id)}
          />
        </View>
      </Card>

      <SectionTitle title={`Members (${group.members.filter((m) => !m.former).length})`} />
      <View className="flex-row flex-wrap gap-2">
        {group.members.map((m) => (
          <View key={m.id} className="rounded-card border border-wink-pink-border bg-white px-3 py-2" style={{ opacity: m.former ? 0.7 : 1 }}>
            <Text className="text-sm text-wink-ink">
              {m.name} {m.former ? <Text className="text-xs text-wink-muted">(former)</Text> : null}
            </Text>
            {m.note ? <Text className="text-wink-muted" style={{ fontSize: 10, maxWidth: 200 }}>{m.note}</Text> : null}
          </View>
        ))}
      </View>

      <SectionTitle title="Price guide" />
      <Card>
        {guide.map((g) => (
          <View key={g.type} className="flex-row justify-between py-1">
            <Text className="text-sm text-wink-ink">{g.type}</Text>
            <Text className="text-xs text-wink-muted">
              ${g.low.toFixed(0)} – <Text className="font-display text-wink-pink">${g.avg.toFixed(0)}</Text> – ${g.high.toFixed(0)}
            </Text>
          </View>
        ))}
      </Card>

      <SectionTitle title="Cards" />
      <View className="mb-2 flex-row items-center gap-2 rounded-card border border-wink-pink-border bg-white px-3 py-2">
        <Search size={14} color={colors.muted} />
        <TextInput value={query} onChangeText={setQuery} placeholder={`Search ${group.name} cards`} placeholderTextColor={colors.muted} className="flex-1 text-sm text-wink-ink" />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
        <View className="flex-row gap-2">
          <Chip label="All members" active={memberId === "all"} onPress={() => setMemberId("all")} />
          {group.members.filter((m) => !m.former).map((m) => (
            <Chip key={m.id} label={m.name} active={memberId === m.id} activeColor={m.color} onPress={() => setMemberId(m.id)} />
          ))}
        </View>
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
        <View className="flex-row gap-2">
          <Chip label="All eras" active={era === "all"} onPress={() => setEra("all")} />
          {group.eras.map((e) => (
            <Chip key={e} label={e} active={era === e} onPress={() => setEra(e)} />
          ))}
        </View>
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
        <View className="flex-row gap-2">
          <Chip label="All types" active={type === "all"} onPress={() => setType("all")} />
          {CARD_TYPES.map((t) => (
            <Chip key={t} label={t} active={type === t} onPress={() => setType(t)} />
          ))}
        </View>
      </ScrollView>
      {tags.length ? (
        <View className="mb-3 flex-row flex-wrap items-center gap-1">
          {tags.map((t) => (
            <Pill key={t} label={t} />
          ))}
          <Pressable
            accessibilityLabel="Clear filters"
            onPress={() => {
              setMemberId("all");
              setEra("all");
              setType("all");
              setQuery("");
            }}
            className="ml-1 flex-row items-center"
          >
            <X size={12} color={colors.pink} />
            <Text className="text-xs text-wink-pink">Clear</Text>
          </Pressable>
        </View>
      ) : null}
      <Text className="mb-2 text-xs text-wink-muted">{cards.length} cards</Text>
      {cards.length ? <ListingGrid cards={cards.slice(0, 60)} columns={columns} /> : <EmptyState title="No cards match" />}
    </Page>
  );
}

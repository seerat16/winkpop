import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { Check, X } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Chip, Field, PhotocardImage, Progress, Text } from "@/components";
import { CARD_TYPES, GROUPS, GROUP_MAP, MAX_WISHLIST_NAME, searchCatalog, type CardType } from "@/data";
import { useAppStore } from "@/data/appStore";
import { colors } from "@/theme/colors";

type By = "member" | "era" | "type";

/**
 * Create a wishlist in 3 steps (§12B–C, §12R–T): pick a group (member + era
 * counts) → narrow by member / era / card type and select cards (or add a
 * text entry like "Any Karina photocard") → name it (≤40 chars) and preview.
 */
export default function NewWishlistScreen() {
  const router = useRouter();
  const createWishlist = useAppStore((s) => s.createWishlist);
  const [step, setStep] = useState(1);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [by, setBy] = useState<By>("member");
  const [value, setValue] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [descriptions, setDescriptions] = useState<string[]>([]);
  const [desc, setDesc] = useState("");
  const [name, setName] = useState("");

  const group = groupId ? GROUP_MAP[groupId] : undefined;
  const options = !group ? [] : by === "member" ? group.members.map((m) => ({ key: m.id, label: m.name })) : by === "era" ? group.eras.map((e) => ({ key: e, label: e })) : CARD_TYPES.map((t) => ({ key: t, label: t }));
  const cards = useMemo(() => {
    if (!groupId || !value) return [];
    return searchCatalog({ groupId, memberId: by === "member" ? value : undefined, era: by === "era" ? value : undefined, type: by === "type" ? (value as CardType) : undefined });
  }, [groupId, by, value]);
  const total = selected.length + descriptions.length;

  return (
    <SafeAreaView className="flex-1 bg-wink-purple-tint">
      <View className="flex-row items-center gap-3 px-4 py-2">
        <Pressable accessibilityLabel={step > 1 ? "Back" : "Close"} onPress={() => (step > 1 ? setStep(step - 1) : router.back())} className="h-9 w-9 items-center justify-center rounded-full bg-white">
          <X size={18} color={colors.ink} />
        </Pressable>
        <Text className="flex-1 font-display text-lg text-wink-ink">Create wishlist</Text>
        <Text className="text-xs text-wink-muted">{step}/3</Text>
      </View>
      <View className="px-4">
        <Progress step={step} total={3} />
      </View>
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 24 }}>
        {step === 1 ? (
          <>
            <Text className="mb-3 font-display text-wink-ink">Choose a group</Text>
            {GROUPS.map((g) => (
              <Pressable key={g.id} onPress={() => setGroupId(g.id)} className="mb-2 flex-row items-center gap-3 rounded-card border bg-white p-3" style={{ borderColor: groupId === g.id ? g.color : colors.pinkBorder }}>
                <View className="h-4 w-4 rounded-full" style={{ backgroundColor: g.color }} />
                <View className="flex-1">
                  <Text className="font-display text-wink-ink">{g.name}</Text>
                  <Text className="text-xs text-wink-muted">
                    {g.members.filter((m) => !m.former).length} members · {g.eras.length} eras
                  </Text>
                </View>
                {groupId === g.id ? <Check size={16} color={g.color} /> : null}
              </Pressable>
            ))}
          </>
        ) : null}

        {step === 2 && group ? (
          <>
            <View className="mb-2 flex-row gap-2">
              {(["member", "era", "type"] as By[]).map((b) => (
                <Chip key={b} label={b === "type" ? "Card type" : b[0].toUpperCase() + b.slice(1)} active={by === b} onPress={() => { setBy(b); setValue(null); }} />
              ))}
            </View>
            <View className="mb-3 flex-row flex-wrap gap-2">
              {options.map((o) => (
                <Chip key={o.key} label={o.label} active={value === o.key} onPress={() => setValue(o.key)} />
              ))}
            </View>
            {cards.length ? (
              <View className="mb-2 flex-row justify-between">
                <Text className="text-xs text-wink-muted">{cards.length} cards</Text>
                <Pressable onPress={() => setSelected((s) => [...new Set([...s, ...cards.map((c) => c.id)])])}>
                  <Text className="text-xs text-wink-pink">Select all</Text>
                </Pressable>
              </View>
            ) : null}
            <View className="flex-row flex-wrap gap-2">
              {cards.map((c) => {
                const on = selected.includes(c.id);
                return (
                  <Pressable key={c.id} onPress={() => setSelected((s) => (on ? s.filter((x) => x !== c.id) : [...s, c.id]))} className="w-[31%]">
                    <PhotocardImage groupId={c.groupId} memberName={c.memberName} imgSeed={c.imgSeed} />
                    {on ? (
                      <View className="absolute right-1 top-1 h-6 w-6 items-center justify-center rounded-full bg-wink-pink">
                        <Check size={14} color={colors.white} />
                      </View>
                    ) : null}
                    <Text className="text-wink-ink" style={{ fontSize: 9 }} numberOfLines={2}>
                      {c.era} {c.type} · {c.version}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text className="mb-1 mt-4 text-sm text-wink-ink">No photo for the card you want?</Text>
            <View className="flex-row items-end gap-2">
              <View className="flex-1">
                <Field value={desc} onChangeText={setDesc} placeholder={`e.g. Any ${group.members[0].name} photocard`} />
              </View>
              <View className="mb-3">
                <Button size="sm" title="Add" disabled={!desc.trim()} onPress={() => { setDescriptions((d) => [...d, desc.trim()]); setDesc(""); }} />
              </View>
            </View>
            {descriptions.map((d) => (
              <Text key={d} className="text-xs text-wink-ink">
                📝 {d}
              </Text>
            ))}
          </>
        ) : null}

        {step === 3 && group ? (
          <>
            <Field label="Wishlist name" value={name} onChangeText={(t) => setName(t.slice(0, MAX_WISHLIST_NAME))} counter={{ value: name.length, max: MAX_WISHLIST_NAME }} placeholder={`${group.name} wants`} />
            <Text className="mb-2 font-display text-wink-ink">Preview</Text>
            <View className="rounded-card border border-wink-pink-border bg-white p-3">
              <Text className="font-display text-wink-ink">{name || `${group.name} wants`}</Text>
              <Text className="text-xs text-wink-muted">
                {group.name} · {total} cards
              </Text>
              <View className="mt-2 flex-row flex-wrap gap-1">
                {selected.slice(0, 12).map((id) => {
                  const c = searchCatalog({ groupId: group.id }).find((x) => x.id === id);
                  return c ? (
                    <View key={id} className="w-10">
                      <PhotocardImage groupId={c.groupId} memberName={c.memberName} imgSeed={c.imgSeed} />
                    </View>
                  ) : null;
                })}
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>
      <View className="px-4 pb-6 pt-2">
        {step === 1 ? <Button title="Continue" fullWidth disabled={!groupId} onPress={() => setStep(2)} /> : null}
        {step === 2 ? <Button title={`Continue with ${total} cards`} fullWidth disabled={!total} onPress={() => setStep(3)} /> : null}
        {step === 3 && group ? (
          <Button
            title="Save wishlist"
            fullWidth
            onPress={() => {
              const id = createWishlist({ name: (name || `${group.name} wants`).slice(0, MAX_WISHLIST_NAME), groupId: group.id, cardIds: selected, descriptions, priority: false, level: "medium", showOnProfile: false });
              router.replace(`/wishlists/${id}`);
            }}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

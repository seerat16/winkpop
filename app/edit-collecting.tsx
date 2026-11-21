import { useState } from "react";
import { Pressable, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, ChevronDown, ChevronUp, Star } from "lucide-react-native";
import { Button, Chip, Page, Text } from "@/components";
import { GROUPS } from "@/data";
import { useUserStore } from "@/data/userStore";
import { colors } from "@/theme/colors";

/**
 * Edit Collecting List (§24, §23S): filter All / Girl / Boy groups, selected
 * count, expand a group, pick "Full group" or individual members (each clears
 * the other), priority-tag groups, Done.
 */
export default function EditCollectingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ group?: string }>();
  const user = useUserStore((s) => s.user);
  const updateUser = useUserStore((s) => s.updateUser);
  const [members, setMembers] = useState<Record<string, string[]>>(() =>
    Object.fromEntries((user?.collectingGroupIds ?? []).map((g) => [g, user?.collectingMembers?.[g] ?? []])),
  );
  const [priority, setPriority] = useState<string[]>(user?.priorityGroupIds ?? []);
  const [gender, setGender] = useState<"all" | "girl" | "boy">("all");
  const [expanded, setExpanded] = useState<string | null>(params.group ?? null);

  const selectedCount = Object.keys(members).length;
  const toggleGroup = (id: string) =>
    setMembers((m) => {
      const n = { ...m };
      if (id in n) delete n[id];
      else n[id] = [];
      return n;
    });
  const pickMember = (groupId: string, memberId: string | "full") =>
    setMembers((m) => {
      const cur = m[groupId] ?? [];
      if (memberId === "full") return { ...m, [groupId]: [] };
      const next = cur.includes(memberId) ? cur.filter((x) => x !== memberId) : [...cur, memberId];
      return { ...m, [groupId]: next };
    });

  return (
    <Page
      title="Edit Collecting List"
      footer={
        <Button
          title="Done"
          fullWidth
          onPress={() => {
            updateUser({ collectingGroupIds: Object.keys(members), collectingMembers: members, priorityGroupIds: priority.filter((p) => p in members) });
            router.back();
          }}
        />
      }
    >
      <View className="mb-3 flex-row items-center gap-2">
        <Chip label="All" active={gender === "all"} onPress={() => setGender("all")} />
        <Chip label="Girl Groups" active={gender === "girl"} onPress={() => setGender("girl")} />
        <Chip label="Boy Groups" active={gender === "boy"} onPress={() => setGender("boy")} />
        <View className="flex-1" />
        <Text className="text-xs text-wink-muted">{selectedCount} selected</Text>
      </View>
      {GROUPS.filter((g) => gender === "all" || g.gender === gender).map((g) => {
        const on = g.id in members;
        const sel = members[g.id] ?? [];
        return (
          <View key={g.id} className="mb-2 rounded-card border bg-white" style={{ borderColor: on ? g.color : colors.pinkBorder }}>
            <View className="flex-row items-center gap-3 p-3">
              <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={() => toggleGroup(g.id)} className="h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: on ? g.color : "#eee" }}>
                {on ? <Check size={14} color={colors.white} /> : null}
              </Pressable>
              <Pressable className="flex-1" onPress={() => setExpanded(expanded === g.id ? null : g.id)}>
                <Text className="font-display text-wink-ink">{g.name}</Text>
                <Text className="text-xs text-wink-muted">{!on ? "Not collecting" : sel.length === 0 ? "Full group selected" : `${sel.length} idols selected`}</Text>
              </Pressable>
              {on ? (
                <Pressable accessibilityLabel="Priority" onPress={() => setPriority((p) => (p.includes(g.id) ? p.filter((x) => x !== g.id) : [...p, g.id]))}>
                  <Star size={18} color={colors.warn} fill={priority.includes(g.id) ? colors.warn : "none"} />
                </Pressable>
              ) : null}
              <Pressable accessibilityLabel="Expand" onPress={() => setExpanded(expanded === g.id ? null : g.id)}>
                {expanded === g.id ? <ChevronUp size={18} color={colors.muted} /> : <ChevronDown size={18} color={colors.muted} />}
              </Pressable>
            </View>
            {expanded === g.id ? (
              <View className="flex-row flex-wrap gap-2 px-3 pb-3">
                <Chip label="Full group" active={on && sel.length === 0} onPress={() => { if (!on) toggleGroup(g.id); pickMember(g.id, "full"); }} />
                {g.members.filter((m) => !m.former).map((m) => (
                  <Chip key={m.id} label={m.name} active={sel.includes(m.id)} activeColor={m.color} onPress={() => { if (!on) toggleGroup(g.id); pickMember(g.id, m.id); }} />
                ))}
              </View>
            ) : null}
          </View>
        );
      })}
    </Page>
  );
}

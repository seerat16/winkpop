import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { Camera, ScanLine } from "lucide-react-native";
import {
  Button,
  Card,
  Chip,
  Field,
  Notice,
  Page,
  PhotocardImage,
  SectionTitle,
  Tabs,
  Text,
  Toggle,
} from "@/components";
import {
  CATALOG,
  CATALOG_CATEGORIES,
  catalogTree,
  GROUPS,
  identifyCard,
  searchCatalog,
  suggestPriceForCatalog,
  type CatalogCard,
  type CatalogCategory,
} from "@/data";
import { useAppStore } from "@/data/appStore";
import { useUserStore } from "@/data/userStore";
import { colors } from "@/theme/colors";

type Tab = "browse" | "scan" | "contribute";

/**
 * Photocard database hub (§3): browse group → category → era → version →
 * member, search by visual attributes, scan a card to identify it and see its
 * value, and contribute scans / templates / new groups for points.
 */
export default function DatabaseScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("browse");
  const [groupId, setGroupId] = useState(GROUPS[0].id);
  const [category, setCategory] = useState<CatalogCategory>("Album");
  const [attrQuery, setAttrQuery] = useState("");
  const tree = useMemo(() => catalogTree(groupId, category), [groupId, category]);
  const attrResults = useMemo(() => (attrQuery.trim() ? searchCatalog({ query: attrQuery }).slice(0, 12) : []), [attrQuery]);

  return (
    <Page title="Photocard database">
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { key: "browse", label: "Browse" },
          { key: "scan", label: "Scan" },
          { key: "contribute", label: "Contribute" },
        ]}
      />
      <Text className="mb-3 text-xs text-wink-muted">{CATALOG.length.toLocaleString()} cards with standardized names · built from scanned templates</Text>

      {tab === "browse" ? (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
            <View className="flex-row gap-2">
              {GROUPS.map((g) => (
                <Chip key={g.id} label={g.name} active={g.id === groupId} activeColor={g.color} onPress={() => setGroupId(g.id)} />
              ))}
            </View>
          </ScrollView>
          <View className="mb-3 flex-row flex-wrap gap-2">
            {CATALOG_CATEGORIES.map((c) => (
              <Chip key={c} label={c} active={c === category} onPress={() => setCategory(c)} />
            ))}
          </View>
          <Field
            label="Search by visual attributes"
            placeholder="e.g. pink hair denim, heart hands cafe"
            value={attrQuery}
            onChangeText={setAttrQuery}
          />
          {attrResults.length ? <CardRow cards={attrResults} /> : null}

          {Object.entries(tree).map(([top, subs]) => (
            <View key={top} className="mb-3">
              <Text className="mb-1 font-display text-wink-ink">{top}</Text>
              {Object.entries(subs).map(([sub, cards]) => (
                <View key={sub} className="mb-2">
                  <Text className="mb-1 text-xs text-wink-muted">{sub}</Text>
                  <CardRow cards={cards} />
                </View>
              ))}
            </View>
          ))}
        </>
      ) : null}

      {tab === "scan" ? <ScanTab onOpen={(id) => router.push(`/catalog/${id}`)} /> : null}
      {tab === "contribute" ? <ContributeTab /> : null}
    </Page>
  );
}

function CardRow({ cards }: { cards: CatalogCard[] }) {
  const router = useRouter();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View className="flex-row gap-2">
        {cards.map((c) => (
          <Pressable key={c.id} onPress={() => router.push(`/catalog/${c.id}`)} className="w-20">
            <PhotocardImage groupId={c.groupId} memberName={c.memberName} imgSeed={c.imgSeed} />
            <Text className="mt-0.5 text-wink-ink" style={{ fontSize: 10 }} numberOfLines={1}>
              {c.memberName}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

/**
 * Scan a card (§3L–N). Real image recognition needs a camera module and a
 * matching model; this flow lets the user capture (simulated) and describe the
 * card, then identifies it against the database and shows its value.
 */
function ScanTab({ onOpen }: { onOpen: (id: string) => void }) {
  const [captured, setCaptured] = useState(false);
  const [hint, setHint] = useState("");
  const [result, setResult] = useState<CatalogCard | null | undefined>(undefined);
  const price = result ? suggestPriceForCatalog(result.id) : null;
  return (
    <>
      <Pressable
        accessibilityLabel="Capture card"
        onPress={() => setCaptured(true)}
        className="mb-3 h-56 items-center justify-center rounded-card border-2 border-dashed border-wink-pink-border bg-white"
      >
        {captured ? <ScanLine size={40} color={colors.mint} /> : <Camera size={40} color={colors.muted} />}
        <Text className="mt-2 text-sm text-wink-muted">{captured ? "Photo captured ✓" : "Tap to take a well-lit photo"}</Text>
      </Pressable>
      <Field label="Who / what is on the card?" placeholder="e.g. Karina Whiplash album" value={hint} onChangeText={setHint} />
      <Button title="Identify card" fullWidth disabled={!captured || !hint.trim()} onPress={() => setResult(identifyCard(hint) ?? null)} />
      {result === null ? <Notice tone="error" text="No match yet — submit it to the database from the Contribute tab." /> : null}
      {result ? (
        <Card className="mt-3">
          <Text className="font-display text-wink-ink">{result.name}</Text>
          {price ? (
            <Text className="mt-1 text-sm text-wink-ink">
              Estimated value <Text className="font-display text-wink-pink">${price.suggested.toFixed(2)}</Text> (range ${price.low.toFixed(0)}–${price.high.toFixed(0)})
            </Text>
          ) : null}
          <View className="mt-3">
            <Button title="Open database entry" size="sm" onPress={() => onOpen(result.id)} />
          </View>
        </Card>
      ) : null}
    </>
  );
}

function ContributeTab() {
  const submit = useAppStore((s) => s.submitToDatabase);
  const submissions = useAppStore((s) => s.submissions);
  const points = useUserStore((s) => s.user?.points ?? 0);
  const premium = useUserStore((s) => s.user?.premium ?? false);
  const updateUser = useUserStore((s) => s.updateUser);
  const [kind, setKind] = useState<"scan" | "template" | "group">("scan");
  const [groupName, setGroupName] = useState("");
  const [memberName, setMemberName] = useState("");
  const [era, setEra] = useState("");
  const [description, setDescription] = useState("");
  const [earned, setEarned] = useState(0);

  return (
    <>
      <Notice text={`You have ${points} points. Uploads to the database earn points you can spend on fees and promos.`} />
      <View className="mb-3 flex-row gap-2">
        <Chip label="Card scan (+20)" active={kind === "scan"} onPress={() => setKind("scan")} />
        <Chip label="Template (+50)" active={kind === "template"} onPress={() => setKind("template")} />
        <Chip label="New group (+100)" active={kind === "group"} onPress={() => setKind("group")} />
      </View>
      <Field label="Group" value={groupName} onChangeText={setGroupName} placeholder="e.g. ILLIT" />
      {kind !== "group" ? <Field label="Member" value={memberName} onChangeText={setMemberName} /> : null}
      <Field label={kind === "group" ? "Members & eras" : "Era / album"} value={era} onChangeText={setEra} />
      <Field label="Description" multiline value={description} onChangeText={setDescription} placeholder="Store, version, anything that helps identify it" />
      <Button
        title="Upload photo & submit"
        fullWidth
        icon={<Camera size={16} color={colors.white} />}
        disabled={!groupName.trim()}
        onPress={() => {
          setEarned(submit({ kind, groupName, memberName, era, description }));
          setGroupName("");
          setMemberName("");
          setEra("");
          setDescription("");
        }}
      />
      {earned ? <Notice tone="success" text={`Submitted for review — +${earned} points!`} /> : null}

      <SectionTitle title="Make a template in-app" />
      <Text className="mb-2 text-sm text-wink-muted">
        Personal templates for your wishlist / ISO are built from the database — start one from Wishlists → New. Templates you publish here are credited to you when added to the database.
      </Text>

      <SectionTitle title="Watermark-free cards" />
      <Toggle
        label="WinKPop Plus"
        sub="View & save database images without watermarks for printing, plus bulk upload tools and price alerts ($3.99/mo)"
        value={premium}
        onChange={(v) => updateUser({ premium: v })}
      />

      {submissions.length ? (
        <>
          <SectionTitle title="Your submissions" />
          {submissions.map((s) => (
            <View key={s.id} className="flex-row justify-between border-b border-wink-pink-border py-2">
              <Text className="text-sm text-wink-ink">
                {s.groupName} {s.memberName} · {s.kind}
              </Text>
              <Text className="text-xs text-wink-muted">
                {s.status} · +{s.points}
              </Text>
            </View>
          ))}
        </>
      ) : null}
    </>
  );
}

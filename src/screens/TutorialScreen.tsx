import { Linking } from "@/rn";
import { useLocalSearchParams, useRouter } from "@/rn/router";
import { Button, Card, Page, SectionTitle, Text } from "@/components";
import { GLOSSARY, PACKING_GUIDE, SUPPLIES_BUNDLE_URL, TRADING_TUTORIAL } from "@/data";

/** Collecting tutorial, glossary (§1K–L) and packing/shipping guide (§19H). */
export default function TutorialScreen() {
  const { section } = useLocalSearchParams<{ section?: string }>();
  const router = useRouter();
  const packingFirst = section === "packing";
  const packing = (
    <>
      <SectionTitle title="Packing & shipping guide" />
      <Card>
        {PACKING_GUIDE.map((s, i) => (
          <Text key={s} className="mb-1 text-sm text-wink-ink">
            {i + 1}. {s}
          </Text>
        ))}
      </Card>
    </>
  );
  return (
    <Page title="Tutorial & glossary">
      {packingFirst ? packing : null}
      <SectionTitle title="How trading works" />
      <Card>
        {TRADING_TUTORIAL.map((s, i) => (
          <Text key={s} className="mb-1 text-sm text-wink-ink">
            {i + 1}. {s}
          </Text>
        ))}
      </Card>
      {!packingFirst ? packing : null}
      <SectionTitle title="Glossary" />
      {GLOSSARY.map((g) => (
        <Card key={g.term} className="mb-2">
          <Text className="font-display text-wink-ink">{g.term}</Text>
          <Text className="text-sm text-wink-muted">{g.meaning}</Text>
        </Card>
      ))}
      <Button title="Shop a starter supplies bundle" variant="secondary" fullWidth onPress={() => Linking.openURL(SUPPLIES_BUNDLE_URL)} />
      <Button title="Start collecting" fullWidth onPress={() => router.replace("/(tabs)/home")} />
    </Page>
  );
}

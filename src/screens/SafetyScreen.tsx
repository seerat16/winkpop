import { useState } from "react";
import { View } from "@/rn";
import { Button, Card, Chip, Field, Notice, Page, SectionTitle, Text } from "@/components";
import { FAKE_CARD_REPORTS, MAX_STRIKES } from "@/data";
import { useAppStore } from "@/data/appStore";
import { useUserStore } from "@/data/userStore";

const PLATFORMS = ["Mercari", "eBay", "Instagram", "X"] as const;

/**
 * Safety centre (§22): crowd-sourced fake card database, report a scam /
 * DWAYOR or fake card, proof verification cross-referenced with other
 * platforms, the three-strikes policy, and the non-delivery / fake-card
 * contingencies.
 */
export default function SafetyScreen() {
  const report = useAppStore((s) => s.report);
  const reports = useAppStore((s) => s.reports);
  const strikes = useUserStore((s) => s.user?.strikes ?? 0);
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]>("Mercari");
  const [handle, setHandle] = useState("");
  const [verified, setVerified] = useState<string[]>([]);
  const [scam, setScam] = useState("");
  const [sent, setSent] = useState(false);
  const fakes = FAKE_CARD_REPORTS.filter((f) => !query || f.catalogName.toLowerCase().includes(query.toLowerCase()));

  return (
    <Page title="Safety centre">
      <SectionTitle title="Fake card database" />
      <Field placeholder="Search a card" value={query} onChangeText={setQuery} />
      {fakes.map((f) => (
        <Card key={f.id} className="mb-2">
          <Text className="font-display text-sm text-wink-ink">{f.catalogName}</Text>
          <Text className="text-xs text-wink-muted">Tells: {f.tells}</Text>
          <Text className="text-xs text-wink-pink">{f.reports} community reports</Text>
        </Card>
      ))}

      <SectionTitle title="Report a scam / DWAYOR or fake card" />
      <Field label="Username and what happened" multiline value={scam} onChangeText={setScam} />
      <Button
        title="Submit report"
        fullWidth
        disabled={!scam.trim()}
        onPress={() => {
          report({ targetKind: "user", targetId: scam.split(/\s/)[0].replace("@", ""), reason: "Scam / DWAYOR", details: scam });
          setScam("");
          setSent(true);
        }}
      />
      {sent ? <Notice tone="success" text={`Report received (${reports.length} total). We'll follow up in Messages.`} /> : null}

      <SectionTitle title="Verify your proofs" />
      <Text className="mb-2 text-xs text-wink-muted">Link your history elsewhere so buyers can see it — counts towards your proof badge tier.</Text>
      <View className="mb-2 flex-row flex-wrap gap-2">
        {PLATFORMS.map((p) => (
          <Chip key={p} label={`${verified.includes(p) ? "✓ " : ""}${p}`} active={platform === p} onPress={() => setPlatform(p)} />
        ))}
      </View>
      <Field label={`${platform} username`} autoCapitalize="none" value={handle} onChangeText={setHandle} />
      <Button size="sm" title="Cross-reference" disabled={!handle.trim()} onPress={() => { setVerified((v) => [...new Set([...v, platform])]); setHandle(""); }} />

      <SectionTitle title="Our policies" />
      <Card>
        <Text className="mb-2 text-sm text-wink-ink">
          🚫 Three strikes: accounts are banned after {MAX_STRIKES} confirmed violations. You have {strikes} strike{strikes === 1 ? "" : "s"}.
        </Text>
        <Text className="mb-2 text-sm text-wink-ink">📦 Non-delivery: if a card isn&apos;t received in time, the sender is charged the card&apos;s full price.</Text>
        <Text className="mb-2 text-sm text-wink-ink">🔍 Fake card: the card is returned, the trade is cancelled, and the sender pays the other card&apos;s shipping.</Text>
        <Text className="text-sm text-wink-ink">🛡️ Payment is held until delivery is confirmed. Cards over $50 can be authenticated before they ship.</Text>
      </Card>
    </Page>
  );
}

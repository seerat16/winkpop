import { useState } from "react";
import { View } from "@/rn";
import { Button, Card, Chip, Field, Notice, Page, SectionTitle, Text, Toggle } from "@/components";
import { COUPONS, monthlySpend, PAYMENT_LABELS, type PaymentMethod } from "@/data";
import { useAppStore } from "@/data/appStore";
import { useUserStore } from "@/data/userStore";
import { isBackendConfigured } from "@/lib/backend";
import { openStripe, startPayoutOnboarding } from "@/lib/payments";
import { useLocalSearchParams } from "@/rn/router";

const REWARDS = [
  { points: 200, code: "WINK10", label: "10% off an order" },
  { points: 400, code: "FIRSTTRADE", label: "One order with no service fee" },
  { points: 500, code: "WELCOME5", label: "$5 off" },
];

/**
 * Payments, wallet & points (§20): payment methods, balance (available +
 * held), sale and payout history, transfer to bank, coupons, loyalty points
 * (earned from database uploads) and redemption, premium tools, and a
 * monthly spending limit tracker.
 */
export default function PaymentsScreen() {
  const user = useUserStore((s) => s.user);
  const updateUser = useUserStore((s) => s.updateUser);
  const transfer = useUserStore((s) => s.transferBalance);
  const redeem = useUserStore((s) => s.redeemPoints);
  const orders = useAppStore((s) => s.orders);
  const [amount, setAmount] = useState("");
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [limit, setLimit] = useState(user?.spendingLimit?.toString() ?? "");
  const [offApp, setOffApp] = useState("");
  const { payouts } = useLocalSearchParams<{ payouts?: string }>();
  const [onboarding, setOnboarding] = useState(false);
  const live = isBackendConfigured();
  if (!user) return null;

  const setUpPayouts = async () => {
    setOnboarding(true);
    try {
      const r = await startPayoutOnboarding();
      if (!r.demo) openStripe(r.url);
      else setMsg({ tone: "success", text: "Demo mode: payouts are simulated. Add Supabase + Stripe keys to go live (docs/PAYMENTS.md)." });
    } catch (e) {
      setMsg({ tone: "error", text: (e as Error).message });
    } finally {
      setOnboarding(false);
    }
  };

  const sales = orders.filter((o) => o.kind === "sell");
  const spent = monthlySpend(orders, user.offAppSpend);
  const methods: PaymentMethod[] = ["card", "apple_pay", "google_pay", "paypal", "venmo", "zelle", "klarna"];

  return (
    <Page title="Payments & wallet">
      {msg ? <Notice tone={msg.tone} text={msg.text} /> : null}
      <Card>
        <Text className="text-xs text-wink-muted">Available balance</Text>
        <Text className="font-display text-3xl text-wink-ink">${user.walletBalance.toFixed(2)}</Text>
        <Text className="text-xs text-wink-muted">${user.pendingBalance.toFixed(2)} held until buyers confirm delivery</Text>
        <View className="mt-3 flex-row items-end gap-2">
          <View className="flex-1">
            <Field label="Transfer to bank ($)" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
          </View>
          <View className="mb-3">
            <Button
              size="sm"
              title="Transfer"
              onPress={() => {
                const r = transfer(Number(amount));
                setMsg(r.success ? { tone: "success", text: `$${Number(amount).toFixed(2)} is on its way — instant payout, usually within minutes.` } : { tone: "error", text: r.error ?? "Transfer failed" });
                setAmount("");
              }}
            />
          </View>
        </View>
      </Card>

      <SectionTitle title="Get paid" />
      <Card>
        <Text className="text-sm text-wink-ink">
          Payouts go straight to your bank through Stripe. WinKPop charges no seller fees — you keep 100% of the sale price.
        </Text>
        {payouts === "done" ? <Notice tone="success" text="Thanks! Stripe is verifying your details — you can list for sale as soon as it's approved." /> : null}
        {payouts === "refresh" ? <Notice tone="error" text="That link expired. Tap below to continue setting up payouts." /> : null}
        <View className="mt-3">
          <Button title={live ? "Set up payouts with Stripe" : "Set up payouts (demo)"} fullWidth loading={onboarding} onPress={setUpPayouts} />
        </View>
      </Card>

      <SectionTitle title="Payment methods" />
      <View className="flex-row flex-wrap gap-2">
        {methods.map((m) => (
          <Chip
            key={m}
            label={PAYMENT_LABELS[m]}
            active={user.paymentMethods.includes(m)}
            onPress={() => updateUser({ paymentMethods: user.paymentMethods.includes(m) ? user.paymentMethods.filter((x) => x !== m) : [...user.paymentMethods, m] })}
          />
        ))}
      </View>

      <SectionTitle title="Sale history & payouts" />
      {sales.length === 0 ? <Text className="text-sm text-wink-muted">No sales yet.</Text> : null}
      {sales.map((o) => (
        <View key={o.id} className="flex-row justify-between border-b border-wink-pink-border py-2">
          <Text className="flex-1 text-sm text-wink-ink" numberOfLines={1}>
            {o.cardTitle}
          </Text>
          <Text className="text-sm text-wink-muted">
            +${o.amount.toFixed(2)} · {o.status === "completed" ? "paid out" : "held"}
          </Text>
        </View>
      ))}

      <SectionTitle title={`Points: ${user.points}`} />
      <Text className="mb-2 text-xs text-wink-muted">Earn points by uploading scans & templates to the database, then redeem them here.</Text>
      {REWARDS.map((r) => (
        <View key={r.code} className="flex-row items-center justify-between border-b border-wink-pink-border py-2">
          <Text className="text-sm text-wink-ink">
            {r.label} · {r.points} pts
          </Text>
          <Button
            size="sm"
            variant="secondary"
            title="Redeem"
            disabled={user.points < r.points}
            onPress={() => {
              const res = redeem(r.points, r.code);
              setMsg(res.success ? { tone: "success", text: `Added coupon ${r.code} to your account.` } : { tone: "error", text: res.error ?? "" });
            }}
          />
        </View>
      ))}
      <SectionTitle title="Coupons & credits" />
      <View className="flex-row flex-wrap gap-2">
        {user.coupons.length === 0 ? <Text className="text-sm text-wink-muted">No coupons yet.</Text> : null}
        {user.coupons.map((c) => (
          <Chip key={c} label={`${c} · ${COUPONS[c]?.label ?? ""}`} />
        ))}
      </View>

      <SectionTitle title="WinKPop Plus" />
      <Toggle
        label="Premium tools"
        sub="Promoted listings, bulk upload, collection analytics, cross-platform price alerts, watermark-free database images"
        value={user.premium}
        onChange={(v) => updateUser({ premium: v })}
      />

      <SectionTitle title="Spending limit" />
      <Card>
        <Text className="text-sm text-wink-ink">
          This month: <Text className="font-display">${spent.toFixed(2)}</Text>
          {user.spendingLimit ? ` of $${user.spendingLimit.toFixed(0)}` : ""}
        </Text>
        {user.spendingLimit ? (
          <View className="mt-2 h-2 overflow-hidden rounded-full bg-wink-purple-tint">
            <View className="h-full" style={{ width: `${Math.min(100, (spent / user.spendingLimit) * 100)}%`, backgroundColor: spent > user.spendingLimit ? "#D9534F" : "#5CC0A8" }} />
          </View>
        ) : null}
        <View className="mt-2 flex-row gap-2">
          <View className="flex-1">
            <Field label="Monthly limit ($)" keyboardType="decimal-pad" value={limit} onChangeText={setLimit} />
          </View>
          <View className="flex-1">
            <Field label="Add off-app spend ($)" keyboardType="decimal-pad" value={offApp} onChangeText={setOffApp} />
          </View>
        </View>
        <Button
          size="sm"
          title="Save"
          onPress={() => {
            updateUser({ spendingLimit: Number(limit) || undefined, offAppSpend: user.offAppSpend + (Number(offApp) || 0) });
            setOffApp("");
          }}
        />
      </Card>
    </Page>
  );
}

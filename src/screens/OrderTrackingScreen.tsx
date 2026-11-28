import { useState } from "react";
import { View } from "@/rn";
import { useLocalSearchParams, useRouter } from "@/rn/router";
import { Check, Video } from "lucide-react";
import { Button, Card, EmptyState, Field, Notice, Page, PhotocardImage, ReportSheet, SectionTitle, StatusPill, Text } from "@/components";
import { customsFees, getCommunityUser, ORDER_STEPS, SHIPPING_METHOD_LABELS } from "@/data";
import { getAnyListing, useAppStore } from "@/data/appStore";
import { useUserStore } from "@/data/userStore";
import { colors } from "@/theme/colors";
import { confirmDelivery, markShipped } from "@/lib/payments";
import { isLiveId } from "@/lib/liveSync";

/**
 * Order tracking (§18H–J, §19E–F, §22E): label, each shipping step, drop-off
 * video proof for stamped mail, customs for international, confirm received
 * (releases held payment), then review.
 */
export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const order = useAppStore((s) => s.orders.find((o) => o.id === id));
  const advance = useAppStore((s) => s.advanceOrder);
  const confirm = useAppStore((s) => s.confirmReceived);
  const mergeLiveOrders = useAppStore((s) => s.mergeLiveOrders);
  const uploadProof = useAppStore((s) => s.uploadProof);
  const country = useUserStore((s) => s.user?.country ?? "US");
  const [report, setReport] = useState(false);
  const [tracking, setTracking] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  if (!order) return <Page title="Tracking">{<EmptyState title="Order not found" />}</Page>;
  const live = isLiveId(order.id);
  const card = getAnyListing(order.cardIds[0]);
  const stamped = order.shippingMethod.includes("Stamped");
  const partnerCountry = getCommunityUser(order.counterparty)?.country ?? country;
  const intl = partnerCountry !== country;
  const customs = intl ? customsFees(order.kind === "buy" ? country : partnerCountry, order.amount) : null;
  const iShip = order.kind === "sell" || order.kind === "trade";

  return (
    <Page title="Order details">
      <Card className="flex-row items-center gap-3">
        {card ? (
          <View className="w-14">
            <PhotocardImage groupId={card.groupId} memberName={card.memberName} imgSeed={card.imgSeed} />
          </View>
        ) : null}
        <View className="flex-1">
          <Text className="font-display text-wink-ink">{order.cardTitle}</Text>
          <Text className="text-xs text-wink-muted">
            {order.kind === "buy" ? "from" : order.kind === "sell" ? "to" : "with"} @{order.counterparty} · {order.createdAt.slice(0, 10)}
          </Text>
          <View className="mt-1 flex-row items-center gap-2">
            <StatusPill status={order.status} />
            {order.kind !== "trade" ? <Text className="font-display text-wink-ink">${order.amount.toFixed(2)}</Text> : null}
          </View>
        </View>
      </Card>

      <SectionTitle title="Shipping label" />
      <Card>
        <Text className="text-sm text-wink-ink">{SHIPPING_METHOD_LABELS[order.shippingMethod]}</Text>
        <Text className="font-display text-wink-ink">{stamped ? "Stamped — no tracking number" : order.trackingNumber}</Text>
        {customs ? <Text className="mt-1 text-xs text-wink-muted">{customs.label}: ${customs.amount.toFixed(2)} (paid by recipient)</Text> : null}
      </Card>

      <SectionTitle title="Progress" />
      <Card>
        {ORDER_STEPS.map((s, i) => (
          <View key={s} className="flex-row items-center gap-3 py-1.5">
            <View className="h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: i <= order.step ? colors.mint : "#eee" }}>
              {i <= order.step ? <Check size={14} color={colors.white} /> : null}
            </View>
            <Text className={i <= order.step ? "text-wink-ink" : "text-wink-muted"}>{s}</Text>
          </View>
        ))}
      </Card>

      {iShip && stamped ? (
        <View className="mt-3">
          {order.proofVideo ? (
            <Notice tone="success" text="Drop-off video uploaded ✓" />
          ) : (
            <Button title="Upload drop-off video (required for stamped)" variant="secondary" fullWidth icon={<Video size={16} color={colors.ink} />} onPress={() => uploadProof(order.id)} />
          )}
        </View>
      ) : null}

      <View className="mt-4 gap-2">
        {err ? <Text className="text-center text-sm text-wink-pink">{err}</Text> : null}
        {!live && order.step < 4 ? <Button title="Refresh tracking (simulate carrier scan)" variant="secondary" fullWidth onPress={() => advance(order.id)} /> : null}
        {live && order.kind === "sell" && order.step < 3 ? (
          <>
            <Field label="Tracking number (optional for stamped)" value={tracking} onChangeText={setTracking} />
            <Button
              title="Mark shipped"
              fullWidth
              loading={busy}
              onPress={async () => {
                setBusy(true);
                setErr("");
                try {
                  await markShipped(order.id, tracking);
                  mergeLiveOrders([{ ...order, status: "in_transit", step: 3, trackingNumber: tracking || order.trackingNumber }]);
                } catch (e) {
                  setErr((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            />
          </>
        ) : null}
        {order.kind !== "sell" && order.status !== "completed" ? (
          <Button
            title="Confirm received"
            variant="mint"
            fullWidth
            loading={busy}
            onPress={async () => {
              if (!live) return confirm(order.id);
              // Live order: the server releases the held payment to the seller.
              setBusy(true);
              setErr("");
              try {
                await confirmDelivery(order.id);
                mergeLiveOrders([{ ...order, status: "completed", step: 5 }]);
              } catch (e) {
                setErr((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          />
        ) : null}
        {order.status === "completed" && !order.reviewed ? <Button title="Leave a review" fullWidth onPress={() => router.push(`/review/${order.id}`)} /> : null}
        <Button title="Packing & shipping guide" variant="ghost" fullWidth onPress={() => router.push("/tutorial?section=packing")} />
        <Button title="Report a problem" variant="ghost" fullWidth onPress={() => setReport(true)} />
      </View>
      <Text className="mt-3 text-xs text-wink-muted">
        Buyer protection: payment is held until delivery is confirmed. If a card doesn&apos;t arrive in time, the sender is charged its full price.
      </Text>
      <ReportSheet visible={report} onClose={() => setReport(false)} targetKind="user" targetId={order.counterparty} />
    </Page>
  );
}

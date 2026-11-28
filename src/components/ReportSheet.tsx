import { useState } from "react";
import { View } from "@/rn";
import { REPORT_REASONS, type Report, type ReportReason } from "@/data";
import { useAppStore } from "@/data/appStore";
import { Button, Chip } from "./ui";
import { Field, Notice, Sheet } from "./primitives";

/** Report a listing, user, post or message (§22C, §22J). */
export function ReportSheet({
  visible,
  onClose,
  targetKind,
  targetId,
}: {
  visible: boolean;
  onClose: () => void;
  targetKind: Report["targetKind"];
  targetId: string;
}) {
  const report = useAppStore((s) => s.report);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <Sheet
      visible={visible}
      onClose={() => {
        setSent(false);
        setReason(null);
        setDetails("");
        onClose();
      }}
      title={`Report ${targetKind}`}
    >
      {sent ? (
        <Notice tone="success" text="Thanks — our trust & safety team will review this. Accounts with three confirmed strikes are banned." />
      ) : (
        <>
          <View className="mb-3 flex-row flex-wrap gap-2">
            {REPORT_REASONS.map((r) => (
              <Chip key={r} label={r} active={reason === r} onPress={() => setReason(r)} />
            ))}
          </View>
          <Field label="Details (optional)" multiline value={details} onChangeText={setDetails} placeholder="What happened? Links to proofs help." />
          <Button
            title="Submit report"
            fullWidth
            disabled={!reason}
            onPress={() => {
              if (!reason) return;
              report({ targetKind, targetId, reason, details });
              setSent(true);
            }}
          />
        </>
      )}
    </Sheet>
  );
}

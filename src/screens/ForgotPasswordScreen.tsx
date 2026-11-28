import { useState } from "react";
import { Button, Field, Notice, Page } from "@/components";
import { useUserStore } from "@/data/userStore";
import { auth, isBackendConfigured } from "@/lib/backend";

/** "Forgot password?" from the login screen (§1Q). */
export default function ForgotPasswordScreen() {
  const requestReset = useUserStore((s) => s.requestPasswordReset);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<{ ok?: boolean; error?: string }>({});
  return (
    <Page title="Reset password">
      <Field
        label="Email address"
        placeholder="you@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        error={state.error}
      />
      {state.ok ? <Notice tone="success" text={`If ${email} has an account, a reset link is on its way.`} /> : null}
      <Button
        title="Send reset link"
        fullWidth
        onPress={async () => {
          const r = requestReset(email);
          if (!r.success) return setState({ error: r.error });
          if (isBackendConfigured()) {
            // Always show the same message so the form can't be used to discover accounts.
            await auth.resetPassword(email.trim()).catch(() => undefined);
          }
          setState({ ok: true });
        }}
      />
    </Page>
  );
}

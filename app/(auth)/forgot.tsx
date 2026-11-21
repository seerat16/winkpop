import { useState } from "react";
import { Button, Field, Notice, Page } from "@/components";
import { useUserStore } from "@/data/userStore";

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
        onPress={() => {
          const r = requestReset(email);
          setState(r.success ? { ok: true } : { error: r.error });
        }}
      />
    </Page>
  );
}

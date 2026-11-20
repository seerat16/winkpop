import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useRouter } from "expo-router";
import { Check, Instagram } from "lucide-react-native";
import { Button, Card, Field, Page, Tabs, Text, UserRow } from "@/components";
import { COMMUNITY_USERS } from "@/data/community";
import { EMPTY } from "@/data/appStore";
import { useUserStore } from "@/data/userStore";
import { colors } from "@/theme/colors";

type Step = "credentials" | "permissions" | "connecting" | "mutuals";
type Tab = "mutuals" | "following" | "followers";

const PERMISSIONS = [
  "Your Instagram username and profile photo",
  "Accounts you follow and that follow you (to find mutuals)",
  "We never post without asking, and never read your DMs",
];

/**
 * Log in with Instagram (§1J, §1R, §1S): credentials → see what data we access
 * → connection progress → browse Mutuals / Following / Followers, see who is
 * already on WinKPop and follow them before continuing.
 */
export default function InstagramConnectScreen() {
  const router = useRouter();
  const loginWithProvider = useUserStore((s) => s.loginWithProvider);
  const toggleFollow = useUserStore((s) => s.toggleFollow);
  const following = useUserStore((s) => s.user?.following ?? EMPTY);
  const [step, setStep] = useState<Step>("credentials");
  const [handle, setHandle] = useState("");
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState<Tab>("mutuals");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (step !== "connecting") return;
    const t = setInterval(() => setProgress((p) => Math.min(100, p + 20)), 300);
    return () => clearInterval(t);
  }, [step]);
  useEffect(() => {
    if (step === "connecting" && progress >= 100) {
      loginWithProvider("instagram");
      setStep("mutuals");
    }
  }, [progress, step, loginWithProvider]);

  const lists: Record<Tab, string[]> = {
    mutuals: COMMUNITY_USERS.filter((u) => u.instagramMutual).map((u) => u.username),
    following: COMMUNITY_USERS.slice(0, 5).map((u) => u.username),
    followers: COMMUNITY_USERS.slice(2).map((u) => u.username),
  };
  const notOnApp = ["jeanie_pcs", "felix.binder", "once.trades"];

  return (
    <Page title="Connect Instagram">
      {step === "credentials" ? (
        <>
          <View className="my-4 items-center">
            <Instagram size={40} color={colors.pink} />
          </View>
          <Field label="Instagram username" autoCapitalize="none" value={handle} onChangeText={setHandle} placeholder="@yourhandle" />
          <Field label="Password" secureTextEntry value={password} onChangeText={setPassword} placeholder="••••••••" />
          <Button title="Continue" fullWidth disabled={!handle || !password} onPress={() => setStep("permissions")} />
        </>
      ) : null}

      {step === "permissions" ? (
        <>
          <Text className="mb-3 mt-2 font-display text-wink-ink">WinKPop will be able to see:</Text>
          <Card>
            {PERMISSIONS.map((p) => (
              <View key={p} className="flex-row items-start gap-2 py-1.5">
                <Check size={16} color={colors.mint} />
                <Text className="flex-1 text-sm text-wink-ink">{p}</Text>
              </View>
            ))}
          </Card>
          <View className="mt-4 gap-2">
            <Button title="Allow & connect" fullWidth onPress={() => setStep("connecting")} />
            <Button title="Cancel" variant="ghost" fullWidth onPress={() => router.back()} />
          </View>
        </>
      ) : null}

      {step === "connecting" ? (
        <View className="items-center py-16">
          <ActivityIndicator color={colors.pink} />
          <Text className="mt-4 font-display text-wink-ink">Connecting @{handle.replace("@", "")}…</Text>
          <View className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white">
            <View className="h-full bg-wink-pink" style={{ width: `${progress}%` }} />
          </View>
          <Text className="mt-2 text-xs text-wink-muted">{progress}%</Text>
        </View>
      ) : null}

      {step === "mutuals" ? (
        <>
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { key: "mutuals", label: "Mutuals" },
              { key: "following", label: "Following" },
              { key: "followers", label: "Followers" },
            ]}
          />
          <Text className="mb-1 text-xs text-wink-muted">On WinKPop</Text>
          {lists[tab].map((u) => (
            <UserRow
              key={u}
              username={u}
              onPress={() => undefined}
              right={
                <Button
                  size="sm"
                  title={following.includes(u) ? "Following" : "Follow"}
                  variant={following.includes(u) ? "secondary" : "primary"}
                  onPress={() => toggleFollow(u)}
                />
              }
            />
          ))}
          {tab === "mutuals" ? (
            <>
              <Text className="mb-1 mt-4 text-xs text-wink-muted">Not on WinKPop yet — invite them</Text>
              {notOnApp.map((u) => (
                <View key={u} className="flex-row items-center justify-between border-b border-wink-pink-border py-3">
                  <Text className="text-wink-ink">@{u}</Text>
                  <Button size="sm" variant="secondary" title="Invite" onPress={() => router.push(`/share?kind=invite&id=${u}`)} />
                </View>
              ))}
            </>
          ) : null}
          <View className="mt-6">
            <Button title="Continue" fullWidth onPress={() => router.replace("/(auth)/onboarding")} />
          </View>
        </>
      ) : null}
    </Page>
  );
}

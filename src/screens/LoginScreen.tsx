import { Pressable, SafeAreaView, ScrollView, TextInput, View } from "@/rn";
import { useEffect, useState } from "react";
import { useRouter } from "@/rn/router";
import { Eye, EyeOff, Mail, Lock, Sparkles } from "lucide-react";
import { Button, Logo, Text } from "@/components";
import { useUserStore } from "@/data/userStore";
import { colors } from "@/theme/colors";
import { auth, isBackendConfigured } from "@/lib/backend";

export default function LoginScreen() {
  const router = useRouter();
  const login = useUserStore((s) => s.login);
  const signup = useUserStore((s) => s.signup);
  const loginDemo = useUserStore((s) => s.loginDemo);
  const loginWithProvider = useUserStore((s) => s.loginWithProvider);

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const [busy, setBusy] = useState(false);

  // Returning from Google sign-in: Supabase puts the tokens in the URL fragment.
  useEffect(() => {
    if (!isBackendConfigured() || !window.location.hash.includes("access_token")) return;
    auth
      .fromRedirect(window.location.hash)
      .then((s) => {
        window.history.replaceState(null, "", window.location.pathname);
        if (s) {
          loginWithProvider("google");
          router.replace("/(tabs)/home");
        }
      })
      .catch((e: Error) => setError(e.message));
  }, [loginWithProvider, router]);

  const handleContinue = async () => {
    setError("");
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    if (mode === "signup" && password.length < 8) {
      setError("Passwords need at least 8 characters.");
      return;
    }
    if (isBackendConfigured()) {
      // Real account: Supabase Auth verifies the password server-side.
      setBusy(true);
      try {
        if (mode === "login") await auth.signIn(email.trim(), password);
        else if (!(await auth.signUp(email.trim(), password))) {
          setError("Check your inbox to confirm your email, then log in.");
          setMode("login");
          return;
        }
      } catch (e) {
        setError((e as Error).message);
        return;
      } finally {
        setBusy(false);
      }
    }
    const result = mode === "login" ? login(email, password) : signup(email, password);
    if (!result.success) {
      setError(result.error ?? "Something went wrong.");
      return;
    }
    router.replace(mode === "signup" ? "/(auth)/onboarding" : "/(tabs)/home");
  };

  return (
    <SafeAreaView className="flex-1 bg-wink-purple-tint">
      <View className="flex-1">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero header — decorative blobs give depth without custom assets */}
          <View className="items-center pt-12 pb-8 px-6">
            {/* Decorative backdrop blobs */}
            <View
              style={{
                position: "absolute",
                top: -20,
                left: -40,
                width: 220,
                height: 220,
                borderRadius: 110,
                backgroundColor: colors.pinkTint,
                opacity: 0.8,
              }}
            />
            <View
              style={{
                position: "absolute",
                top: 20,
                right: -60,
                width: 180,
                height: 180,
                borderRadius: 90,
                backgroundColor: colors.purpleTint,
                opacity: 0.9,
              }}
            />

            <Logo size={100} />
            <Text
              className="mt-3 text-base text-wink-muted text-center"
              style={{ fontFamily: "Poppins_400Regular" }}
            >
              Your photocard universe, all in one place
            </Text>
          </View>

          {/* Main card */}
          <View
            className="mx-4 rounded-card bg-white px-6 pt-6 pb-8"
            style={{ boxShadow: "0 8px 24px rgba(201, 168, 224, 0.18)" }}
          >
            {/* Mode toggle — pill style */}
            <View className="mb-6 flex-row rounded-pill bg-wink-purple-tint p-1">
              {(["login", "signup"] as const).map((tab) => (
                <Pressable
                  key={tab}
                  onPress={() => {
                    setMode(tab);
                    setError("");
                  }}
                  className={`flex-1 items-center rounded-pill py-2.5 ${
                    mode === tab ? "bg-wink-pink" : ""
                  }`}
                  style={mode === tab ? { boxShadow: "0 4px 8px rgba(212, 117, 154, 0.3)" } : undefined}
                >
                  <Text
                    className={`text-sm font-display ${
                      mode === tab ? "text-white" : "text-wink-muted"
                    }`}
                  >
                    {tab === "login" ? "Log In" : "Sign Up"}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View className="gap-4">
              {/* Email field */}
              <View>
                <Text className="mb-1.5 text-xs text-wink-muted" style={{ marginLeft: 2 }}>
                  Email address
                </Text>
                <View
                  className="flex-row items-center rounded-card bg-wink-purple-tint px-4"
                  style={{
                    borderWidth: 1.5,
                    borderColor: emailFocused ? colors.purpleSoft : "transparent",
                  }}
                >
                  <Mail size={16} color={emailFocused ? colors.purple : colors.muted} />
                  <TextInput
                    placeholder="you@example.com"
                    placeholderTextColor={colors.muted}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    className="ml-3 flex-1 py-3.5 text-wink-ink"
                    style={{ fontSize: 15 }}
                  />
                </View>
              </View>

              {/* Password field */}
              <View>
                <Text className="mb-1.5 text-xs text-wink-muted" style={{ marginLeft: 2 }}>
                  Password
                </Text>
                <View
                  className="flex-row items-center rounded-card bg-wink-purple-tint px-4"
                  style={{
                    borderWidth: 1.5,
                    borderColor: passwordFocused ? colors.purpleSoft : "transparent",
                  }}
                >
                  <Lock size={16} color={passwordFocused ? colors.purple : colors.muted} />
                  <TextInput
                    placeholder="••••••••"
                    placeholderTextColor={colors.muted}
                    secureTextEntry={!showPw}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    className="ml-3 flex-1 py-3.5 text-wink-ink"
                    style={{ fontSize: 15 }}
                  />
                  <Pressable onPress={() => setShowPw(!showPw)} hitSlop={8}>
                    {showPw ? (
                      <EyeOff size={18} color={colors.muted} />
                    ) : (
                      <Eye size={18} color={colors.muted} />
                    )}
                  </Pressable>
                </View>
              </View>

              {mode === "login" ? (
                <Pressable
                  accessibilityRole="link"
                  onPress={() => router.push("/(auth)/forgot")}
                  className="-mt-2 self-end"
                >
                  <Text className="text-xs text-wink-pink">Forgot password?</Text>
                </Pressable>
              ) : null}

              {/* Error */}
              {error ? (
                <View className="rounded-card border border-wink-pink-border bg-wink-pink-tint px-4 py-3">
                  <Text className="text-center text-sm text-wink-pink">{error}</Text>
                </View>
              ) : null}

              <Button
                title={mode === "login" ? "Log In" : "Create Account"}
                onPress={handleContinue}
                loading={busy}
                fullWidth
                size="lg"
              />
            </View>

            {/* Divider */}
            <View className="my-5 flex-row items-center gap-3">
              <View className="h-px flex-1 bg-wink-pink-border" />
              <Text className="text-xs text-wink-muted">or</Text>
              <View className="h-px flex-1 bg-wink-pink-border" />
            </View>

            {/* Demo button — mint accent to visually distinguish */}
            <Pressable
              onPress={() => {
                loginDemo();
                router.replace("/(tabs)/home");
              }}
              className="flex-row items-center justify-center gap-2 rounded-card border border-wink-mint-soft bg-wink-mint-tint py-3.5 active:opacity-80"
            >
              <Sparkles size={16} color={colors.mint} />
              <Text className="font-display text-sm" style={{ color: colors.mint }}>
                Explore as demo collector
              </Text>
            </Pressable>

            {/* Social sign-in (§1P). Instagram login was replaced by invites — see /invite. */}
            <View className="mt-3 flex-row gap-3">
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  if (isBackendConfigured()) {
                    window.location.assign(auth.oauthUrl("google", `${window.location.origin}/login`));
                    return;
                  }
                  loginWithProvider("google");
                  router.replace("/(tabs)/home");
                }}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-card border border-wink-pink-border bg-white py-3"
              >
                <Text className="font-display text-sm" style={{ color: "#4285F4" }}>
                  G
                </Text>
                <Text className="text-sm text-wink-ink">Google</Text>
              </Pressable>
            </View>
          </View>

          {/* Bottom hint */}
          <Text className="mt-5 mb-8 text-center text-xs text-wink-muted px-6">
            By continuing you agree to WinKPop's{" "}
            <Text className="text-wink-pink">Terms of Service</Text> and{" "}
            <Text className="text-wink-pink">Privacy Policy</Text>.
          </Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

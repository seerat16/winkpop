import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Eye, EyeOff } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Logo, Text } from "@/components";
import { useUserStore } from "@/data/userStore";
import { colors } from "@/theme/colors";

export default function LoginScreen() {
  const router = useRouter();
  const login = useUserStore((s) => s.login);
  const signup = useUserStore((s) => s.signup);
  const loginDemo = useUserStore((s) => s.loginDemo);

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  const handleContinue = () => {
    setError("");
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
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
      <View className="flex-1 items-center justify-center px-6">
        <View className="mb-8 items-center">
          <Logo size={120} />
          <Text className="mt-2 text-sm text-wink-muted">Win the K-pop photocard experience</Text>
        </View>

        {/* mode tabs */}
        <View className="mb-6 w-full flex-row rounded-card bg-white p-1">
          {(["login", "signup"] as const).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => {
                setMode(tab);
                setError("");
              }}
              className={`flex-1 items-center rounded-card py-2 ${mode === tab ? "bg-wink-pink" : ""}`}
            >
              <Text
                className={`font-display text-sm ${mode === tab ? "text-white" : "text-wink-muted"}`}
              >
                {tab === "login" ? "Log In" : "Sign Up"}
              </Text>
            </Pressable>
          ))}
        </View>

        <View className="w-full gap-3">
          <TextInput
            placeholder="Email address"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            className="rounded-card border border-wink-pink-border bg-white px-4 py-3 text-wink-ink"
          />
          <View className="relative justify-center">
            <TextInput
              placeholder="Password"
              placeholderTextColor={colors.muted}
              secureTextEntry={!showPw}
              value={password}
              onChangeText={setPassword}
              className="rounded-card border border-wink-pink-border bg-white px-4 py-3 pr-12 text-wink-ink"
            />
            <Pressable onPress={() => setShowPw(!showPw)} className="absolute right-4" hitSlop={8}>
              {showPw ? (
                <EyeOff size={18} color={colors.muted} />
              ) : (
                <Eye size={18} color={colors.muted} />
              )}
            </Pressable>
          </View>

          <Button
            title={mode === "login" ? "Log In" : "Create Account"}
            onPress={handleContinue}
            fullWidth
          />

          {error ? (
            <View className="rounded-card border border-wink-pink-border bg-white px-4 py-3">
              <Text className="text-center text-sm text-wink-pink">{error}</Text>
            </View>
          ) : null}
        </View>

        <View className="my-5 w-full flex-row items-center gap-3">
          <View className="h-px flex-1 bg-wink-pink-border" />
          <Text className="text-sm text-wink-muted">or</Text>
          <View className="h-px flex-1 bg-wink-pink-border" />
        </View>

        <Button
          title="Explore as demo collector"
          variant="secondary"
          fullWidth
          onPress={() => {
            loginDemo();
            router.replace("/(tabs)/home");
          }}
        />
      </View>
    </SafeAreaView>
  );
}

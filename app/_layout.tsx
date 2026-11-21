import "../src/styles/global.css";
import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useUserStore } from "@/data/userStore";

/**
 * Root layout. Owns global providers and the auth gate: unauthenticated users
 * are redirected into the (auth) group, authenticated users into (tabs).
 * Returning users stay logged in and land straight on the feed (§1Y).
 */
export default function RootLayout() {
  const user = useUserStore((s) => s.user);
  const hydrated = useUserStore((s) => s.hydrated);
  const pruneCart = useUserStore((s) => s.pruneCart);
  const darkMode = useUserStore((s) => s.user?.darkMode ?? false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    const inAuthGroup = segments[0] === "(auth)";
    // Signup continues through onboarding (and Instagram connect) while signed in.
    const page = inAuthGroup ? segments[1] : undefined;
    const onboardingPage = page === "onboarding" || page === "instagram";
    if (!user) {
      if (!inAuthGroup) router.replace("/(auth)/login");
    } else if (!user.onboarded) {
      if (!onboardingPage) router.replace("/(auth)/onboarding");
    } else if (inAuthGroup && !onboardingPage) {
      router.replace("/(tabs)/home");
    }
  }, [user, hydrated, segments, router]);

  // Cart items are auto-removed after 30 days (§7Y).
  useEffect(() => {
    if (hydrated && user) pruneCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, user?.id]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={darkMode ? "light" : "dark"} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: darkMode ? "#1E1A24" : "#F3EDFB" },
          }}
        >
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="card/[id]" options={{ presentation: "card" }} />
          <Stack.Screen name="story/[username]" options={{ presentation: "fullScreenModal", animation: "fade" }} />
          <Stack.Screen name="story/new" options={{ presentation: "modal" }} />
          <Stack.Screen name="post/new" options={{ presentation: "modal" }} />
          <Stack.Screen name="listing/new" options={{ presentation: "modal" }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

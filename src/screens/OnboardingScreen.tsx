import { Linking, Pressable, SafeAreaView, ScrollView, View } from "@/rn";
import { useMemo, useState } from "react";
import { useRouter } from "@/rn/router";
import { Camera, Check, ChevronLeft } from "lucide-react";
import { Avatar, Button, Chip, Field, Notice, Progress, Text, Toggle, UserRow } from "@/components";
import {
  COMMUNITY_USERS,
  GROUPS,
  PAYMENT_LABELS,
  SUPPLIES_BUNDLE_URL,
  TAKEN_USERNAMES,
  TRADING_TUTORIAL,
  validateAge,
  validateUsername,
  type PaymentMethod,
} from "@/data";
import { useUserStore } from "@/data/userStore";
import { colors } from "@/theme/colors";

const AVATAR_COLORS = ["#C9A8E0", "#E880A4", "#7BBFEA", "#5CC0A8", "#F4C06B", "#8E7CC3"];
const COUNTRIES = ["US", "CA", "UK", "AU", "KR", "PH", "DE", "JP"];
const CURRENCIES = ["USD", "CAD", "GBP", "AUD", "KRW", "PHP", "EUR", "JPY"];
const LANGUAGES = ["English", "한국어", "Español", "Tagalog", "日本語"];
const STEPS = 5;

/**
 * Multi-step signup (§1A–Y): profile → groups → preferences & follows →
 * address & payment (skippable) → new-collector tutorial. Shows a progress bar
 * and lets the user go back a step.
 */
export default function OnboardingScreen() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const updateUser = useUserStore((s) => s.updateUser);
  const setCollectingGroups = useUserStore((s) => s.setCollectingGroups);
  const toggleFollow = useUserStore((s) => s.toggleFollow);

  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [age, setAge] = useState("");
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor ?? AVATAR_COLORS[0]);
  const [gender, setGender] = useState<"all" | "girl" | "boy">("all");
  const [selected, setSelected] = useState<string[]>(user?.collectingGroupIds ?? []);
  const [country, setCountry] = useState(user?.country ?? "US");
  const [currency, setCurrency] = useState(user?.currency ?? "USD");
  const [language, setLanguage] = useState(user?.language ?? "English");
  const [intl, setIntl] = useState(user?.internationalTrading ?? true);
  const [address, setAddress] = useState({ line1: "", line2: "", city: "", region: "", zip: "" });
  const [payments, setPayments] = useState<PaymentMethod[]>(["card"]);
  const [newCollector, setNewCollector] = useState<boolean | null>(null);
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const taken = useMemo(() => {
    const s = new Set(TAKEN_USERNAMES);
    if (user?.username) s.delete(user.username);
    return s;
  }, [user?.username]);

  const groups = GROUPS.filter((g) => gender === "all" || g.gender === gender);
  const suggestedFollows = COMMUNITY_USERS.filter((u) => u.collectingGroupIds.some((g) => selected.includes(g)));

  const next = () => {
    if (step === 1) {
      const e = {
        displayName: displayName.trim() ? null : "Add a display name.",
        username: validateUsername(username, taken),
        age: validateAge(Number(age)),
      };
      setErrors(e);
      if (Object.values(e).some(Boolean)) return;
      updateUser({ displayName: displayName.trim(), username: username.trim().toLowerCase(), age: Number(age), avatarColor });
    }
    if (step === 2) setCollectingGroups(selected);
    if (step === 3) updateUser({ country, currency, language, internationalTrading: intl });
    setStep((s) => s + 1);
  };

  const saveAddress = (skip: boolean) => {
    if (!skip) {
      updateUser({ address: { ...address, country }, paymentMethods: ["wallet", ...payments] });
    }
    setStep(5);
  };

  const finish = () => {
    updateUser({ newCollector: Boolean(newCollector), onboarded: true });
    router.replace(newCollector ? "/tutorial" : "/(tabs)/home");
  };

  return (
    <SafeAreaView className="flex-1 bg-wink-purple-tint">
      <View className="flex-row items-center gap-3 px-5 pt-3">
        {step > 1 ? (
          <Pressable accessibilityLabel="Previous step" onPress={() => setStep((s) => s - 1)} className="h-9 w-9 items-center justify-center rounded-full bg-white">
            <ChevronLeft size={20} color={colors.ink} />
          </Pressable>
        ) : null}
        <Text className="text-xs text-wink-muted">
          Step {step} of {STEPS}
        </Text>
      </View>
      <View className="px-5 pt-2">
        <Progress step={step} total={STEPS} />
      </View>

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        {step === 1 ? (
          <>
            <Text className="font-display text-2xl text-wink-ink">Create your profile</Text>
            <View className="my-5 items-center">
              <View>
                <Avatar name={displayName || "?"} color={avatarColor} size={88} />
                <View className="absolute bottom-0 right-0 h-7 w-7 items-center justify-center rounded-full bg-wink-pink">
                  <Camera size={14} color={colors.white} />
                </View>
              </View>
              <View className="mt-3 flex-row gap-2">
                {AVATAR_COLORS.map((c) => (
                  <Pressable
                    key={c}
                    accessibilityLabel={`Profile colour ${c}`}
                    onPress={() => setAvatarColor(c)}
                    className="h-7 w-7 rounded-full"
                    style={{ backgroundColor: c, borderWidth: avatarColor === c ? 3 : 0, borderColor: colors.ink }}
                  />
                ))}
              </View>
              <Text className="mt-2 text-xs text-wink-muted">Pick a colour now — upload a photo any time from your profile.</Text>
            </View>
            <Field label="Display name" value={displayName} onChangeText={setDisplayName} error={errors.displayName} placeholder="Wink Collector" />
            <Field
              label="Username"
              value={username}
              onChangeText={(t) => {
                setUsername(t);
                setErrors((e) => ({ ...e, username: t.length >= 3 ? validateUsername(t, taken) : null }));
              }}
              autoCapitalize="none"
              error={errors.username}
              hint={username && !errors.username && username.length >= 6 ? "✓ Available" : "6+ characters, letters, numbers, . and _"}
            />
            <Field label="Age" value={age} onChangeText={setAge} keyboardType="number-pad" error={errors.age} hint="You must be 13 or older." />
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Text className="font-display text-2xl text-wink-ink">Who do you collect?</Text>
            <Text className="mb-4 mt-1 text-sm text-wink-muted">Pick your groups — we&apos;ll tune your feed and wishlist matches.</Text>
            <View className="mb-3 flex-row items-center gap-2">
              <Chip label="All" active={gender === "all"} onPress={() => setGender("all")} />
              <Chip label="Girl Groups" active={gender === "girl"} onPress={() => setGender("girl")} />
              <Chip label="Boy Groups" active={gender === "boy"} onPress={() => setGender("boy")} />
              <View className="flex-1" />
              <Text className="text-xs text-wink-muted">{selected.length} selected</Text>
            </View>
            <View className="flex-row flex-wrap gap-3">
              {groups.map((g) => {
                const on = selected.includes(g.id);
                return (
                  <Pressable
                    key={g.id}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                    onPress={() => setSelected((p) => (on ? p.filter((x) => x !== g.id) : [...p, g.id]))}
                    className="w-[48%] rounded-card border bg-white p-4"
                    style={{ borderColor: on ? g.color : colors.pinkBorder }}
                  >
                    <View className="mb-2 flex-row items-center justify-between">
                      <View className="h-10 w-10 items-center justify-center rounded-card" style={{ backgroundColor: g.color }}>
                        <Text className="font-display text-white" style={{ fontSize: 10 }}>
                          {g.abbr.slice(0, 5)}
                        </Text>
                      </View>
                      {on ? (
                        <View className="h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: g.color }}>
                          <Check size={14} color={colors.white} />
                        </View>
                      ) : null}
                    </View>
                    <Text className="font-display text-wink-ink" numberOfLines={1}>
                      {g.name}
                    </Text>
                    <Text className="text-xs text-wink-muted">
                      {g.company} · {g.generation}G
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <Text className="font-display text-2xl text-wink-ink">Shipping & preferences</Text>
            <Text className="mb-2 mt-4 text-xs text-wink-muted">Shipping country</Text>
            <View className="flex-row flex-wrap gap-2">
              {COUNTRIES.map((c) => (
                <Chip key={c} label={c} active={country === c} onPress={() => setCountry(c)} />
              ))}
            </View>
            <Text className="mb-2 mt-4 text-xs text-wink-muted">Currency</Text>
            <View className="flex-row flex-wrap gap-2">
              {CURRENCIES.map((c) => (
                <Chip key={c} label={c} active={currency === c} onPress={() => setCurrency(c)} />
              ))}
            </View>
            <Text className="mb-2 mt-4 text-xs text-wink-muted">Language</Text>
            <View className="flex-row flex-wrap gap-2">
              {LANGUAGES.map((c) => (
                <Chip key={c} label={c} active={language === c} onPress={() => setLanguage(c)} />
              ))}
            </View>
            <View className="mt-3">
              <Toggle label="International trading" sub="Show and accept listings from other countries" value={intl} onChange={setIntl} />
            </View>
            {suggestedFollows.length ? (
              <>
                <Text className="mb-1 mt-4 font-display text-wink-ink">Collectors who share your groups</Text>
                {suggestedFollows.map((u) => (
                  <UserRow
                    key={u.username}
                    username={u.username}
                    onPress={() => undefined}
                    right={
                      <Button
                        size="sm"
                        title={user?.following.includes(u.username) ? "Following" : u.isPrivate ? "Request" : "Follow"}
                        variant={user?.following.includes(u.username) ? "secondary" : "primary"}
                        onPress={() => toggleFollow(u.username, u.isPrivate)}
                      />
                    }
                  />
                ))}
              </>
            ) : null}
          </>
        ) : null}

        {step === 4 ? (
          <>
            <Text className="font-display text-2xl text-wink-ink">Address & payment</Text>
            <Text className="mb-4 mt-1 text-sm text-wink-muted">
              Set it once so checkout and listing are one tap. Your address is never shown publicly. You can skip and add it when you list or buy.
            </Text>
            <Field label="Address line 1" value={address.line1} onChangeText={(t) => setAddress({ ...address, line1: t })} />
            <Field label="Address line 2 (optional)" value={address.line2} onChangeText={(t) => setAddress({ ...address, line2: t })} />
            <Field label="City" value={address.city} onChangeText={(t) => setAddress({ ...address, city: t })} />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Field label="State / region" value={address.region} onChangeText={(t) => setAddress({ ...address, region: t })} />
              </View>
              <View className="flex-1">
                <Field label="ZIP / postcode" value={address.zip} onChangeText={(t) => setAddress({ ...address, zip: t })} />
              </View>
            </View>
            <Text className="mb-2 text-xs text-wink-muted">Payment methods</Text>
            <View className="flex-row flex-wrap gap-2">
              {(["card", "apple_pay", "google_pay", "paypal", "venmo", "zelle", "klarna"] as PaymentMethod[]).map((p) => (
                <Chip
                  key={p}
                  label={PAYMENT_LABELS[p]}
                  active={payments.includes(p)}
                  onPress={() => setPayments((x) => (x.includes(p) ? x.filter((y) => y !== p) : [...x, p]))}
                />
              ))}
            </View>
          </>
        ) : null}

        {step === 5 ? (
          <>
            <Text className="font-display text-2xl text-wink-ink">Are you a new collector?</Text>
            <View className="mt-4 flex-row gap-3">
              <View className="flex-1">
                <Button title="Yes, I'm new!" variant={newCollector === true ? "primary" : "secondary"} fullWidth onPress={() => setNewCollector(true)} />
              </View>
              <View className="flex-1">
                <Button title="No, I've got this" variant={newCollector === false ? "primary" : "secondary"} fullWidth onPress={() => setNewCollector(false)} />
              </View>
            </View>
            {newCollector ? (
              <>
                <Notice text="Welcome! Here's how trading works on WinKPop — you can find this again under Settings → Tutorial & glossary." />
                {TRADING_TUTORIAL.map((t, i) => (
                  <Text key={t} className="mb-1 text-sm text-wink-ink">
                    {i + 1}. {t}
                  </Text>
                ))}
                <Button
                  title="Shop a starter supplies bundle"
                  variant="ghost"
                  onPress={() => Linking.openURL(SUPPLIES_BUNDLE_URL)}
                />
              </>
            ) : null}
          </>
        ) : null}
      </ScrollView>

      <View className="gap-2 px-5 pb-6 pt-2">
        {step < 4 ? (
          <Button
            title={step === 2 && selected.length ? `Continue with ${selected.length} group${selected.length > 1 ? "s" : ""}` : "Continue"}
            fullWidth
            onPress={next}
          />
        ) : null}
        {step === 4 ? (
          <>
            <Button title="Save & continue" fullWidth onPress={() => saveAddress(false)} disabled={!address.line1 || !address.city} />
            <Button title="Skip for now" variant="ghost" fullWidth onPress={() => saveAddress(true)} />
          </>
        ) : null}
        {step === 5 ? <Button title="Start collecting" fullWidth disabled={newCollector === null} onPress={finish} /> : null}
      </View>
    </SafeAreaView>
  );
}

import { useMemo, useState } from "react";
import { Pressable, View } from "@/rn";
import { useRouter } from "@/rn/router";
import { Avatar, Button, Chip, Field, Page, SectionTitle, Text, Toggle } from "@/components";
import { AVAILABILITY_LABELS, isValidUrl, TAKEN_USERNAMES, validateUsername, type Availability } from "@/data";
import { useUserStore } from "@/data/userStore";
import { colors } from "@/theme/colors";

const BANNERS = ["#FFF0F7", "#F3EDFB", "#EDFAF5", "#E6F2FB", "#FFF4E6", "#2D2D2D"];

/**
 * Edit profile (§23K–Q, §23N): display name, username (checked), bio with
 * @tags, About Me / Rules, link + Instagram / TikTok / YouTube, banner,
 * availability (busy / vacation / can't ship), private & collection account.
 */
export default function EditProfileScreen() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const updateUser = useUserStore((s) => s.updateUser);
  const [f, setF] = useState({
    displayName: user?.displayName ?? "",
    username: user?.username ?? "",
    bio: user?.bio ?? "",
    aboutMe: user?.aboutMe ?? "",
    link: user?.link ?? "",
    instagram: user?.socials.instagram ?? "",
    tiktok: user?.socials.tiktok ?? "",
    youtube: user?.socials.youtube ?? "",
    location: user?.location ?? "",
  });
  const [banner, setBanner] = useState(user?.bannerColor ?? BANNERS[0]);
  const [availability, setAvailability] = useState<Availability>(user?.availability ?? "available");
  const [isPrivate, setPrivate] = useState(user?.isPrivate ?? false);
  const [collectionAcct, setCollectionAcct] = useState(user?.isCollectionAccount ?? false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const taken = useMemo(() => {
    const s = new Set(TAKEN_USERNAMES);
    if (user) s.delete(user.username);
    return s;
  }, [user]);
  if (!user) return null;
  const set = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v }));

  const save = () => {
    const e = {
      username: f.username === user.username ? null : validateUsername(f.username, taken),
      link: f.link && !isValidUrl(f.link) ? "Enter a full link starting with https://" : null,
      displayName: f.displayName.trim() ? null : "Display name can't be empty.",
    };
    setErrors(e);
    if (Object.values(e).some(Boolean)) return;
    updateUser({
      displayName: f.displayName.trim(),
      username: f.username.trim().toLowerCase(),
      bio: f.bio,
      aboutMe: f.aboutMe,
      link: f.link || undefined,
      socials: { instagram: f.instagram || undefined, tiktok: f.tiktok || undefined, youtube: f.youtube || undefined },
      location: f.location,
      bannerColor: banner,
      availability,
      isPrivate,
      isCollectionAccount: collectionAcct,
    });
    router.back();
  };

  return (
    <Page title="Edit profile" footer={<Button title="Save" fullWidth onPress={save} />}>
      <View className="mb-4 h-16 items-center justify-end rounded-card" style={{ backgroundColor: banner }}>
        <View className="-mb-6">
          <Avatar name={f.displayName || "?"} color={user.avatarColor} size={56} />
        </View>
      </View>
      <Text className="mb-1 mt-4 text-xs text-wink-muted">Banner</Text>
      <View className="mb-3 flex-row gap-2">
        {BANNERS.map((b) => (
          <Pressable key={b} accessibilityLabel={`Banner ${b}`} onPress={() => setBanner(b)} className="h-8 w-8 rounded-card" style={{ backgroundColor: b, borderWidth: banner === b ? 3 : 1, borderColor: banner === b ? colors.ink : colors.pinkBorder }} />
        ))}
      </View>
      <Field label="Display name" value={f.displayName} onChangeText={set("displayName")} error={errors.displayName} />
      <Field label="Username" value={f.username} onChangeText={set("username")} autoCapitalize="none" error={errors.username} />
      <Field label="Location" value={f.location} onChangeText={set("location")} />
      <Field label="Bio" multiline value={f.bio} onChangeText={set("bio")} hint="Tag accounts with @username" counter={{ value: f.bio.length, max: 150 }} />
      <Field label="About me / Rules" multiline value={f.aboutMe} onChangeText={set("aboutMe")} placeholder="Payment terms, holds, shipping days…" />
      <Field label="Link" value={f.link} onChangeText={set("link")} autoCapitalize="none" error={errors.link} placeholder="https://" />
      <Field label="Instagram" value={f.instagram} onChangeText={set("instagram")} autoCapitalize="none" />
      <Field label="TikTok" value={f.tiktok} onChangeText={set("tiktok")} autoCapitalize="none" />
      <Field label="YouTube" value={f.youtube} onChangeText={set("youtube")} autoCapitalize="none" />
      <SectionTitle title="Availability" />
      <View className="flex-row flex-wrap gap-2">
        {(Object.keys(AVAILABILITY_LABELS) as Availability[]).map((a) => (
          <Chip key={a} label={AVAILABILITY_LABELS[a]} active={availability === a} onPress={() => setAvailability(a)} />
        ))}
      </View>
      <SectionTitle title="Account type" />
      <Toggle label="Private account" sub="Approve who can follow you and see your posts" value={isPrivate} onChange={setPrivate} />
      <Toggle label="Collection account" sub="Showcase only — hides buy/trade buttons on your posts" value={collectionAcct} onChange={setCollectionAcct} />
    </Page>
  );
}

import { useState } from "react";
import { Pressable, View } from "@/rn";
import { useRouter } from "@/rn/router";
import { Pencil, Trash2 } from "lucide-react";
import { Button, Card, EmptyState, Field, Page, Text } from "@/components";
import { useAppStore } from "@/data/appStore";
import { colors } from "@/theme/colors";

/** Saved folders: create, name, rename, delete and view (§15K–L). */
export default function SavedFoldersScreen() {
  const router = useRouter();
  const folders = useAppStore((s) => s.savedFolders);
  const posts = useAppStore((s) => s.posts);
  const create = useAppStore((s) => s.createSavedFolder);
  const rename = useAppStore((s) => s.renameSavedFolder);
  const remove = useAppStore((s) => s.deleteSavedFolder);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  return (
    <Page title="Saved folders">
      <Field label="New folder" value={name} onChangeText={setName} placeholder="e.g. Binder inspo" />
      <Button title="Create folder" fullWidth disabled={!name.trim()} onPress={() => { create(name.trim()); setName(""); }} />
      <View className="mt-4 gap-3">
        {Object.keys(folders).length === 0 ? <EmptyState emoji="📁" title="No folders yet" /> : null}
        {Object.entries(folders).map(([f, ids]) => (
          <Card key={f}>
            {editing === f ? (
              <>
                <Field value={newName} onChangeText={setNewName} />
                <Button size="sm" title="Save name" onPress={() => { if (newName.trim()) rename(f, newName.trim()); setEditing(null); }} />
              </>
            ) : (
              <View className="flex-row items-center">
                <Text className="flex-1 font-display text-wink-ink">{f}</Text>
                <Text className="mr-3 text-xs text-wink-muted">{ids.length} posts</Text>
                <Pressable accessibilityLabel={`Rename ${f}`} onPress={() => { setEditing(f); setNewName(f); }} hitSlop={6} className="mr-3">
                  <Pencil size={16} color={colors.muted} />
                </Pressable>
                <Pressable accessibilityLabel={`Delete ${f}`} onPress={() => remove(f)} hitSlop={6}>
                  <Trash2 size={16} color={colors.muted} />
                </Pressable>
              </View>
            )}
            {ids.map((id) => {
              const p = posts.find((x) => x.id === id);
              return p ? (
                <Pressable key={id} onPress={() => router.push(`/post/${id}`)} className="mt-2">
                  <Text className="text-xs text-wink-ink" numberOfLines={1}>• {p.author}: {p.caption}</Text>
                </Pressable>
              ) : null;
            })}
          </Card>
        ))}
      </View>
    </Page>
  );
}

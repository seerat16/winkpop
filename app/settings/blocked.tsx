import { Button, EmptyState, Page, UserRow } from "@/components";
import { EMPTY } from "@/data/appStore";
import { useUserStore } from "@/data/userStore";

/** Blocked users (§22H). */
export default function BlockedUsersScreen() {
  const blocked = useUserStore((s) => s.user?.blocked ?? EMPTY);
  const toggleBlock = useUserStore((s) => s.toggleBlock);
  return (
    <Page title="Blocked users">
      {blocked.length === 0 ? <EmptyState emoji="🛡️" title="You haven't blocked anyone" /> : null}
      {blocked.map((u) => (
        <UserRow key={u} username={u} right={<Button size="sm" variant="secondary" title="Unblock" onPress={() => toggleBlock(u)} />} />
      ))}
    </Page>
  );
}

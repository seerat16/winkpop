import { useMemo, useState, type MouseEvent } from "react";
import { ArrowUp } from "lucide-react";
import { Button, IconButton, Modal, SearchComponent } from "@figma/astraui";
import { useNavigate } from "../router";
import { KNOWN_USERS } from "../data/mockData";
import { getCurrentUser, getUserAccounts } from "../data/userStore";

interface ShareToAccountProps {
  itemType: "post" | "listing";
  itemTitle: string;
  itemPath: string;
  appearance?: "icon" | "button";
  compact?: boolean;
  className?: string;
}

export function ShareToAccount({
  itemType,
  itemTitle,
  itemPath,
  appearance = "icon",
  compact = false,
  className,
}: ShareToAccountProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const currentUsername = getCurrentUser()?.username.toLowerCase();

  const accounts = useMemo(() => {
    const merged = [
      ...KNOWN_USERS.map(user => ({
        id: user.id,
        username: user.username,
        label: user.username,
        country: user.country,
      })),
      ...getUserAccounts().map(user => ({
        id: user.email,
        username: user.username,
        label: user.displayName || user.username,
        country: user.country,
      })),
    ];

    return merged.filter(
      (account, index, all) =>
        account.username &&
        account.username.toLowerCase() !== currentUsername &&
        all.findIndex(
          candidate =>
            candidate.username.toLowerCase() === account.username.toLowerCase(),
        ) === index,
    );
  }, [currentUsername]);

  const visibleAccounts = accounts.filter(account => {
    const normalizedQuery = query.trim().toLowerCase();
    return (
      !normalizedQuery ||
      account.username.toLowerCase().includes(normalizedQuery) ||
      account.label.toLowerCase().includes(normalizedQuery)
    );
  });

  const openPicker = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setIsOpen(true);
  };

  const shareWith = (username: string) => {
    const params = new URLSearchParams({
      mode: "share",
      to: username,
      shareType: itemType,
      shareTitle: itemTitle,
      sharePath: itemPath,
    });
    setIsOpen(false);
    navigate(`/messages?${params.toString()}`);
  };

  return (
    <div onClick={event => event.stopPropagation()}>
      {appearance === "button" ? (
        <Button
          type="button"
          variant="neutral"
          size="small"
          iconStart={<ArrowUp size={16} />}
          className={className}
          onClick={openPicker}
        >
          Share
        </Button>
      ) : (
        <IconButton
          type="button"
          variant="neutral"
          size="small"
          icon={<ArrowUp size={compact ? 11 : 16} />}
          className={`!bg-secondary !text-primary ${compact ? "!size-6" : ""} ${className ?? ""}`}
          aria-label={`Share ${itemType}`}
          onClick={openPicker}
        />
      )}

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={`Send ${itemType}`}
        size="small"
        footer={
          <Button variant="neutral" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
        }
      >
        <div className="flex flex-col gap-lg">
          <div className="rounded-corner-md bg-bg-subtle p-lg">
            <div className="text-label-sm font-semibold text-text-primary">
              {itemTitle}
            </div>
            <div className="mt-xs text-video-title text-text-secondary">
              Choose an account to send this {itemType} to.
            </div>
          </div>

          <SearchComponent
            value={query}
            onChange={setQuery}
            placeholder="Search accounts"
          />

          <div className="flex max-h-64 flex-col gap-xs overflow-y-auto">
            {visibleAccounts.length > 0 ? (
              visibleAccounts.map(account => (
                <Button
                  key={account.id}
                  type="button"
                  variant="subtle"
                  className="w-full !justify-start"
                  onClick={event => {
                    event.stopPropagation();
                    shareWith(account.username);
                  }}
                >
                  <span className="flex w-full items-center justify-between gap-md">
                    <span className="text-label-sm text-text-primary">
                      @{account.username}
                    </span>
                    <span className="text-video-title text-text-secondary">
                      {account.country}
                    </span>
                  </span>
                </Button>
              ))
            ) : (
              <div className="p-lg text-center text-label-sm text-text-secondary">
                No matching accounts
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

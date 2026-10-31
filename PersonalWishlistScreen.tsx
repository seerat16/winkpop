import { useMemo, useState } from "react";
import { ArrowLeft, Check, ChevronRight, Heart, Plus, Star, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { PhotocardImage } from "../components/PhotocardImage";
import { CARD_TYPES, PHOTOCARDS } from "../data/mockData";
import { GROUPS_DATA } from "../data/groupData";
import {
  getWishlists,
  saveWishlist,
  setWishlistPriority,
  updateWishlistCards,
  type SavedWishlist,
  type WishlistDescription,
  type WishlistFilterKind,
} from "../data/wishlistStore";
import { useNavigate } from "../router";

type View = "list" | "create" | "detail" | "cards";

const FILTER_OPTIONS: { id: WishlistFilterKind; label: string }[] = [
  { id: "member", label: "Member" },
  { id: "era", label: "Era" },
  { id: "type", label: "Card type" },
];

const normalizeEra = (era: string) => era.replace(/\s*\(\d{4}\)$/, "").trim().toLowerCase();

export default function PersonalWishlistScreen() {
  const navigate = useNavigate();
  const [wishlists, setWishlists] = useState<SavedWishlist[]>(getWishlists);
  const [view, setView] = useState<View>("list");
  const [selectedWishlistId, setSelectedWishlistId] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [groupId, setGroupId] = useState("");
  const [filterKind, setFilterKind] = useState<WishlistFilterKind>("member");
  const [filterValue, setFilterValue] = useState("");
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [selectedDescription, setSelectedDescription] = useState<WishlistDescription | null>(null);
  const [wishlistName, setWishlistName] = useState("");
  const [cardSearch, setCardSearch] = useState("");

  const selectedGroup = GROUPS_DATA.find(group => group.id === groupId);
  const selectedWishlist = wishlists.find(wishlist => wishlist.id === selectedWishlistId);

  const filterValues = useMemo(() => {
    if (!selectedGroup) return [];
    if (filterKind === "member") {
      return selectedGroup.members.map(member => ({ value: member.id, label: member.name }));
    }
    if (filterKind === "era") {
      return selectedGroup.eras.map(era => ({ value: era, label: era.replace(/\s*\(\d{4}\)$/, "") }));
    }
    return CARD_TYPES.map(value => ({ value, label: value }));
  }, [filterKind, selectedGroup]);

  const matchingCards = useMemo(
    () =>
      PHOTOCARDS.filter(card => {
        if (card.groupId !== groupId || !filterValue) return false;
        if (filterKind === "member") return card.memberId === filterValue;
        if (filterKind === "era") return normalizeEra(card.era) === normalizeEra(filterValue);
        return card.type === filterValue;
      }),
    [filterKind, filterValue, groupId],
  );

  const descriptionCandidate = useMemo<WishlistDescription | null>(() => {
    if (!selectedGroup || !filterValue || matchingCards.length > 0) return null;
    const selectedLabel = filterValues.find(option => option.value === filterValue)?.label || filterValue;
    const detail =
      filterKind === "member"
        ? `Any ${selectedLabel} photocard`
        : filterKind === "era"
          ? `Any card from the ${selectedLabel} era`
          : `Any ${selectedLabel} card`;
    return {
      id: `description:${groupId}:${filterKind}:${filterValue}`,
      label: `${selectedGroup.name} · ${selectedLabel}`,
      detail,
    };
  }, [filterKind, filterValue, filterValues, groupId, matchingCards.length, selectedGroup]);

  const resetCreator = () => {
    setStep(1);
    setGroupId("");
    setFilterKind("member");
    setFilterValue("");
    setSelectedCardIds([]);
    setSelectedDescription(null);
    setWishlistName("");
  };

  const openCreator = () => {
    resetCreator();
    setView("create");
  };

  const chooseGroup = (id: string) => {
    setGroupId(id);
    setFilterValue("");
    setSelectedCardIds([]);
    setSelectedDescription(null);
  };

  const chooseFilterKind = (kind: WishlistFilterKind) => {
    setFilterKind(kind);
    setFilterValue("");
    setSelectedCardIds([]);
    setSelectedDescription(null);
  };

  const toggleCard = (id: string) => {
    setSelectedCardIds(current =>
      current.includes(id) ? current.filter(cardId => cardId !== id) : [...current, id],
    );
  };

  const save = () => {
    const name = wishlistName.trim();
    if (!name) return;
    saveWishlist({
      name,
      groupId,
      filterKind,
      filterValue,
      cardIds: selectedCardIds,
      descriptions: selectedDescription ? [selectedDescription] : [],
      priority: false,
    });
    setWishlists(getWishlists());
    setView("list");
    resetCreator();
    toast.success("Wishlist created");
  };

  const togglePriority = (id: string, priority: boolean) => {
    setWishlists(setWishlistPriority(id, priority));
    toast.success(priority ? "Marked as priority" : "Removed from priority");
  };

  const openWishlist = (id: string) => {
    setSelectedWishlistId(id);
    setView("detail");
  };

  const openCardEditor = (wishlist: SavedWishlist) => {
    setSelectedWishlistId(wishlist.id);
    setSelectedCardIds(wishlist.cardIds);
    setCardSearch("");
    setView("cards");
  };

  const saveWishlistCards = () => {
    if (!selectedWishlistId) return;
    setWishlists(updateWishlistCards(selectedWishlistId, selectedCardIds));
    setView("detail");
    toast.success(`${selectedCardIds.length} cards saved`);
  };

  if (view === "cards" && selectedWishlist) {
    const visibleCards = PHOTOCARDS.filter(card => {
      const query = cardSearch.trim().toLowerCase();
      return (
        !query ||
        card.groupName.toLowerCase().includes(query) ||
        card.memberName.toLowerCase().includes(query) ||
        card.era.toLowerCase().includes(query) ||
        card.title.toLowerCase().includes(query)
      );
    });
    const allVisibleSelected =
      visibleCards.length > 0 &&
      visibleCards.every(card => selectedCardIds.includes(card.id));

    return (
      <div className="min-h-screen bg-background px-4 pb-8">
        <div className="sticky top-0 z-20 -mx-4 flex items-center gap-3 bg-background px-4 py-4">
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full"
            onClick={() => setView("detail")}
            aria-label="Back to wishlist"
          >
            <ArrowLeft />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xl font-semibold text-foreground">Choose cards</div>
            <div className="text-sm text-muted-foreground">
              {selectedCardIds.length} selected · no limit
            </div>
          </div>
          <Button size="sm" className="rounded-full" onClick={saveWishlistCards}>
            Save
          </Button>
        </div>

        <div className="rounded-2xl bg-card p-4">
          <Input
            value={cardSearch}
            onChange={event => setCardSearch(event.target.value)}
            placeholder="Search group, idol, era, or card"
            className="h-11 rounded-xl"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              Select as many cards as you want.
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() =>
                setSelectedCardIds(current => {
                  const visibleIds = visibleCards.map(card => card.id);
                  return allVisibleSelected
                    ? current.filter(id => !visibleIds.includes(id))
                    : Array.from(new Set([...current, ...visibleIds]));
                })
              }
            >
              {allVisibleSelected ? "Clear shown" : "Select shown"}
            </Button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {visibleCards.map(card => {
              const isSelected = selectedCardIds.includes(card.id);
              return (
                <Button
                  key={card.id}
                  variant="outline"
                  className={`relative h-auto overflow-hidden rounded-xl p-0 ${
                    isSelected ? "border-primary ring-2 ring-primary/20" : ""
                  }`}
                  onClick={() => toggleCard(card.id)}
                  aria-label={`${isSelected ? "Remove" : "Add"} ${card.memberName} ${card.title}`}
                >
                  <span className="block w-full">
                    <PhotocardImage
                      groupId={card.groupId}
                      memberId={card.memberId}
                      memberName={card.memberName}
                      imgSeed={card.imgSeed}
                      databaseImageFilename={card.databaseImageFilename}
                      uploadImageFilename={card.uploadImageFilename}
                      className="aspect-[2/3] w-full"
                    />
                    <span className="block p-2 text-left">
                      <span className="block truncate text-xs font-semibold text-foreground">
                        {card.memberName}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {card.era}
                      </span>
                    </span>
                  </span>
                  {isSelected && (
                    <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check size={14} />
                    </span>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (view === "create") {
    return (
      <div className="min-h-screen bg-background pb-8">
        <div className="sticky top-0 z-20 flex items-center gap-3 bg-background px-4 py-4">
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full"
            aria-label={step === 1 ? "Close creator" : "Previous step"}
            onClick={() => (step === 1 ? setView("list") : setStep(current => current - 1))}
          >
            <ArrowLeft />
          </Button>
          <div className="flex-1">
            <div className="text-xl font-semibold text-foreground">Create wishlist</div>
            <div className="text-sm text-muted-foreground">Step {step} of 3</div>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setView("list")} aria-label="Close">
            <X />
          </Button>
        </div>

        <div className="flex gap-2 px-4 pb-4" aria-hidden="true">
          {[1, 2, 3].map(item => (
            <div
              key={item}
              className={`h-1 flex-1 rounded-full ${item <= step ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>

        <div className="px-4">
          {step === 1 && (
            <div className="rounded-2xl bg-card p-4">
              <div className="text-lg font-semibold text-card-foreground">Choose a group</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Start with the artist whose cards you are looking for.
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {GROUPS_DATA.map(group => {
                  const isSelected = group.id === groupId;
                  return (
                    <Button
                      key={group.id}
                      variant="outline"
                      className={`h-auto justify-start rounded-xl p-3 ${
                        isSelected ? "border-primary bg-secondary text-secondary-foreground" : "bg-background"
                      }`}
                      onClick={() => chooseGroup(group.id)}
                    >
                      <span className="flex size-9 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                        {group.abbr.slice(0, 3)}
                      </span>
                      <span className="text-left">
                        <span className="block font-semibold">{group.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {group.members.filter(member => !member.former).length} members · {group.eras.length} eras
                        </span>
                      </span>
                      {isSelected && <Check className="ml-auto text-primary" />}
                    </Button>
                  );
                })}
              </div>
              <Button className="mt-5 w-full rounded-full" disabled={!groupId} onClick={() => setStep(2)}>
                Continue
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl bg-card p-4">
                <div className="text-lg font-semibold text-card-foreground">Narrow it down</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Choose a member, era, or card type from {selectedGroup?.name}.
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {FILTER_OPTIONS.map(option => (
                    <Button
                      key={option.id}
                      size="sm"
                      variant={filterKind === option.id ? "default" : "outline"}
                      className="rounded-full"
                      onClick={() => chooseFilterKind(option.id)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {filterValues.map(option => (
                    <Button
                      key={option.value}
                      size="sm"
                      variant={filterValue === option.value ? "secondary" : "outline"}
                      className="h-auto whitespace-normal rounded-full"
                      onClick={() => {
                        setFilterValue(option.value);
                        setSelectedCardIds([]);
                        setSelectedDescription(null);
                      }}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              {filterValue && (
                <div className="rounded-2xl bg-card p-4">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <div className="font-semibold text-card-foreground">Select cards</div>
                      <div className="text-sm text-muted-foreground">
                        {selectedCardIds.length + (selectedDescription ? 1 : 0)} selected
                      </div>
                    </div>
                    {matchingCards.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCardIds(matchingCards.map(card => card.id))}
                      >
                        Select all
                      </Button>
                    )}
                  </div>
                  {matchingCards.length > 0 ? (
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {matchingCards.map(card => {
                      const isSelected = selectedCardIds.includes(card.id);
                      return (
                        <Button
                          key={card.id}
                          variant="outline"
                          className={`relative h-auto overflow-hidden rounded-xl p-0 ${
                            isSelected ? "border-primary ring-2 ring-primary/20" : ""
                          }`}
                          onClick={() => toggleCard(card.id)}
                          aria-label={`${isSelected ? "Remove" : "Add"} ${card.memberName} ${card.title}`}
                        >
                          <span className="block w-full">
                            <PhotocardImage
                              groupId={card.groupId}
                              memberId={card.memberId}
                              memberName={card.memberName}
                              imgSeed={card.imgSeed}
                              databaseImageFilename={card.databaseImageFilename}
                              uploadImageFilename={card.uploadImageFilename}
                              className="aspect-[2/3] w-full"
                            />
                            <span className="block p-2 text-left">
                              <span className="block truncate text-xs font-semibold text-foreground">{card.memberName}</span>
                              <span className="block truncate text-xs text-muted-foreground">{card.title}</span>
                            </span>
                          </span>
                          {isSelected && (
                            <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                              <Check size={14} />
                            </span>
                          )}
                        </Button>
                      );
                      })}
                    </div>
                  ) : descriptionCandidate ? (
                    <Button
                      variant="outline"
                      className={`mt-4 h-auto w-full justify-start rounded-xl p-3 text-left ${
                        selectedDescription ? "border-primary bg-secondary" : "bg-background"
                      }`}
                      onClick={() => setSelectedDescription(selectedDescription ? null : descriptionCandidate)}
                    >
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted text-primary">
                        <Heart />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-foreground">{descriptionCandidate.label}</span>
                        <span className="mt-1 block whitespace-normal text-xs text-muted-foreground">
                          {descriptionCandidate.detail} · Photo not available
                        </span>
                      </span>
                      {selectedDescription && <Check className="shrink-0 text-primary" />}
                    </Button>
                  ) : null}
                </div>
              )}

              <Button
                className="w-full rounded-full"
                disabled={!filterValue || (selectedCardIds.length === 0 && !selectedDescription)}
                onClick={() => setStep(3)}
              >
                Continue with {selectedCardIds.length + (selectedDescription ? 1 : 0)} card
                {selectedCardIds.length + (selectedDescription ? 1 : 0) === 1 ? "" : "s"}
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="rounded-2xl bg-card p-4">
              <div className="text-lg font-semibold text-card-foreground">Name your wishlist</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Give it a name you will recognize when trading.
              </div>
              <Input
                className="mt-4 h-11 rounded-xl"
                value={wishlistName}
                maxLength={40}
                autoFocus
                placeholder={`${selectedGroup?.name || "My"} wishlist`}
                onChange={event => setWishlistName(event.target.value)}
              />
              <div className="mt-4 rounded-xl bg-secondary p-3">
                <div className="text-sm font-semibold text-secondary-foreground">
                  {selectedCardIds.length + (selectedDescription ? 1 : 0)} selected card
                  {selectedCardIds.length + (selectedDescription ? 1 : 0) === 1 ? "" : "s"}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {selectedGroup?.name} · {FILTER_OPTIONS.find(option => option.id === filterKind)?.label}
                </div>
                <div className="mt-3 flex -space-x-3">
                  {PHOTOCARDS.filter(card => selectedCardIds.includes(card.id)).slice(0, 5).map(card => (
                    <PhotocardImage
                      key={card.id}
                      groupId={card.groupId}
                      memberId={card.memberId}
                      memberName={card.memberName}
                      imgSeed={card.imgSeed}
                      databaseImageFilename={card.databaseImageFilename}
                      uploadImageFilename={card.uploadImageFilename}
                      className="h-14 w-10 rounded-lg border-2 border-card object-cover"
                    />
                  ))}
                  {selectedDescription && (
                    <div className="flex h-14 w-10 items-center justify-center rounded-lg border-2 border-card bg-muted text-primary">
                      <Heart size={16} />
                    </div>
                  )}
                </div>
              </div>
              <Button className="mt-5 w-full rounded-full" disabled={!wishlistName.trim()} onClick={save}>
                Save wishlist
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === "detail" && selectedWishlist) {
    const cards = PHOTOCARDS.filter(card => selectedWishlist.cardIds.includes(card.id));
    const descriptions = selectedWishlist.descriptions || [];
    const itemCount = cards.length + descriptions.length;
    const group = GROUPS_DATA.find(item => item.id === selectedWishlist.groupId);
    return (
      <div className="min-h-screen bg-background px-4 pb-8">
        <div className="sticky top-0 z-20 -mx-4 flex items-center gap-3 bg-background px-4 py-4">
          <Button variant="secondary" size="icon" className="rounded-full" onClick={() => setView("list")} aria-label="Back to wishlists">
            <ArrowLeft />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xl font-semibold text-foreground">{selectedWishlist.name}</div>
            <div className="text-sm text-muted-foreground">{itemCount} cards · {group?.name}</div>
          </div>
          <Button
            variant={selectedWishlist.priority ? "default" : "outline"}
            size="icon"
            className="rounded-full"
            onClick={() => togglePriority(selectedWishlist.id, !selectedWishlist.priority)}
            aria-label={selectedWishlist.priority ? "Remove priority" : "Mark as priority"}
          >
            <Star fill={selectedWishlist.priority ? "currentColor" : "none"} />
          </Button>
        </div>
        <Button
          variant="secondary"
          className="mb-4 w-full rounded-full"
          onClick={() => openCardEditor(selectedWishlist)}
        >
          <Plus /> Add or remove cards
        </Button>
        <div className="grid grid-cols-3 gap-3">
          {cards.map(card => (
            <Button
              key={card.id}
              variant="outline"
              className="h-auto overflow-hidden rounded-xl bg-card p-0"
              onClick={() => navigate(`/card/${card.id}`)}
            >
              <span className="block w-full">
                <PhotocardImage
                  groupId={card.groupId}
                  memberId={card.memberId}
                  memberName={card.memberName}
                  imgSeed={card.imgSeed}
                  databaseImageFilename={card.databaseImageFilename}
                  uploadImageFilename={card.uploadImageFilename}
                  className="aspect-[2/3] w-full"
                />
                <span className="block p-2 text-left">
                  <span className="block truncate text-xs font-semibold text-foreground">{card.memberName}</span>
                  <span className="block truncate text-xs text-muted-foreground">{card.era}</span>
                </span>
              </span>
            </Button>
          ))}
          {descriptions.map(description => (
            <div key={description.id} className="overflow-hidden rounded-xl bg-card">
              <div className="flex aspect-[2/3] items-center justify-center bg-muted text-primary">
                <Heart size={28} />
              </div>
              <div className="p-2">
                <div className="line-clamp-2 text-xs font-semibold text-foreground">{description.label}</div>
                <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{description.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 pb-8">
      <div className="sticky top-0 z-20 -mx-4 flex items-center gap-3 bg-background px-4 py-4">
        <Button variant="secondary" size="icon" className="rounded-full" onClick={() => navigate("/profile")} aria-label="Back to profile">
          <ArrowLeft />
        </Button>
        <div className="flex-1">
          <div className="text-xl font-semibold text-foreground">My wishlists</div>
          <div className="text-sm text-muted-foreground">
            {wishlists.length} saved wishlist{wishlists.length === 1 ? "" : "s"}
          </div>
        </div>
        {wishlists.length > 0 && (
          <Button size="sm" className="rounded-full" onClick={openCreator}>
            <Plus /> New
          </Button>
        )}
      </div>

      {wishlists.length === 0 ? (
        <div className="mt-10 rounded-2xl bg-card p-6 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-secondary text-primary">
            <Heart size={28} />
          </div>
          <div className="mt-4 text-lg font-semibold text-card-foreground">Build your first wishlist</div>
          <div className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
            Organize the photocards you are hunting for by group, member, era, or card type.
          </div>
          <Button className="mt-5 rounded-full" onClick={openCreator}>
            <Plus /> Create a wishlist
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {wishlists
            .slice()
            .sort((a, b) => Number(b.priority) - Number(a.priority))
            .map(wishlist => {
              const cards = PHOTOCARDS.filter(card => wishlist.cardIds.includes(card.id));
              const descriptions = wishlist.descriptions || [];
              const itemCount = cards.length + descriptions.length;
              const group = GROUPS_DATA.find(item => item.id === wishlist.groupId);
              const groupCount = new Set(cards.map(card => card.groupId)).size;
              return (
                <div key={wishlist.id} className="rounded-2xl bg-card p-4">
                  <div className="flex items-start gap-3">
                    <Button
                      variant="ghost"
                      className="h-auto min-w-0 flex-1 justify-start p-0 text-left hover:bg-transparent"
                      onClick={() => openWishlist(wishlist.id)}
                    >
                      <span className="flex -space-x-4">
                        {cards.slice(0, 3).map(card => (
                          <PhotocardImage
                            key={card.id}
                            groupId={card.groupId}
                            memberId={card.memberId}
                            memberName={card.memberName}
                            imgSeed={card.imgSeed}
                            databaseImageFilename={card.databaseImageFilename}
                            uploadImageFilename={card.uploadImageFilename}
                            className="h-16 w-11 rounded-lg border-2 border-card object-cover"
                          />
                        ))}
                        {cards.length === 0 && descriptions.length > 0 && (
                          <span className="flex h-16 w-11 items-center justify-center rounded-lg bg-muted text-primary">
                            <Heart size={18} />
                          </span>
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1">
                          <span className="truncate font-semibold text-card-foreground">{wishlist.name}</span>
                          {wishlist.priority && <Star size={14} className="shrink-0 text-primary" fill="currentColor" />}
                        </span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {groupCount > 1 ? `${groupCount} groups` : group?.name} · {itemCount} card
                          {itemCount === 1 ? "" : "s"}
                        </span>
                      </span>
                      <ChevronRight className="shrink-0 text-muted-foreground" />
                    </Button>
                  </div>
                  <Button
                    variant={wishlist.priority ? "secondary" : "outline"}
                    size="sm"
                    className="mt-3 w-full rounded-full"
                    onClick={() => togglePriority(wishlist.id, !wishlist.priority)}
                  >
                    <Star fill={wishlist.priority ? "currentColor" : "none"} />
                    {wishlist.priority ? "Priority wishlist" : "Mark as priority"}
                  </Button>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

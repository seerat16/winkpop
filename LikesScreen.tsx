import { useState } from "react";
import { ArrowLeft, Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { PhotocardImage } from "../components/PhotocardImage";
import { PHOTOCARDS } from "../data/mockData";
import { getCurrentUser, removeFromLikes } from "../data/userStore";
import { useNavigate } from "../router";

export default function LikesScreen() {
  const navigate = useNavigate();
  const [likedIds, setLikedIds] = useState<string[]>(() => getCurrentUser()?.likesIds || []);
  const likedPosts = PHOTOCARDS.filter(card => likedIds.includes(card.id));

  const removeLike = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    removeFromLikes(id);
    setLikedIds(current => current.filter(cardId => cardId !== id));
    toast("Removed from likes");
  };

  return (
    <div className="min-h-screen bg-background px-4 pb-8">
      <div className="sticky top-0 z-20 -mx-4 flex items-center gap-3 bg-background px-4 py-4">
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full"
          onClick={() => navigate("/home")}
          aria-label="Back to Discover"
        >
          <ArrowLeft />
        </Button>
        <div className="flex-1">
          <div className="text-xl font-semibold text-foreground">Likes</div>
          <div className="text-sm text-muted-foreground">
            {likedPosts.length} liked post{likedPosts.length === 1 ? "" : "s"}
          </div>
        </div>
      </div>

      {likedPosts.length === 0 ? (
        <div className="mt-10 rounded-2xl bg-card p-6 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-secondary text-primary">
            <Heart size={28} />
          </div>
          <div className="mt-4 text-lg font-semibold text-card-foreground">No liked posts yet</div>
          <div className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
            Tap the heart on a Discover post to save it here.
          </div>
          <Button className="mt-5 rounded-full" onClick={() => navigate("/home")}>
            Browse Discover
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {likedPosts.map(card => (
            <div
              key={card.id}
              role="button"
              tabIndex={0}
              className="relative overflow-hidden rounded-2xl border border-border bg-card text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              onClick={() => navigate(`/card/${card.id}`)}
              onKeyDown={event => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  navigate(`/card/${card.id}`);
                }
              }}
            >
              <span className="block w-full">
                <PhotocardImage
                  groupId={card.groupId}
                  memberId={card.memberId}
                  memberName={card.memberName}
                  imgSeed={card.imgSeed}
                  databaseImageFilename={card.databaseImageFilename}
                  uploadImageFilename={card.uploadImageFilename}
                  className="aspect-[3/4] w-full"
                />
                <span className="block p-2.5">
                  <span className="block text-xs font-semibold text-primary">{card.groupName}</span>
                  <span className="mt-1 block truncate text-sm text-foreground">
                    {card.memberName} · {card.era}
                  </span>
                  <span className="mt-1 block text-sm font-semibold text-foreground">
                    ${card.price.toFixed(2)} USD
                  </span>
                </span>
              </span>
              <Button
                size="icon"
                className="absolute right-2 top-2 size-8 rounded-full"
                onClick={event => removeLike(card.id, event)}
                aria-label={`Remove ${card.memberName} from likes`}
              >
                <Heart fill="currentColor" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

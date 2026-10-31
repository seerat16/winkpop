import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button, Modal } from "@figma/astraui";
import { useNavigate } from "../router";

interface MessageSellerButtonProps {
  sellerUsername: string;
  listingTitle: string;
  listingPath: string;
  category: "sale" | "trade";
  className?: string;
}

export function MessageSellerButton({
  sellerUsername,
  listingTitle,
  listingPath,
  category,
  className,
}: MessageSellerButtonProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const openSellerMessage = () => {
    const params = new URLSearchParams({
      mode: "message",
      to: sellerUsername,
      category,
      draft: `Hi! I'm interested in ${listingTitle}. Is it still available?`,
      listingTitle,
      listingPath,
    });
    setIsOpen(false);
    navigate(`/messages?${params.toString()}`);
  };

  return (
    <>
      <Button
        type="button"
        variant="neutral"
        size="small"
        iconStart={<MessageCircle size={16} />}
        className={className}
        onClick={event => {
          event.stopPropagation();
          setIsOpen(true);
        }}
      >
        Message seller
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Message seller?"
        size="small"
        footer={
          <>
            <Button variant="neutral" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={openSellerMessage}>
              Message @{sellerUsername}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-lg">
          <div className="text-label-sm text-text-primary">
            Start a direct conversation with @{sellerUsername} about this listing.
          </div>
          <div className="rounded-corner-md bg-bg-subtle p-lg">
            <div className="text-label-sm font-semibold text-text-primary">
              {listingTitle}
            </div>
            <div className="mt-xs text-video-title text-text-secondary">
              Your message will be prefilled so you can review it before sending.
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}

import { useState, useEffect } from "react";
import { useNavigate } from "../router";
import {
  ArrowLeftRight,
  Bookmark,
  ChevronRight,
  Eye,
  Heart,
  ListFilter,
  Package,
  Plus,
  ShoppingBag,
  ShoppingCart,
  Tag,
} from "lucide-react";
import { PHOTOCARDS, MY_WISHLIST_IDS } from "../data/mockData";
import { getCurrentUser, addToCart, removeFromCart } from "../data/userStore";
import { getTrades, type Trade } from "../data/tradeStore";
import { PhotocardImage } from "../components/PhotocardImage";
import { Button } from "../components/ui/button";
import { getListingActivity } from "../data/listingActivityStore";
import TradingTransactionsContent from "./TradingTransactionsContent";

type MainTab = "trading" | "buying" | "selling" | "tracking";
type SalesFilter = "suggested" | "new";

const FOR_SALE = PHOTOCARDS.filter((_, i) => i % 3 !== 2);

function loadUploadedListings(): any[] {
  try {
    const listings = JSON.parse(localStorage.getItem("barter_my_listings") || "[]");
    return Array.isArray(listings) ? listings : [];
  } catch {
    return [];
  }
}

export default function TransactionsScreen() {
  const navigate = useNavigate();
  const [mainTab, setMainTab]     = useState<MainTab>("trading");
  const [salesFilter, setSalesFilter] = useState<SalesFilter>("suggested");
  const [trades, setTrades]       = useState<Trade[]>(() => getTrades());
  const [wishlist, setWishlist]   = useState<string[]>(MY_WISHLIST_IDS);
  const [cartIds, setCartIds]     = useState<string[]>(() => getCurrentUser()?.cartIds ?? []);

  useEffect(() => { setTrades(getTrades()); }, [mainTab]);

  const toggleWishlist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleCart = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (cartIds.includes(id)) { removeFromCart(id); setCartIds(p => p.filter(i => i !== id)); }
    else { addToCart(id); setCartIds(p => [...p, id]); }
  };

  const saleCards = salesFilter === "suggested"
    ? FOR_SALE.slice(0, 12)
    : [...FOR_SALE].sort((a, b) => b.imgSeed - a.imgSeed).slice(0, 12);

  const getCard = (id: string) => PHOTOCARDS.find(c => c.id === id);
  const uploadedListings = loadUploadedListings();
  const ownedCatalogListings = PHOTOCARDS.filter(card => card.sellerId === "me").map(card => ({
    id: card.id,
    title: `${card.groupName} ${card.memberName} · ${card.era}`,
    listingType: "both",
    price: String(card.price),
    condition: card.condition,
    photocardId: card.id,
    isPhotocard: true,
  }));
  const listings = [...uploadedListings, ...ownedCatalogListings];

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--background)" }}>

      {/* ── Main tabs ── */}
      <div className="flex border-b px-4 pt-5" style={{ borderColor: "var(--border)", background: "var(--background)" }}>
        {(["buying", "selling", "trading", "tracking"] as MainTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setMainTab(tab)}
            className="flex-1 pb-3 uppercase"
            style={{
              fontWeight: 800, fontSize: "0.75rem", letterSpacing: "0.03em",
              color: mainTab === tab ? "var(--foreground)" : "var(--muted-foreground)",
              borderBottom: `2.5px solid ${mainTab === tab ? "var(--foreground)" : "transparent"}`,
              marginBottom: -1,
            }}
          >{tab}</button>
        ))}
      </div>

      {/* ── TRADING TAB ── */}
      {mainTab === "trading" && <TradingTransactionsContent />}

      {/* ── BUYING TAB ── */}
      {mainTab === "buying" && (
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-8">
          <div
            className="rounded-2xl p-4 mb-3 flex items-center gap-4 cursor-pointer"
            style={{ background: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)" }}
            onClick={() => navigate("/wishlist")}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.25)" }}>
              <Heart size={28} color="#fff" fill="#fff" />
            </div>
            <div className="flex-1">
              <div style={{ fontWeight: 800, color: "#fff", fontSize: "1rem" }}>Likes</div>
              <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.75rem", marginTop: 3, lineHeight: 1.4 }}>
                Trade your card for items in their likes &amp; more
              </div>
            </div>
          </div>

          <div
            className="rounded-2xl p-4 mb-4 flex items-center gap-4 cursor-pointer"
            style={{ background: "var(--card)", border: "1.5px solid var(--border)" }}
            onClick={() => navigate("/cart")}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--secondary)" }}>
              <ShoppingCart size={26} color="var(--primary)" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span style={{ fontWeight: 800, color: "var(--foreground)", fontSize: "1rem" }}>Shopping Cart</span>
                {cartIds.length > 0 && (
                  <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "var(--primary)", color: "#fff", fontSize: "0.65rem", fontWeight: 700 }}>
                    {cartIds.length}
                  </span>
                )}
              </div>
              <div style={{ color: "var(--muted-foreground)", fontSize: "0.75rem", marginTop: 3 }}>
                {cartIds.length > 0 ? `${cartIds.length} item${cartIds.length !== 1 ? "s" : ""} · ready for purchase` : "Your cart is empty"}
              </div>
            </div>
          </div>

          <div className="flex justify-end mb-4">
            <button
              onClick={() => navigate("/browse")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full"
              style={{ background: "var(--secondary)", color: "var(--primary)", fontSize: "0.78rem", fontWeight: 600 }}
            >Browse Photocards →</button>
          </div>

          <div className="flex items-center justify-between mb-3">
            <span style={{ fontWeight: 700, color: "var(--foreground)", fontSize: "0.95rem" }}>Featured Deals</span>
            <div className="flex gap-2">
              {(["suggested", "new"] as SalesFilter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setSalesFilter(f)}
                  className="px-3 py-1 rounded-full"
                  style={{
                    background: salesFilter === f ? "var(--primary)" : "var(--card)",
                    color: salesFilter === f ? "#fff" : "var(--muted-foreground)",
                    border: `1.5px solid ${salesFilter === f ? "var(--primary)" : "var(--border)"}`,
                    fontSize: "0.72rem", fontWeight: 600,
                  }}
                >{f === "suggested" ? "Suggested" : "New"}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {saleCards.map(card => {
              const isWishlisted = wishlist.includes(card.id);
              const isInCart     = cartIds.includes(card.id);
              return (
                <div
                  key={card.id}
                  onClick={() => navigate(`/card/${card.id}`)}
                  className="rounded-2xl overflow-hidden cursor-pointer"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                >
                  <div className="relative">
                    <PhotocardImage
                      groupId={card.groupId} memberId={card.memberId} memberName={card.memberName}
                      imgSeed={card.imgSeed} databaseImageFilename={card.databaseImageFilename}
                      uploadImageFilename={card.uploadImageFilename}
                      className="w-full" style={{ aspectRatio: "3/4" } as any}
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button onClick={e => toggleCart(card.id, e)} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: isInCart ? "#5CC0A8" : "rgba(255,255,255,0.92)" }}>
                        <ShoppingCart size={11} color={isInCart ? "#fff" : "#888"} />
                      </button>
                      <button onClick={e => toggleWishlist(card.id, e)} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.92)" }}>
                        <Heart size={11} color={isWishlisted ? "var(--primary)" : "#ccc"} fill={isWishlisted ? "var(--primary)" : "none"} />
                      </button>
                    </div>
                    {card.damaged && (
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-lg" style={{ background: "#F4A07C" }}>
                        <span style={{ color: "#fff", fontSize: "8px", fontWeight: 700 }}>⚠ DAMAGED</span>
                      </div>
                    )}
                  </div>
                  <div className="px-2.5 py-2">
                    <div style={{ fontSize: "0.65rem", color: "var(--primary)", fontWeight: 700 }}>{card.groupName}</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--foreground)", marginTop: 1 }} className="line-clamp-1">{card.memberName} · {card.era}</div>
                    <div style={{ fontWeight: 700, color: "var(--foreground)", marginTop: 2, fontSize: "0.85rem" }}>
                      ${card.price.toFixed(2)} <span style={{ color: "var(--muted-foreground)", fontWeight: 400, fontSize: "0.65rem" }}>USD</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SELLING TAB ── */}
      {mainTab === "selling" && (
        <div className="flex-1 overflow-y-auto px-4 pb-8 pt-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <div className="text-lg font-semibold text-foreground">Your listings</div>
              <div className="mt-1 text-sm text-muted-foreground">
                See active listings and offers received on each card.
              </div>
            </div>
            <Button className="shrink-0 rounded-full" size="sm" onClick={() => navigate("/list-card")}>
              <Plus /> New
            </Button>
          </div>

          {listings.length === 0 ? (
            <div className="rounded-2xl bg-card p-6 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-secondary text-primary">
                <Tag size={24} />
              </div>
              <div className="mt-4 font-semibold text-card-foreground">No listings yet</div>
              <div className="mt-1 text-sm text-muted-foreground">
                List a photocard to start receiving purchase and trade offers.
              </div>
              <Button className="mt-4 rounded-full" onClick={() => navigate("/list-card")}>
                <Plus /> Create listing
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {listings.map(listing => {
                const referenceCardId =
                  listing.photocardId ||
                  listing.typeReferenceCardId ||
                  (PHOTOCARDS.some(card => card.id === listing.id) ? listing.id : null);
                const referenceCard = referenceCardId ? getCard(referenceCardId) : null;
                const offers = referenceCardId
                  ? trades.filter(
                      trade =>
                        trade.type === "incoming" &&
                        trade.requestedCardId === referenceCardId &&
                        trade.status !== "declined",
                    )
                  : [];
                const pendingOffers = offers.filter(offer => offer.status === "pending");
                const activity = getListingActivity(
                  listing.id,
                  referenceCardId,
                  Boolean(listing.isPhotocard),
                );
                const listingType =
                  listing.listingType === "for-sale"
                    ? "For sale"
                    : listing.listingType === "for-trade"
                      ? "For trade"
                      : "Sale or trade";

                return (
                  <div key={`${listing.isPhotocard ? "catalog" : "upload"}-${listing.id}`} className="rounded-2xl bg-card p-3">
                    <div className="flex gap-3">
                      <div className="h-24 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                        {referenceCard ? (
                          <PhotocardImage
                            groupId={referenceCard.groupId}
                            memberId={referenceCard.memberId}
                            memberName={referenceCard.memberName}
                            imgSeed={referenceCard.imgSeed}
                            databaseImageFilename={referenceCard.databaseImageFilename}
                            uploadImageFilename={referenceCard.uploadImageFilename}
                            imageMode="upload"
                            className="h-full w-full"
                          />
                        ) : listing.photoUri ? (
                          <img src={listing.photoUri} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-primary">
                            <Tag size={22} />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-card-foreground">
                              {listing.title || "Untitled listing"}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {listingType}
                              {listing.price ? ` · $${Number(listing.price).toFixed(2)}` : ""}
                            </div>
                          </div>
                          {pendingOffers.length > 0 && (
                            <span className="shrink-0 rounded-full bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">
                              {pendingOffers.length} offer{pendingOffers.length === 1 ? "" : "s"}
                            </span>
                          )}
                        </div>

                        {offers.length > 0 ? (
                          <div className="mt-3 rounded-xl bg-secondary p-2.5">
                            <div className="text-xs font-semibold text-secondary-foreground">
                              Latest offer from @{offers[0].fromUser}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {getCard(offers[0].offeredCardId)
                                ? `Offering ${getCard(offers[0].offeredCardId)?.memberName} · ${getCard(offers[0].offeredCardId)?.era}`
                                : "New trade offer"}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 text-xs text-muted-foreground">No offers yet</div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-4 gap-2">
                      {[
                        { icon: Heart, label: "Liked", value: activity.liked },
                        { icon: Bookmark, label: "Saved", value: activity.saved },
                        { icon: Eye, label: "Viewed", value: activity.viewed },
                        { icon: ShoppingCart, label: "In cart", value: activity.addedToCart },
                      ].map(metric => (
                        <div key={metric.label} className="rounded-xl bg-background p-2 text-center">
                          <metric.icon className="mx-auto text-muted-foreground" size={15} />
                          <div className="mt-1 text-sm font-semibold text-foreground">{metric.value}</div>
                          <div className="text-xs text-muted-foreground">{metric.label}</div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 rounded-full"
                        onClick={() =>
                          navigate(listing.isPhotocard ? `/card/${listing.id}` : `/listing/${listing.id}`)
                        }
                      >
                        View listing
                      </Button>
                      {offers.length > 0 && (
                        <Button
                          size="sm"
                          className="flex-1 rounded-full"
                          onClick={() => {
                            setMainTab("trading");
                          }}
                        >
                          View offers
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TRACKING TAB ── */}
      {mainTab === "tracking" && (
        <div className="flex-1 overflow-y-auto px-4 pb-8 pt-4">
          <div className="mb-4">
            <div className="text-lg font-semibold text-foreground">Track your activity</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Review your trades, sales, and purchases in one place.
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {[
              {
                icon: ArrowLeftRight,
                title: "Trades",
                description: "Manage incoming and outgoing trade requests.",
                path: "/trades",
                iconClass: "bg-secondary text-primary",
              },
              {
                icon: Package,
                title: "Sales",
                description: "Track sold cards, earnings, and delivery status.",
                path: "/my-sales",
                iconClass: "bg-accent text-accent-foreground",
              },
              {
                icon: ShoppingBag,
                title: "Purchases",
                description: "Follow purchases from pending through delivery.",
                path: "/purchases",
                iconClass: "bg-muted text-muted-foreground",
              },
              {
                icon: ListFilter,
                title: "All",
                description: "Track every trade, sale, and purchase together.",
                path: "/all-tracking",
                iconClass: "bg-secondary text-secondary-foreground",
              },
            ].map(item => (
              <Button
                key={item.title}
                variant="outline"
                onClick={() => navigate(item.path)}
                className="h-auto w-full justify-start whitespace-normal rounded-2xl bg-card p-4 text-left"
              >
                <span className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${item.iconClass}`}>
                  <item.icon size={22} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-card-foreground">{item.title}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{item.description}</span>
                </span>
                <ChevronRight className="shrink-0 text-muted-foreground" size={20} />
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

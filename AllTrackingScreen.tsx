import { useState } from "react";
import { ArrowLeft, ArrowLeftRight, Package, ShoppingBag, Tag } from "lucide-react";
import { Button } from "../components/ui/button";
import { useNavigate } from "../router";
import { MOCK_TRADES } from "./TradesScreen";
import { MOCK_SALES } from "./MySalesScreen";
import { MOCK_PURCHASES } from "./PurchasesScreen";
import { matchesTrackingFilters, TrackingSearchFilters } from "../components/TrackingSearchFilters";
import type { CardType } from "../data/mockData";

type TrackingStatus = "delivered" | "in transit" | "pending";
type TrackingFilter = "all" | TrackingStatus;
type ActivityType = "Trade" | "Sale" | "Purchase";

interface TrackingActivity {
  id: string;
  title: string;
  person: string;
  price: number;
  date: string;
  status: TrackingStatus;
  imgGrad: string;
  type: ActivityType;
  description: string;
  group: string;
  idol: string;
  categoryType: CardType;
}

const STATUS_MAP: Record<TrackingStatus, { label: string; color: string; bg: string }> = {
  delivered: { label: "Delivered", color: "#5CC0A8", bg: "#EDFAF5" },
  "in transit": { label: "In Transit", color: "#9B82D4", bg: "#F5F0FF" },
  pending: { label: "Pending", color: "#F39C12", bg: "#FFF8E1" },
};

const TYPE_MAP: Record<ActivityType, { color: string; bg: string }> = {
  Trade: { color: "var(--primary)", bg: "var(--secondary)" },
  Sale: { color: "#3A9080", bg: "#EDFAF5" },
  Purchase: { color: "#477EA8", bg: "#EEF7FF" },
};

const ALL_ACTIVITY: TrackingActivity[] = [
  ...MOCK_TRADES.map(item => ({
    ...item,
    id: `trade-${item.id}`,
    person: item.buyer,
    status: item.status as TrackingStatus,
    type: "Trade" as const,
  })),
  ...MOCK_SALES.map(item => ({
    ...item,
    id: `sale-${item.id}`,
    person: item.buyer,
    status: item.status as TrackingStatus,
    type: "Sale" as const,
  })),
  ...MOCK_PURCHASES.map(item => ({
    ...item,
    id: `purchase-${item.id}`,
    person: item.seller,
    status: item.status as TrackingStatus,
    type: "Purchase" as const,
  })),
].sort((a, b) => b.date.localeCompare(a.date));

function ActivityIcon({ type }: { type: ActivityType }) {
  if (type === "Trade") return <ArrowLeftRight size={16} />;
  if (type === "Sale") return <Tag size={16} />;
  return <ShoppingBag size={16} />;
}

export default function AllTrackingScreen() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<TrackingFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedIdols, setSelectedIdols] = useState<string[]>([]);
  const [selectedCategoryTypes, setSelectedCategoryTypes] = useState<CardType[]>([]);
  const displayed = ALL_ACTIVITY.filter(activity =>
    (filter === "all" || activity.status === filter) &&
    matchesTrackingFilters(activity, query, selectedGroups, selectedIdols, selectedCategoryTypes)
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="sticky top-0 z-10 flex items-center gap-3 bg-background px-4 pb-3 pt-5">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(-1)}
          className="rounded-full"
          aria-label="Back to Tracking"
        >
          <ArrowLeft size={18} />
        </Button>
        <div>
          <div className="text-lg font-semibold text-foreground">All</div>
          <div className="text-xs text-muted-foreground">Trades, sales, and purchases</div>
        </div>
      </div>

      <div className="mx-4 mb-4 rounded-2xl bg-gradient-to-br from-primary via-accent to-secondary p-4">
        <div className="text-sm font-semibold text-primary-foreground/85">All card activity</div>
        <div className="mt-1 text-2xl font-semibold text-primary-foreground">{ALL_ACTIVITY.length}</div>
        <div className="mt-1 text-xs text-primary-foreground/75">
          {ALL_ACTIVITY.filter(activity => activity.status === "in transit").length} in transit ·{" "}
          {ALL_ACTIVITY.filter(activity => activity.status === "pending").length} pending
        </div>
      </div>

      <TrackingSearchFilters
        items={ALL_ACTIVITY}
        query={query}
        onQueryChange={setQuery}
        selectedGroups={selectedGroups}
        onGroupToggle={group =>
          setSelectedGroups(current =>
            current.includes(group)
              ? current.filter(value => value !== group)
              : [...current, group]
          )
        }
        selectedIdols={selectedIdols}
        onIdolToggle={idol =>
          setSelectedIdols(current =>
            current.includes(idol)
              ? current.filter(value => value !== idol)
              : [...current, idol]
          )
        }
        selectedCategoryTypes={selectedCategoryTypes}
        onCategoryTypeToggle={categoryType =>
          setSelectedCategoryTypes(current =>
            current.includes(categoryType)
              ? current.filter(value => value !== categoryType)
              : [...current, categoryType]
          )
        }
      />

      <div className="mb-3 flex gap-2 overflow-x-auto px-4">
        {(["all", "delivered", "in transit", "pending"] as TrackingFilter[]).map(option => (
          <Button
            key={option}
            variant={filter === option ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(option)}
            className="shrink-0 rounded-full"
          >
            {option === "all"
              ? "All"
              : option === "in transit"
                ? "In Transit"
                : option.charAt(0).toUpperCase() + option.slice(1)}
          </Button>
        ))}
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 pb-8">
        {displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
            <Package size={36} strokeWidth={1} />
            <div className="text-sm">No matching activity</div>
          </div>
        ) : (
          displayed.map(activity => {
            const status = STATUS_MAP[activity.status];
            const type = TYPE_MAP[activity.type];
            return (
              <div key={activity.id} className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3">
                <div
                  className="flex h-18 w-14 shrink-0 items-center justify-center rounded-xl text-xl"
                  style={{ background: activity.imgGrad }}
                >
                  <span aria-hidden="true">🎴</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{ background: type.bg, color: type.color }}
                    >
                      <ActivityIcon type={activity.type} />
                      {activity.type}
                    </span>
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{ background: status.bg, color: status.color }}
                    >
                      {status.label}
                    </span>
                  </div>
                  <div className="mt-2 truncate text-sm font-semibold text-foreground">{activity.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {activity.person} · {activity.date}
                  </div>
                </div>
                <div
                  className="shrink-0 text-sm font-semibold"
                  style={{
                    color:
                      activity.type === "Sale"
                        ? "#3A9080"
                        : activity.type === "Purchase"
                          ? "var(--foreground)"
                          : "var(--primary)",
                  }}
                >
                  {activity.type === "Trade"
                    ? "Trade"
                    : `${activity.type === "Sale" ? "+" : "-"}$${activity.price.toFixed(2)}`}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

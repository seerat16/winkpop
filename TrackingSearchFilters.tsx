import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { CARD_TYPES, type CardType } from "../data/mockData";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export interface TrackingFilterableItem {
  title: string;
  description: string;
  group: string;
  idol: string;
  categoryType: CardType;
}

interface TrackingSearchFiltersProps {
  items: TrackingFilterableItem[];
  query: string;
  onQueryChange: (value: string) => void;
  selectedGroups: string[];
  onGroupToggle: (value: string) => void;
  selectedIdols: string[];
  onIdolToggle: (value: string) => void;
  selectedCategoryTypes: CardType[];
  onCategoryTypeToggle: (value: CardType) => void;
}

export function matchesTrackingFilters(
  item: TrackingFilterableItem,
  query: string,
  selectedGroups: string[],
  selectedIdols: string[],
  selectedCategoryTypes: CardType[],
) {
  const normalizedQuery = query.trim().toLowerCase();
  const searchableText = [
    item.title,
    item.description,
    item.group,
    item.idol,
  ].join(" ").toLowerCase();

  return (
    (!normalizedQuery || searchableText.includes(normalizedQuery)) &&
    (selectedGroups.length === 0 || selectedGroups.includes(item.group)) &&
    (selectedIdols.length === 0 || selectedIdols.includes(item.idol)) &&
    (selectedCategoryTypes.length === 0 ||
      selectedCategoryTypes.includes(item.categoryType))
  );
}

export function TrackingSearchFilters({
  items,
  query,
  onQueryChange,
  selectedGroups,
  onGroupToggle,
  selectedIdols,
  onIdolToggle,
  selectedCategoryTypes,
  onCategoryTypeToggle,
}: TrackingSearchFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [expandedFilter, setExpandedFilter] = useState<"group" | "idol" | "category" | null>(null);
  const groups = [...new Set(items.map(item => item.group))].sort();
  const idols = [...new Set(items.map(item => item.idol))].sort();
  const activeFilterCount =
    selectedGroups.length +
    selectedIdols.length +
    selectedCategoryTypes.length;
  const filterSections: {
    id: "group" | "idol" | "category";
    label: string;
    options: readonly string[];
    selected: readonly string[];
    onToggle: (value: string) => void;
  }[] = [
    {
      id: "group",
      label: "Group",
      options: groups,
      selected: selectedGroups,
      onToggle: onGroupToggle,
    },
    {
      id: "idol",
      label: "Idol",
      options: idols,
      selected: selectedIdols,
      onToggle: onIdolToggle,
    },
    {
      id: "category",
      label: "Category type",
      options: CARD_TYPES,
      selected: selectedCategoryTypes,
      onToggle: value => onCategoryTypeToggle(value as CardType),
    },
  ];

  return (
    <div className="mx-4 mb-3 flex flex-col gap-2">
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={16}
        />
        <Input
          value={query}
          onChange={event => onQueryChange(event.target.value)}
          placeholder="Search listing descriptions"
          aria-label="Search listing descriptions"
          className="h-11 rounded-xl bg-card pl-10"
        />
      </div>
      <Button
        variant="outline"
        onClick={() => setShowFilters(current => !current)}
        className="h-10 w-full justify-between rounded-xl bg-card"
        aria-expanded={showFilters}
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal size={16} />
          Filters
          {activeFilterCount > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </span>
        <ChevronDown
          size={16}
          className={showFilters ? "rotate-180 transition-transform" : "transition-transform"}
        />
      </Button>

      {showFilters && (
        <div className="flex flex-col gap-3 rounded-2xl bg-card p-3">
          {filterSections.map(filterSection => (
            <div key={filterSection.id}>
              <Button
                variant="outline"
                onClick={() =>
                  setExpandedFilter(current =>
                    current === filterSection.id ? null : filterSection.id
                  )
                }
                className="h-10 w-full justify-between rounded-xl"
                aria-expanded={expandedFilter === filterSection.id}
              >
                <span>
                  {filterSection.label}
                  {filterSection.selected.length > 0 && ` · ${filterSection.selected.length}`}
                </span>
                <ChevronDown
                  size={16}
                  className={
                    expandedFilter === filterSection.id
                      ? "rotate-180 transition-transform"
                      : "transition-transform"
                  }
                />
              </Button>

              {expandedFilter === filterSection.id && (
                <div className="mt-2 flex flex-wrap gap-2 rounded-xl bg-background p-3">
                  {filterSection.options.map(option => {
                    const isSelected = filterSection.selected.includes(option);
                    return (
                      <Button
                        key={option}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => filterSection.onToggle(option)}
                        className="h-8 rounded-full"
                      >
                        {option}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

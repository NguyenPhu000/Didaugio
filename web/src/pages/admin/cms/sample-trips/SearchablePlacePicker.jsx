import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, MapPin, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { getPlaceImage } from "./sampleTripUtils";

export function SearchablePlacePicker({ places = [], value, onChange, onCreateQuick }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const selectedPlace = places.find((place) => String(place.id) === String(value));

  const categoryMap = new Map();
  places.forEach((place) => {
    if (place.category) categoryMap.set(place.category.id, place.category);
  });
  const categories = Array.from(categoryMap.values());

  const query = search.trim().toLowerCase();
  const filteredPlaces = places.filter((place) => {
    const matchSearch =
      !query ||
      place.name?.toLowerCase().includes(query) ||
      place.address?.toLowerCase().includes(query);
    const matchCategory =
      categoryFilter === "all" || String(place.category?.id) === categoryFilter;
    return matchSearch && matchCategory;
  });

  const groupedMap = new Map();
  filteredPlaces.forEach((place) => {
    const catName = place.category?.name || t("common.other") || "Other";
    const catId = place.category?.id || "other";
    if (!groupedMap.has(catId)) groupedMap.set(catId, { name: catName, items: [] });
    groupedMap.get(catId).items.push(place);
  });
  const groupedPlaces = Array.from(groupedMap.values());

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-10 w-full items-center justify-between rounded-lg border border-input bg-white px-3 text-sm transition-colors hover:border-violet-300"
      >
        {selectedPlace ? (
          <div className="flex min-w-0 items-center gap-2">
            {getPlaceImage(selectedPlace) ? (
              <img
                src={getPlaceImage(selectedPlace)}
                alt={selectedPlace.name}
                className="h-6 w-6 shrink-0 rounded object-cover"
              />
            ) : (
              <MapPin className="h-3.5 w-3.5 shrink-0 text-violet-600" />
            )}
            <span className="truncate font-medium">{selectedPlace.name}</span>
            {selectedPlace.category ? (
              <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {selectedPlace.category.name}
              </span>
            ) : null}
          </div>
        ) : (
          <span className="text-muted-foreground">{t("admin.cms.selectPlace")}</span>
        )}
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border bg-white shadow-lg">
          <div className="space-y-2 border-b p-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("admin.cms.searchPlaces")}
                className="h-8 pl-8 text-xs"
                autoFocus
              />
            </div>
            <div className="flex gap-1 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setCategoryFilter("all")}
                className={`whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-semibold transition-colors ${
                  categoryFilter === "all"
                    ? "bg-violet-600 text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {t("admin.cms.allPlaces", { count: places.length })}
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setCategoryFilter(String(category.id))}
                  className={`whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-semibold transition-colors ${
                    categoryFilter === String(category.id)
                      ? "bg-violet-600 text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[260px] overflow-y-auto">
            {groupedPlaces.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                {t("admin.cms.noPlacesFound")}
              </div>
            ) : (
              groupedPlaces.map((group) => (
                <div key={group.name}>
                  <div className="sticky top-0 bg-muted/50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {group.name}
                  </div>
                  {group.items.map((place) => (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => {
                        onChange(String(place.id));
                        setOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-violet-50"
                    >
                      {getPlaceImage(place) ? (
                        <img
                          src={getPlaceImage(place)}
                          alt={place.name}
                          className="h-9 w-11 shrink-0 rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-11 shrink-0 items-center justify-center rounded-md bg-muted">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{place.name}</p>
                        {place.address ? (
                          <p className="truncate text-[10px] text-muted-foreground">
                            {place.address}
                          </p>
                        ) : null}
                      </div>
                      {String(value) === String(place.id) ? (
                        <Check className="h-3.5 w-3.5 text-violet-600" />
                      ) : null}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>

          {onCreateQuick ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onCreateQuick();
              }}
              className="flex w-full items-center justify-center gap-1.5 border-t bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-100"
            >
              <Plus className="h-3.5 w-3.5" />
              {t("admin.cms.quickCreatePlaceLink")}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

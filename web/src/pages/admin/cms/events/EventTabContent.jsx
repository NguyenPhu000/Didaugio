import { useTranslation } from "react-i18next";
import { Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/skeleton";
import { EventContentCard } from "./EventContentCard";

export function EventTabContent({
  items,
  isLoading,
  search,
  statusFilter,
  onCreate,
  onEdit,
  onToggle,
  onDelete,
}) {
  const { t } = useTranslation();
  const normalizedSearch = search.trim().toLowerCase();
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      !normalizedSearch ||
      item.title?.toLowerCase().includes(normalizedSearch) ||
      item.description?.toLowerCase().includes(normalizedSearch) ||
      item.location?.toLowerCase().includes(normalizedSearch);
    return matchesSearch && (statusFilter === "all" || item.status === statusFilter);
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Card key={index}>
            <CardContent className="flex items-start gap-4 p-4">
              <Skeleton className="h-24 w-24 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (filteredItems.length === 0) {
    const hasFilters = Boolean(search || statusFilter !== "all");
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <Calendar className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="text-lg font-medium">
            {hasFilters ? t("admin.cms.noResults") : t("admin.cms.noContentYet", { type: t("admin.cms.events").toLowerCase() })}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasFilters ? t("admin.cms.noResultsHint") : t("admin.cms.createFirstHint", { type: t("admin.cms.events").toLowerCase() })}
          </p>
          {!hasFilters ? (
            <Button variant="outline" className="mt-4 gap-2" onClick={onCreate}>
              <Plus className="h-4 w-4" />
              {t("admin.cms.createEventBtn")}
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {filteredItems.map((item) => (
        <EventContentCard
          key={item.id}
          item={item}
          onEdit={onEdit}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

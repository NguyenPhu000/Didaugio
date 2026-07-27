import React from "react";
import { useTranslation } from "react-i18next";
import { QrCode, Download, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBookingListContext } from "./BookingListContext";

export function BookingFilterBar({ places = [], onExportCsv, exportLoading }) {
  const { t } = useTranslation();
  const {
    search,
    setSearch,
    selectedPlace,
    setSelectedPlace,
    setQrScannerOpen,
  } = useBookingListContext();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-zinc-200/80 dark:bg-zinc-950 dark:border-zinc-800">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("business.bookings.searchPlaceholder")}
            className="pl-9 bg-zinc-50 border-zinc-200 focus-visible:bg-white dark:bg-zinc-900 dark:border-zinc-800"
          />
        </div>

        {/* Place Filter */}
        {places.length > 0 && (
          <Select value={selectedPlace} onValueChange={setSelectedPlace}>
            <SelectTrigger className="w-full sm:w-[200px] bg-zinc-50 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
              <SelectValue placeholder={t("business.bookings.allPlaces")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("business.bookings.allPlaces")}</SelectItem>
              {places.map((place) => (
                <SelectItem key={place.id} value={String(place.id)}>
                  {place.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Quick Action Buttons */}
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="outline"
          onClick={() => setQrScannerOpen(true)}
          className="gap-2 text-xs font-semibold"
        >
          <QrCode className="h-4 w-4" />
          {t("business.bookings.scanQr")}
        </Button>
        <Button
          variant="outline"
          onClick={onExportCsv}
          disabled={exportLoading}
          className="gap-2 text-xs font-semibold"
        >
          <Download className="h-4 w-4" />
          {exportLoading ? t("common.exporting") : t("business.bookings.exportCsv")}
        </Button>
      </div>
    </div>
  );
}

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
    selectedTimeSlot,
    setSelectedTimeSlot,
    setQrScannerOpen,
  } = useBookingListContext();

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div className="flex flex-1 flex-col sm:flex-row sm:items-center gap-2.5 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("business.bookings.searchPlaceholder")}
            className="pl-9 bg-slate-50 dark:bg-muted/50 border-slate-200 dark:border-border/80 rounded-xl text-xs focus-visible:bg-white"
          />
        </div>

        {/* Place Filter (Phân biệt Địa Điểm) */}
        {places.length > 0 && (
          <Select value={selectedPlace} onValueChange={setSelectedPlace}>
            <SelectTrigger className="w-full sm:w-[180px] bg-slate-50 dark:bg-muted/50 border-slate-200 dark:border-border/80 rounded-xl text-xs font-medium">
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

        {/* Time Slot Filter (Phân biệt Sáng / Chiều / Tối) */}
        <Select value={selectedTimeSlot} onValueChange={setSelectedTimeSlot}>
          <SelectTrigger className="w-full sm:w-[170px] bg-slate-50 dark:bg-muted/50 border-slate-200 dark:border-border/80 rounded-xl text-xs font-medium">
            <SelectValue placeholder="Tất cả khung giờ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả khung giờ</SelectItem>
            <SelectItem value="morning">Buổi Sáng (5h-12h)</SelectItem>
            <SelectItem value="afternoon">Buổi Chiều (12h-18h)</SelectItem>
            <SelectItem value="evening">Buổi Tối (18h-23h)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex items-center gap-2 self-start lg:self-auto shrink-0">
        <Button
          variant="outline"
          onClick={() => setQrScannerOpen(true)}
          className="rounded-xl h-9 px-3.5 text-xs font-bold border-slate-200 dark:border-border/80 shadow-xs"
        >
          <QrCode className="h-3.5 w-3.5 mr-1.5" />
          {t("business.bookings.scanQr")}
        </Button>
        <Button
          variant="outline"
          onClick={onExportCsv}
          disabled={exportLoading}
          className="rounded-xl h-9 px-3.5 text-xs font-bold border-slate-200 dark:border-border/80 shadow-xs"
        >
          <Download className="h-3.5 w-3.5 mr-1.5" />
          {exportLoading ? t("common.exporting") : t("business.bookings.exportCsv")}
        </Button>
      </div>
    </div>
  );
}

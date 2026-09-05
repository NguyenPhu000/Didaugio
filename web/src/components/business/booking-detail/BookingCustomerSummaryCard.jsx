import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { formatDate } from "@/components/business/dashboardWidgetHelpers";
import { formatMoney } from "@/utils/formatters";
import { cn } from "@/lib/utils";

export const InfoItem = ({
  label,
  value,
  subValue,
  highlight = false,
  isDanger = false,
  isSuccess = false,
}) => {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-border/50 last:border-0 text-xs">
      <span className="text-slate-500 dark:text-muted-foreground font-medium">
        {label}
      </span>
      <div className="text-right">
        <span
          className={cn(
            "font-bold",
            highlight && "text-base sm:text-lg font-black text-slate-950 dark:text-white",
            isDanger && "text-rose-600 dark:text-rose-400 font-bold",
            isSuccess && "text-emerald-600 dark:text-emerald-400 font-bold",
            !highlight && !isDanger && !isSuccess && "text-slate-900 dark:text-foreground"
          )}
        >
          {value}
        </span>
        {subValue && <p className="text-[11px] text-slate-400 mt-0.5">{subValue}</p>}
      </div>
    </div>
  );
};

export const BookingCustomerSummaryCard = memo(
  ({ booking, timeOfDay, placeName }) => {
    const { t } = useTranslation();
    const paymentStatus = booking.payment?.status || booking.paymentStatus || "unpaid";

    return (
      <div className="space-y-6">
        {/* Card 1: Khách Hàng & Liên Hệ */}
        <div className="p-6 sm:p-7 rounded-[32px] bg-white dark:bg-card border border-slate-200/80 dark:border-border/80 shadow-xs space-y-4">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              {t("business.bookingDetail.customerInfo")}
            </h3>
            <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">
              Hồ sơ thông tin người đại diện đặt dịch vụ
            </p>
          </div>

          <div className="space-y-1 pt-1">
            <InfoItem
              label={t("business.bookingDetail.customerName")}
              value={booking.user?.fullName || booking.guestName}
            />
            <InfoItem
              label={t("business.bookingDetail.customerEmail")}
              value={booking.user?.email || booking.guestEmail}
            />
            <InfoItem
              label={t("business.bookingDetail.customerPhone")}
              value={booking.user?.phone || booking.guestPhone}
            />
            {booking.partySize && (
              <InfoItem
                label={t("business.bookings.guests")}
                value={`${booking.partySize} người`}
              />
            )}
          </div>
        </div>

        {/* Card 2: Dịch Vụ & Lịch Trình */}
        <div className="p-6 sm:p-7 rounded-[32px] bg-white dark:bg-card border border-slate-200/80 dark:border-border/80 shadow-xs space-y-4">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              {t("business.bookingDetail.bookingDetails")}
            </h3>
            <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">
              Chi tiết dịch vụ, địa điểm và khung giờ đón tiếp
            </p>
          </div>

          <div className="space-y-1 pt-1">
            <InfoItem
              label={t("business.bookingDetail.service")}
              value={booking.service?.name}
            />
            <InfoItem
              label={t("business.bookingDetail.place")}
              value={placeName || "—"}
              highlight={!!placeName}
            />
            <InfoItem
              label={t("business.bookingDetail.usageDate")}
              value={formatDate(booking.useDate || booking.bookingDate)}
              subValue={
                booking.useTime
                  ? `${timeOfDay?.fullLabel || "Khung giờ"}: ${booking.useTime}`
                  : null
              }
            />
            {timeOfDay && (
              <InfoItem label="Khung giờ đón tiếp" value={timeOfDay.fullLabel} />
            )}
            <InfoItem
              label={t("business.bookingDetail.quantity")}
              value={`${booking.quantity || 1} suất`}
            />
            {booking.note && (
              <InfoItem
                label={t("business.bookingDetail.notes")}
                value={booking.note}
              />
            )}
          </div>
        </div>

        {/* Card 3: Chi Tiết Tài Chính & Thanh Toán */}
        <div className="p-6 sm:p-7 rounded-[32px] bg-white dark:bg-card border border-slate-200/80 dark:border-border/80 shadow-xs space-y-4">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Chi Tiết Tài Chính & Thanh Toán
            </h3>
            <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">
              Biểu phí, giảm giá và doanh thu thực nhận
            </p>
          </div>

          <div className="space-y-1 pt-1">
            <InfoItem
              label={t("business.bookingDetail.originalPrice")}
              value={formatMoney(booking.originalPrice)}
            />
            {booking.discountAmount > 0 && (
              <InfoItem
                label={t("business.bookingDetail.discount")}
                value={`-${formatMoney(booking.discountAmount)}`}
                isSuccess
              />
            )}
            <InfoItem
              label={t("business.bookingDetail.finalAmount")}
              value={formatMoney(booking.finalPrice)}
              highlight
            />
            {booking.commissionAmount > 0 && (
              <InfoItem
                label={t("business.bookingDetail.systemCommission")}
                value={`-${formatMoney(booking.commissionAmount)}`}
                isDanger
              />
            )}
            <InfoItem
              label="Trạng thái thanh toán"
              value={
                paymentStatus === "paid"
                  ? "Đã thanh toán"
                  : paymentStatus.includes("refund")
                  ? "Đã hoàn tiền"
                  : "Chưa thanh toán"
              }
              isSuccess={paymentStatus === "paid"}
              isDanger={paymentStatus.includes("refund")}
            />
            {booking.cancelReason && (
              <InfoItem
                label={t("business.bookingDetail.cancelReasonLabel")}
                value={booking.cancelReason}
                isDanger
              />
            )}
          </div>
        </div>
      </div>
    );
  }
);

BookingCustomerSummaryCard.displayName = "BookingCustomerSummaryCard";
export default BookingCustomerSummaryCard;

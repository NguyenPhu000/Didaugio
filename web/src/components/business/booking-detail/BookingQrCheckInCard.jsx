import React, { memo } from "react";
import { formatDateTime } from "@/components/business/dashboardWidgetHelpers";

export const BookingQrCheckInCard = memo(({ booking, qrCodeUrl }) => {
  return (
    <div className="space-y-6">
      {/* QR Code Verification Bento Card */}
      <div className="p-6 sm:p-7 rounded-[32px] bg-white dark:bg-card border border-slate-200/80 dark:border-border/80 shadow-xs space-y-4 text-center">
        <div>
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
            Mã Check-in Tức Thì
          </h3>
          <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">
            Quét mã để xác thực vé khi khách đến quầy
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-muted/30 border border-slate-100 dark:border-border/60 flex items-center justify-center min-h-[180px]">
          {qrCodeUrl ? (
            <img
              src={qrCodeUrl}
              alt="Booking QR Code"
              className="w-40 h-40 object-contain rounded-xl"
            />
          ) : (
            <div className="text-xs text-slate-400 font-mono">
              Mã QR: #{booking.bookingCode}
            </div>
          )}
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-muted/40 text-xs">
          <span className="text-slate-400">Mã xác thực: </span>
          <span className="font-mono font-bold text-slate-900 dark:text-white">
            #{booking.id}
          </span>
        </div>
      </div>

      {/* Vòng Đời Đơn Hàng (Lifecycle Timeline) */}
      <div className="p-6 sm:p-7 rounded-[32px] bg-white dark:bg-card border border-slate-200/80 dark:border-border/80 shadow-xs space-y-4">
        <div>
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
            Tiến Trình Đơn Hàng
          </h3>
          <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">
            Nhật ký các mốc xử lý của giao dịch
          </p>
        </div>

        <div className="space-y-3.5 pt-1 text-xs">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
            <div>
              <p className="font-bold text-slate-900 dark:text-white">Khách hàng đặt chỗ</p>
              <p className="text-[11px] text-slate-400">{formatDateTime(booking.createdAt)}</p>
            </div>
          </div>

          {booking.confirmedAt && (
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Doanh nghiệp xác nhận</p>
                <p className="text-[11px] text-slate-400">{formatDateTime(booking.confirmedAt)}</p>
              </div>
            </div>
          )}

          {booking.completedAt && (
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Hoàn tất phục vụ</p>
                <p className="text-[11px] text-slate-400">{formatDateTime(booking.completedAt)}</p>
              </div>
            </div>
          )}

          {booking.cancelledAt && (
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
              <div>
                <p className="font-bold text-rose-600">Đã hủy đơn</p>
                <p className="text-[11px] text-slate-400">{formatDateTime(booking.cancelledAt)}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

BookingQrCheckInCard.displayName = "BookingQrCheckInCard";
export default BookingQrCheckInCard;

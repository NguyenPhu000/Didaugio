import React, { useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/animate-ui/primitives/radix/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/utils/formatters";
import {
  formatDate,
  getGatewayBadge,
  buildTimeline,
} from "./refundConstants";

export const PaymentDetailDrawer = ({ open, onOpenChange, payment }) => {
  const timeline = useMemo(() => buildTimeline(payment), [payment]);

  if (!open || !payment?.id) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="z-[60] bg-black/40"
        style={{ width: "min(100vw, 500px)" }}
      >
        <div className="flex h-full flex-col bg-background shadow-2xl">
          <SheetHeader className="border-b px-6 py-5">
            <SheetTitle className="text-base font-extrabold text-slate-900 dark:text-white">
              Chi tiết giao dịch
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Theo dõi thông tin booking, thanh toán và lịch sử xử lý hoàn tiền.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
            {/* Booking info */}
            <Card className="rounded-[24px]">
              <CardHeader>
                <CardTitle className="text-sm font-extrabold">Thông tin booking</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 text-xs">
                <div>
                  <div className="text-muted-foreground">Mã booking</div>
                  <div className="font-mono font-semibold text-sm">
                    #{payment?.booking?.bookingCode || "-"}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Khách hàng</div>
                  <div className="font-medium">
                    {payment?.booking?.user?.profile?.fullName ||
                      payment?.booking?.guestName ||
                      "-"}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Dịch vụ</div>
                  <div className="font-medium">
                    {payment?.booking?.service?.name || "-"}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Doanh nghiệp</div>
                  <div className="font-medium">
                    {payment?.booking?.service?.place?.business?.businessName ||
                      payment?.booking?.service?.place?.business?.name ||
                      "-"}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Ngày sử dụng</div>
                  <div>
                    {formatDate(
                      payment?.booking?.bookingDate ||
                        payment?.booking?.useDate,
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment info */}
            <Card className="rounded-[24px]">
              <CardHeader>
                <CardTitle className="text-sm font-extrabold">
                  Thông tin thanh toán
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Phương thức</span>
                  <Badge
                    variant="outline"
                    className={getGatewayBadge(payment?.paymentMethod).color}
                  >
                    {getGatewayBadge(payment?.paymentMethod).label}
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Số tiền</span>
                  <span className="font-semibold text-sm">
                    {formatMoney(payment?.amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Đã hoàn</span>
                  <span className="font-semibold text-blue-600 text-sm">
                    {formatMoney(payment?.refundAmount)}
                  </span>
                </div>
                <div>
                  <div className="text-muted-foreground">Mã giao dịch</div>
                  <div className="font-mono text-xs">
                    {payment?.transactionRef || payment?.transactionId || "-"}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="rounded-[24px]">
              <CardHeader>
                <CardTitle className="text-sm font-extrabold">Dòng thời gian</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timeline.map((item, index) => (
                    <div key={item.key} className="relative flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={cn("h-3 w-3 rounded-full mt-1.5", item.tone)}
                        />
                        {index < timeline.length - 1 && (
                          <div className="h-full w-px bg-border my-1" />
                        )}
                      </div>
                      <div className="space-y-1 pb-2">
                        <p className="text-xs font-bold text-foreground">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatDate(item.date)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PaymentDetailDrawer;

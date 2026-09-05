import React, { memo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Search, Eye, Wallet } from "lucide-react";
import { formatMoney } from "@/utils/formatters";
import {
  formatDate,
  getGatewayBadge,
  getPaymentStatus,
  STATUS_CONFIG,
} from "./refundConstants";

export const RefundTableSection = memo(
  ({
    activeTab,
    setActiveTab,
    searchInput,
    setSearchInput,
    gateway,
    setGateway,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    loading,
    payments,
    onOpenActionDialog,
    onOpenDrawer,
  }) => {
    const renderTable = (isPendingTab) => {
      if (loading) {
        return (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        );
      }

      if (payments.length === 0) {
        return (
          <div className="flex flex-col items-center gap-3 py-14 text-center">
            <Wallet className="h-10 w-10 text-muted-foreground" />
            <div>
              <div className="font-bold text-sm">Không có dữ liệu phù hợp</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {isPendingTab
                  ? "Hiện không có giao dịch nào đang chờ xử lý hoàn tiền."
                  : "Chưa có giao dịch nào trong nhật ký đối soát."}
              </div>
            </div>
          </div>
        );
      }

      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã đơn</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Doanh nghiệp</TableHead>
              <TableHead>Số tiền</TableHead>
              <TableHead>Cổng</TableHead>
              <TableHead>Ngày hủy</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => {
              const gatewayBadge = getGatewayBadge(payment.paymentMethod);
              const derivedStatus = getPaymentStatus(payment);
              const statusConfig =
                STATUS_CONFIG[derivedStatus] || STATUS_CONFIG.paid;

              return (
                <TableRow key={payment.id}>
                  <TableCell>
                    <button
                      type="button"
                      className="text-left cursor-pointer"
                      onClick={() => onOpenDrawer(payment)}
                    >
                      <div className="font-mono font-bold text-primary text-xs">
                        #{payment.booking?.bookingCode || "-"}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {payment.transactionRef ||
                          payment.transactionId ||
                          "Không có mã GD"}
                      </div>
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-xs">
                      {payment.booking?.user?.profile?.fullName ||
                        payment.booking?.guestName ||
                        "-"}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {payment.booking?.user?.profile?.phone ||
                        payment.booking?.user?.email ||
                        "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-xs">
                      {payment.booking?.service?.place?.business?.businessName ||
                        payment.booking?.service?.place?.business?.name ||
                        "-"}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {payment.booking?.service?.place?.name || "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-black text-xs">
                      {formatMoney(payment.amount)}
                    </div>
                    {payment.refundAmount ? (
                      <div className="text-[10px] text-blue-600 font-bold">
                        Đã hoàn: {formatMoney(payment.refundAmount)}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] rounded-lg ${gatewayBadge.color}`}
                    >
                      {gatewayBadge.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {formatDate(
                      payment.cancelledAt ||
                        payment.updatedAt ||
                        payment.createdAt
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] rounded-lg ${statusConfig.className}`}
                    >
                      {statusConfig.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {isPendingTab ? (
                      <Button
                        size="sm"
                        onClick={() => onOpenActionDialog(payment, "approve")}
                        className="rounded-xl text-xs font-bold bg-slate-950 text-white dark:bg-primary dark:text-primary-foreground h-8"
                      >
                        Xử lý
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenDrawer(payment)}
                        className="rounded-xl text-xs font-bold h-8"
                      >
                        <Eye className="mr-1 h-3.5 w-3.5" />
                        Xem
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      );
    };

    return (
      <Card className="rounded-[28px]">
        <CardHeader className="gap-4">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="rounded-2xl">
              <TabsTrigger value="pending" className="rounded-xl font-bold text-xs">
                Yêu cầu chờ xử lý
              </TabsTrigger>
              <TabsTrigger value="history" className="rounded-xl font-bold text-xs">
                Nhật ký đối soát
              </TabsTrigger>
            </TabsList>

            {/* Filters bar */}
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <div className="relative xl:col-span-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Tìm theo mã đơn, khách hàng, doanh nghiệp..."
                  className="pl-9 rounded-2xl text-xs h-9"
                />
              </div>

              <Select value={gateway} onValueChange={setGateway}>
                <SelectTrigger className="rounded-2xl text-xs h-9">
                  <SelectValue placeholder="Cổng thanh toán" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="SEPAY">SePay</SelectItem>
                  <SelectItem value="VNPAY">VNPAY</SelectItem>
                  <SelectItem value="MOMO">MOMO</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Từ ngày"
                className="rounded-2xl text-xs h-9"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="Đến ngày"
                className="rounded-2xl text-xs h-9"
              />
            </div>

            {/* Tab contents */}
            <TabsContent value="pending">
              <CardContent className="px-0 pt-4">
                {renderTable(true)}
              </CardContent>
            </TabsContent>

            <TabsContent value="history">
              <CardContent className="px-0 pt-4">
                {renderTable(false)}
              </CardContent>
            </TabsContent>
          </Tabs>
        </CardHeader>
      </Card>
    );
  }
);

RefundTableSection.displayName = "RefundTableSection";
export default RefundTableSection;

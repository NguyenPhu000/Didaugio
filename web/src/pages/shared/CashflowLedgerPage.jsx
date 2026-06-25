import { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Clock,
  Download,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { exportToCsv, slugifyFilename } from "@/utils/csvExport";

const formatVND = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const TYPE_CONFIG = {
  money_in: {
    label: "Tiền vào",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: ArrowDownLeft,
  },
  refund: {
    label: "Hoàn tiền",
    className: "bg-rose-50 text-rose-700 border-rose-200",
    icon: ArrowUpRight,
  },
  payout: {
    label: "Rút tiền",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    icon: Banknote,
  },
  ledger: {
    label: "Ledger",
    className: "bg-zinc-50 text-zinc-700 border-zinc-200",
    icon: Clock,
  },
};

function StatCard({ title, value, icon, tone = "default", subtitle }) {
  const IconComponent = icon;
  const toneMap = {
    in: "bg-emerald-50 text-emerald-600",
    out: "bg-rose-50 text-rose-600",
    pending: "bg-amber-50 text-amber-600",
    default: "bg-zinc-100 text-zinc-600",
  };

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <p className="truncate text-2xl font-bold tracking-tight">{value}</p>
            {subtitle ? (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          <div className={cn("rounded-xl p-3", toneMap[tone] || toneMap.default)}>
            <IconComponent className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CashflowLedgerPage({
  title,
  description,
  useSummary,
  useRows,
  exportFilename = "cashflow",
}) {
  const [filters, setFilters] = useState({
    type: "all",
    gateway: "all",
    startDate: "",
    endDate: "",
    page: 1,
    limit: 20,
  });

  const { data: summaryRes, isLoading: summaryLoading, refetch: refetchSummary } =
    useSummary(filters);
  const { data: rowsRes, isLoading: rowsLoading, refetch: refetchRows } =
    useRows(filters);

  const summary = summaryRes?.data?.data || summaryRes?.data || {};
  const rows = rowsRes?.data?.data || [];
  const pagination = rowsRes?.data?.pagination || {
    page: 1,
    totalPages: 1,
    total: 0,
  };

  const statCards = useMemo(
    () => [
      {
        title: "Tổng tiền vào",
        value: formatVND(summary.totalIn),
        icon: ArrowDownLeft,
        tone: "in",
        subtitle: `${summary.counts?.paidPayments || 0} giao dịch`,
      },
      {
        title: "Hoàn tiền",
        value: formatVND(summary.totalRefunded),
        icon: ArrowUpRight,
        tone: "out",
        subtitle: `${summary.counts?.refunds || 0} giao dịch`,
      },
      {
        title: "Đã rút/chuyển",
        value: formatVND(summary.totalPayouts),
        icon: Banknote,
        tone: "out",
        subtitle: `${summary.counts?.transferredPayouts || 0} payout`,
      },
      {
        title: "Số dư ví",
        value: formatVND(summary.walletBalance),
        icon: Wallet,
        tone: "default",
        subtitle: `Đang giữ: ${formatVND(summary.frozenBalance)}`,
      },
    ],
    [
      summary.totalIn,
      summary.totalRefunded,
      summary.totalPayouts,
      summary.walletBalance,
      summary.frozenBalance,
      summary.counts?.paidPayments,
      summary.counts?.refunds,
      summary.counts?.transferredPayouts,
    ],
  );

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const refresh = () => {
    refetchSummary();
    refetchRows();
  };

  const handleExport = () => {
    exportToCsv({
      filename: slugifyFilename(exportFilename),
      columns: [
        { key: "occurredAt", label: "Thời gian" },
        { key: "type", label: "Loại" },
        { key: "amount", label: "Số tiền" },
        { key: "status", label: "Trạng thái" },
        { key: "gateway", label: "Kênh" },
        { key: "transactionRef", label: "Mã đối soát" },
        { key: "description", label: "Mô tả" },
      ],
      data: rows.map((row) => ({
        ...row,
        occurredAt: formatDateTime(row.occurredAt),
      })),
    });
  };

  let rowsContent;
  if (rowsLoading) {
    rowsContent = (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-14 rounded-lg" />
        ))}
      </div>
    );
  } else if (rows.length === 0) {
    rowsContent = (
      <div className="flex flex-col items-center gap-2 py-14 text-center">
        <Wallet className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Chưa có dòng tiền phù hợp với bộ lọc.
        </p>
      </div>
    );
  } else {
    rowsContent = (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Thời gian</TableHead>
            <TableHead>Loại</TableHead>
            <TableHead>Mã đối soát</TableHead>
            <TableHead>Doanh nghiệp / booking</TableHead>
            <TableHead className="text-right">Số tiền</TableHead>
            <TableHead>Trạng thái</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const config = TYPE_CONFIG[row.type] || TYPE_CONFIG.ledger;
            const TypeIcon = config.icon;
            return (
              <TableRow key={row.id}>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDateTime(row.occurredAt)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("gap-1", config.className)}>
                    <TypeIcon className="h-3 w-3" />
                    {config.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="font-mono text-xs">
                    {row.transactionRef || row.transactionId || "-"}
                  </div>
                  <div className="mt-1 max-w-[260px] truncate text-xs text-muted-foreground">
                    {row.description}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm font-medium">
                    {row.business?.businessName || "-"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {row.booking?.bookingCode
                      ? `#${row.booking.bookingCode}`
                      : row.sourceType}
                  </div>
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-mono font-semibold",
                    row.direction === "out"
                      ? "text-rose-600"
                      : "text-emerald-600",
                  )}
                >
                  {row.direction === "out" ? "-" : "+"}
                  {formatVND(row.amount)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {row.status || "posted"}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  }

  return (
    <div className="space-y-5 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refresh} className="gap-1.5">
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </Button>
          <Button variant="outline" onClick={handleExport} className="gap-1.5">
            <Download className="h-4 w-4" />
            CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-xl" />
            ))
          : statCards.map((card) => <StatCard key={card.title} {...card} />)}
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <Select
              value={filters.type}
              onValueChange={(value) => setFilter("type", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Loại dòng tiền" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="money_in">Tiền vào</SelectItem>
                <SelectItem value="refund">Hoàn tiền</SelectItem>
                <SelectItem value="payout">Rút tiền</SelectItem>
                <SelectItem value="ledger">Ledger</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.gateway}
              onValueChange={(value) => setFilter("gateway", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Kênh" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả kênh</SelectItem>
                <SelectItem value="SEPAY">SePay</SelectItem>
                <SelectItem value="VNPAY">VNPay</SelectItem>
                <SelectItem value="MOMO">MoMo</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={filters.startDate}
              onChange={(event) => setFilter("startDate", event.target.value)}
            />
            <Input
              type="date"
              value={filters.endDate}
              onChange={(event) => setFilter("endDate", event.target.value)}
            />
          </div>

          {rowsContent}

          {pagination.totalPages > 1 ? (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                Trang {pagination.page} / {pagination.totalPages} ({pagination.total})
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filters.page <= 1}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filters.page >= pagination.totalPages}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                >
                  Sau
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

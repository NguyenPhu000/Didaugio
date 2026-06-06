import { useState, useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconClock,
  IconX,
  IconStarFilled,
  IconLayoutColumns,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "react-router-dom";
import { ADMIN_ROUTES } from "@/constants/routes";
import { useTranslation } from "react-i18next";

export default function RecentPlacesTable({ places }) {
  const { t } = useTranslation();

  const STATUS_MAP = {
    approved: {
      label: t("admin.recentTable.approved"),
      icon: IconCircleCheckFilled,
      color: "fill-green-500 dark:fill-green-400",
      badgeClass: "text-green-700 bg-green-50 border-green-200",
    },
    pending: {
      label: t("admin.recentTable.pending"),
      icon: IconClock,
      color: "text-yellow-500",
      badgeClass: "text-yellow-700 bg-yellow-50 border-yellow-200",
    },
    rejected: {
      label: t("admin.recentTable.rejected"),
      icon: IconX,
      color: "text-red-500",
      badgeClass: "text-red-700 bg-red-50 border-red-200",
    },
  };

  const columns = [
    {
      accessorKey: "name",
      header: t("admin.recentTable.placeName"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Link
            to={`${ADMIN_ROUTES.PLACES}/${row.original.id}`}
            className="font-medium text-sm hover:text-primary transition-colors line-clamp-1 max-w-[200px]"
          >
            {row.original.name}
          </Link>
          {row.original.isFeatured && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              <IconStarFilled className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
              {t("admin.recentTable.hot")}
            </Badge>
          )}
        </div>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "status",
      header: t("admin.recentTable.status"),
      cell: ({ row }) => {
        const status = STATUS_MAP[row.original.status] || STATUS_MAP.pending;
        const StatusIcon = status.icon;
        return (
          <Badge variant="outline" className={`px-1.5 ${status.badgeClass}`}>
            <StatusIcon className={`h-3.5 w-3.5 ${status.color}`} />
            {status.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "averageRating",
      header: t("admin.recentTable.rating"),
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <IconStarFilled className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
          <span className="font-mono text-xs">
            {row.original.averageRating
              ? Number(row.original.averageRating).toFixed(1)
              : "—"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: t("admin.recentTable.createdDate"),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">
          {row.original.createdAt
            ? new Date(row.original.createdAt).toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })
            : "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Link to={`${ADMIN_ROUTES.PLACES}/${row.original.id}`}>
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            {t("admin.recentTable.viewDetail")}
          </Button>
        </Link>
      ),
    },
  ];

  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [globalFilter, setGlobalFilter] = useState("");

  const data = useMemo(() => {
    return [...places].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }, [places]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const COLUMN_NAME_MAP = {
    name: t("admin.recentTable.columnName"),
    status: t("admin.recentTable.columnStatus"),
    averageRating: t("admin.recentTable.columnRating"),
    createdAt: t("admin.recentTable.columnCreatedDate"),
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between py-4">
        <Input
          placeholder={t("admin.recentTable.searchPlaceholder")}
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns />
                <span className="hidden lg:inline">{t("admin.recentTable.columns")}</span>
                <IconChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {table
                .getAllColumns()
                .filter((c) => typeof c.accessorFn !== "undefined" && c.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {COLUMN_NAME_MAP[column.id] || column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Link to={ADMIN_ROUTES.PLACES}>
            <Button variant="outline" size="sm">
              {t("admin.recentTable.viewAll")}
            </Button>
          </Link>
        </div>
      </div>
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {t("admin.recentTable.noData")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between px-4 py-4">
        <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
          {t("admin.recentTable.placeCount", { count: table.getFilteredRowModel().rows.length })}
        </div>
        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="rpp" className="text-sm font-medium">
              {t("admin.recentTable.show")}
            </Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(v) => table.setPageSize(Number(v))}
            >
              <SelectTrigger size="sm" className="w-20" id="rpp">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[5, 10, 20, 50].map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-fit items-center justify-center text-sm font-medium">
            {t("admin.recentTable.pageInfo", { current: table.getState().pagination.pageIndex + 1, total: table.getPageCount() })}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">{t("admin.recentTable.firstPage")}</span>
              <IconChevronsLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">{t("admin.recentTable.prevPage")}</span>
              <IconChevronLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">{t("admin.recentTable.nextPage")}</span>
              <IconChevronRight />
            </Button>
            <Button
              variant="outline"
              className="hidden size-8 lg:flex"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">{t("admin.recentTable.lastPage")}</span>
              <IconChevronsRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

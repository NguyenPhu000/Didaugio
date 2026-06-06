import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { staffApi } from "@/apis/staffApi";
import { staffInvitationApi } from "@/apis/staffInvitationApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  IconPlus,
  IconDotsVertical,
  IconEdit,
  IconLock,
  IconLockOpen,
  IconKey,
  IconUsers,
  IconUserCheck,
  IconUserOff,
  IconSearch,
  IconLink,
  IconCopy,
  IconCheck,
  IconMail,
  IconClock,
  IconX,
  IconShield,
} from "@tabler/icons-react";
import { toast } from "sonner";

// Tab component
function Tabs({ tabs, activeTab, onTabChange }) {
  return (
    <div className="flex gap-1 rounded-lg bg-muted p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {tab.icon}
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={`ml-1 rounded-full px-2 py-0.5 text-xs ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted-foreground/20"
              }`}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export default function StaffManagementPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("staff");

  // ─── Staff state ───────────────────────────────────────────────────────────
  const [staff, setStaff] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // ─── Invitation state ──────────────────────────────────────────────────────
  const [invitations, setInvitations] = useState([]);
  const [invPagination, setInvPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [invLoading, setInvLoading] = useState(true);
  const [invStatusFilter, setInvStatusFilter] = useState("all");

  // ─── Business roles ────────────────────────────────────────────────────────
  const [businessRoles, setBusinessRoles] = useState([]);

  // ─── Dialogs ───────────────────────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteSuccessOpen, setInviteSuccessOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [resetPwOpen, setResetPwOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  // ─── Form state ────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    roleId: "",
  });
  const [editForm, setEditForm] = useState({ fullName: "", phone: "" });
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ─── Invite form state ─────────────────────────────────────────────────────
  const [inviteForm, setInviteForm] = useState({ email: "", roleId: "" });
  const [inviteResult, setInviteResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // ─── Fetch data ────────────────────────────────────────────────────────────
  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      const res = await staffApi.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      const data = res.data;
      if (data) {
        setStaff(data.staff || []);
        setPagination((p) => ({ ...p, ...(data.pagination || {}) }));
      }
    } catch (err) {
      console.error("Failed to load staff:", err);
      toast.error("Không thể tải danh sách nhân viên");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter]);

  const fetchInvitations = useCallback(async () => {
    try {
      setInvLoading(true);
      const res = await staffInvitationApi.getAll({
        page: invPagination.page,
        limit: invPagination.limit,
        status: invStatusFilter !== "all" ? invStatusFilter : undefined,
      });
      const data = res.data;
      if (data) {
        setInvitations(data.invitations || []);
        setInvPagination((p) => ({ ...p, ...(data.pagination || {}) }));
      }
    } catch (err) {
      console.error("Failed to load invitations:", err);
    } finally {
      setInvLoading(false);
    }
  }, [invPagination.page, invPagination.limit, invStatusFilter]);

  const fetchBusinessRoles = async () => {
    try {
      const res = await staffInvitationApi.getRoles();
      const data = res.data;
      if (data) {
        setBusinessRoles(data);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  useEffect(() => {
    if (activeTab === "invitations") {
      fetchInvitations();
    }
  }, [activeTab, fetchInvitations]);

  useEffect(() => {
    fetchBusinessRoles();
  }, []);

  // ─── Staff handlers ────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!form.email || !form.password) {
      toast.error("Email và mật khẩu là bắt buộc");
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        email: form.email,
        password: form.password,
        fullName: form.fullName || undefined,
        phone: form.phone || undefined,
        roleId: form.roleId ? parseInt(form.roleId) : undefined,
      };
      await staffApi.create(payload);
      toast.success("Tạo tài khoản nhân viên thành công");
      setCreateOpen(false);
      setForm({ email: "", password: "", fullName: "", phone: "", roleId: "" });
      fetchStaff();
    } catch (err) {
      toast.error(err.message || "Lỗi tạo nhân viên");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedStaff) return;
    try {
      setSubmitting(true);
      await staffApi.update(selectedStaff.id, editForm);
      toast.success("Cập nhật nhân viên thành công");
      setEditOpen(false);
      fetchStaff();
    } catch (err) {
      toast.error(err.message || "Lỗi cập nhật");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedStaff || !newPassword) return;
    try {
      setSubmitting(true);
      await staffApi.resetPassword(selectedStaff.id, newPassword);
      toast.success("Đặt lại mật khẩu thành công");
      setResetPwOpen(false);
      setNewPassword("");
    } catch (err) {
      toast.error(err.message || "Lỗi đặt lại mật khẩu");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (staffMember) => {
    const isActive = staffMember.status === "active";
    try {
      if (isActive) {
        await staffApi.deactivate(staffMember.id);
        toast.success("Đã khóa tài khoản nhân viên");
      } else {
        await staffApi.activate(staffMember.id);
        toast.success("Đã mở khóa tài khoản nhân viên");
      }
      fetchStaff();
    } catch (err) {
      toast.error(err.message || "Lỗi thay đổi trạng thái");
    }
  };

  const openEdit = (s) => {
    setSelectedStaff(s);
    setEditForm({
      fullName: s.profile?.fullName || "",
      phone: s.profile?.phone || "",
    });
    setEditOpen(true);
  };

  const openResetPw = (s) => {
    setSelectedStaff(s);
    setNewPassword("");
    setResetPwOpen(true);
  };

  // ─── Invitation handlers ───────────────────────────────────────────────────
  const handleCreateInvite = async () => {
    try {
      setSubmitting(true);
      const res = await staffInvitationApi.create({
        email: inviteForm.email || undefined,
        roleId: inviteForm.roleId ? parseInt(inviteForm.roleId) : undefined,
      });
      setInviteResult(res.data);
      setInviteOpen(false);
      setInviteSuccessOpen(true);
      setInviteForm({ email: "", roleId: "" });
      fetchInvitations();
    } catch (err) {
      toast.error(err.message || "Lỗi tạo lời mời");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevokeInvite = async (inv) => {
    try {
      await staffInvitationApi.revoke(inv.id);
      toast.success("Đã thu hồi lời mời");
      fetchInvitations();
    } catch (err) {
      toast.error(err.message || "Lỗi thu hồi lời mời");
    }
  };

  const handleCopyLink = () => {
    if (!inviteResult?.token) return;
    const link = `${window.location.origin}/invite?token=${inviteResult.token}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      toast.success("Đã sao chép link mời");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const getInviteLink = (token) =>
    `${window.location.origin}/invite?token=${token}`;

  const activeCount = staff.filter((s) => s.status === "active").length;
  const inactiveCount = staff.filter((s) => s.status !== "active").length;
  const pendingCount = invitations.filter((i) => i.status === "pending").length;

  const tabs = [
    {
      id: "staff",
      label: "Nhân viên",
      icon: <IconUsers className="h-4 w-4" />,
      count: staff.length,
    },
    {
      id: "invitations",
      label: "Lời mời",
      icon: <IconMail className="h-4 w-4" />,
      count: pendingCount,
    },
  ];

  const invStatusBadge = (status) => {
    const map = {
      pending: {
        label: "Chờ xử lý",
        className: "text-yellow-700 bg-yellow-50 border-yellow-200",
      },
      accepted: {
        label: "Đã chấp nhận",
        className: "text-green-700 bg-green-50 border-green-200",
      },
      expired: {
        label: "Đã hết hạn",
        className: "text-gray-700 bg-gray-50 border-gray-200",
      },
      revoked: {
        label: "Đã thu hồi",
        className: "text-red-700 bg-red-50 border-red-200",
      },
    };
    const cfg = map[status] || map.pending;
    return (
      <Badge variant="outline" className={cfg.className}>
        {cfg.label}
      </Badge>
    );
  };

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Quản lý nhân viên
          </h2>
          <p className="text-muted-foreground">
            Tạo và quản lý tài khoản nhân viên cho doanh nghiệp
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setInviteOpen(true)}>
            <IconMail className="mr-2 h-4 w-4" />
            Mời nhân viên
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <IconPlus className="mr-2 h-4 w-4" />
            Thêm nhân viên
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* ─── Staff Tab ──────────────────────────────────────────────────────── */}
      {activeTab === "staff" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Tổng nhân viên
                </CardTitle>
                <IconUsers className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pagination.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Đang hoạt động
                </CardTitle>
                <IconUserCheck className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {activeCount}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Đã khóa</CardTitle>
                <IconUserOff className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {inactiveCount}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm nhân viên..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="inactive">Đã khóa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Staff Table */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nhân viên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Số điện thoại</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : staff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <IconUsers className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          Chưa có nhân viên nào
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setInviteOpen(true)}
                          >
                            <IconMail className="mr-2 h-3 w-3" />
                            Mời nhân viên
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCreateOpen(true)}
                          >
                            <IconPlus className="mr-2 h-3 w-3" />
                            Thêm trực tiếp
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  staff.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                            {(s.profile?.fullName || s.email)[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">
                              {s.profile?.fullName || "—"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              @{s.username}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{s.email}</TableCell>
                      <TableCell className="text-sm">
                        {s.profile?.phone || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            s.status === "active"
                              ? "text-green-700 bg-green-50 border-green-200"
                              : "text-red-700 bg-red-50 border-red-200"
                          }
                        >
                          {s.status === "active" ? "Hoạt động" : "Đã khóa"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(s.createdAt).toLocaleDateString("vi-VN")}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <IconDotsVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(s)}>
                              <IconEdit className="mr-2 h-4 w-4" />
                              Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openResetPw(s)}>
                              <IconKey className="mr-2 h-4 w-4" />
                              Đặt lại mật khẩu
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleStatus(s)}
                            >
                              {s.status === "active" ? (
                                <>
                                  <IconLock className="mr-2 h-4 w-4" />
                                  Khóa tài khoản
                                </>
                              ) : (
                                <>
                                  <IconLockOpen className="mr-2 h-4 w-4" />
                                  Mở khóa
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {pagination.total} nhân viên
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page - 1 }))
                  }
                >
                  Trước
                </Button>
                <span className="text-sm">
                  Trang {pagination.page} / {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page + 1 }))
                  }
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── Invitations Tab ────────────────────────────────────────────────── */}
      {activeTab === "invitations" && (
        <>
          <div className="flex items-center gap-2">
            <Select
              value={invStatusFilter}
              onValueChange={setInvStatusFilter}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="pending">Chờ xử lý</SelectItem>
                <SelectItem value="accepted">Đã chấp nhận</SelectItem>
                <SelectItem value="expired">Đã hết hạn</SelectItem>
                <SelectItem value="revoked">Đã thu hồi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Hết hạn</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : invitations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <IconMail className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          Chưa có lời mời nào
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInviteOpen(true)}
                        >
                          <IconPlus className="mr-2 h-3 w-3" />
                          Tạo lời mời mới
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  invitations.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="text-sm">
                        {inv.email || "—"}
                      </TableCell>
                      <TableCell>
                        {inv.role ? (
                          <span className="inline-flex items-center gap-1 text-sm">
                            <IconShield className="h-3 w-3 text-muted-foreground" />
                            {inv.role.name}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>{invStatusBadge(inv.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(inv.createdAt).toLocaleDateString("vi-VN")}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(inv.expiresAt).toLocaleDateString("vi-VN")}
                      </TableCell>
                      <TableCell>
                        {inv.status === "pending" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <IconDotsVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    getInviteLink(inv.token),
                                  );
                                  toast.success("Đã sao chép link mời");
                                }}
                              >
                                <IconCopy className="mr-2 h-4 w-4" />
                                Copy link
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleRevokeInvite(inv)}
                                className="text-red-600"
                              >
                                <IconX className="mr-2 h-4 w-4" />
                                Thu hồi
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* ─── Create Staff Dialog ────────────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm nhân viên mới</DialogTitle>
            <DialogDescription>
              Tạo tài khoản nhân viên cho doanh nghiệp.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="staff-email">Email *</Label>
              <Input
                id="staff-email"
                type="email"
                placeholder="nhanvien@email.com"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-password">Mật khẩu *</Label>
              <Input
                id="staff-password"
                type="password"
                placeholder="Ít nhất 6 ký tự"
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-name">Họ tên</Label>
              <Input
                id="staff-name"
                placeholder="Nguyễn Văn A"
                value={form.fullName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, fullName: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-phone">Số điện thoại</Label>
              <Input
                id="staff-phone"
                placeholder="0901234567"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-role">Vai trò</Label>
              <Select
                value={form.roleId}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, roleId: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn vai trò cho nhân viên" />
                </SelectTrigger>
                <SelectContent>
                  {businessRoles.map((role) => (
                    <SelectItem key={role.id} value={String(role.id)}>
                      <div className="flex flex-col">
                        <span>{role.name}</span>
                        {role.description && (
                          <span className="text-xs text-muted-foreground">
                            {role.description}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? "Đang tạo..." : "Tạo nhân viên"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Invite Dialog ──────────────────────────────────────────────────── */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mời nhân viên mới</DialogTitle>
            <DialogDescription>
              Tạo lời mời nhân viên. Nếu nhập email, link đăng ký sẽ được gửi tự động.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email nhân viên</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="nhanvien@email.com"
                value={inviteForm.email}
                onChange={(e) =>
                  setInviteForm((f) => ({ ...f, email: e.target.value }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Nhập email để gửi link mời trực tiếp. Nếu bỏ trống, bạn có thể copy link để gửi thủ công.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Vai trò *</Label>
              <Select
                value={inviteForm.roleId}
                onValueChange={(v) =>
                  setInviteForm((f) => ({ ...f, roleId: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn vai trò cho nhân viên" />
                </SelectTrigger>
                <SelectContent>
                  {businessRoles.map((role) => (
                    <SelectItem key={role.id} value={String(role.id)}>
                      <div className="flex flex-col">
                        <span>{role.name}</span>
                        {role.description && (
                          <span className="text-xs text-muted-foreground">
                            {role.description}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setInviteOpen(false)}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button onClick={handleCreateInvite} disabled={submitting}>
              {submitting ? "Đang tạo..." : "Tạo lời mời"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Invite Success Dialog ──────────────────────────────────────────── */}
      <Dialog open={inviteSuccessOpen} onOpenChange={setInviteSuccessOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <IconCheck className="h-5 w-5" />
              Tạo lời mời thành công
            </DialogTitle>
            <DialogDescription>
              {inviteResult?.emailSent
                ? `Email mời đã được gửi đến ${inviteResult.email}.`
                : "Gửi link bên dưới cho nhân viên để họ đăng ký tài khoản."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {inviteResult?.emailSent && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 flex items-center gap-2">
                <IconMail className="h-4 w-4 shrink-0" />
                <span>
                  Đã gửi email đến <strong>{inviteResult.email}</strong>. Nhân viên sẽ nhận được link đăng ký trong hộp thư.
                </span>
              </div>
            )}

            <div className="rounded-lg border bg-muted p-4">
              <div className="flex items-center gap-2">
                <IconLink className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Link mời:</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 break-all rounded bg-background p-2 text-xs">
                  {inviteResult?.token
                    ? getInviteLink(inviteResult.token)
                    : ""}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  {copied ? (
                    <IconCheck className="h-4 w-4 text-green-600" />
                  ) : (
                    <IconCopy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="rounded-lg border p-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <IconClock className="h-4 w-4" />
                <span>
                  Link hết hạn sau{" "}
                  <strong>7 ngày</strong>
                </span>
              </div>
              {inviteResult?.email && (
                <div className="mt-1 flex items-center gap-2 text-muted-foreground">
                  <IconMail className="h-4 w-4" />
                  <span>
                    Dành cho: <strong>{inviteResult.email}</strong>
                  </span>
                </div>
              )}
              {inviteResult?.roleName && (
                <div className="mt-1 flex items-center gap-2 text-muted-foreground">
                  <IconShield className="h-4 w-4" />
                  <span>
                    Vai trò: <strong>{inviteResult.roleName}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setInviteSuccessOpen(false);
                setInviteResult(null);
              }}
            >
              Đã hiểu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Dialog ────────────────────────────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa nhân viên</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin nhân viên {selectedStaff?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Họ tên</Label>
              <Input
                id="edit-name"
                value={editForm.fullName}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, fullName: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Số điện thoại</Label>
              <Input
                id="edit-phone"
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, phone: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button onClick={handleEdit} disabled={submitting}>
              {submitting ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Reset Password Dialog ──────────────────────────────────────────── */}
      <Dialog open={resetPwOpen} onOpenChange={setResetPwOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đặt lại mật khẩu</DialogTitle>
            <DialogDescription>
              Đặt lại mật khẩu cho nhân viên {selectedStaff?.email}. Nhân viên
              sẽ sử dụng mật khẩu mới để đăng nhập.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="new-pw">Mật khẩu mới</Label>
            <Input
              id="new-pw"
              type="password"
              placeholder="Ít nhất 6 ký tự"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResetPwOpen(false)}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button onClick={handleResetPassword} disabled={submitting}>
              {submitting ? "Đang xử lý..." : "Đặt lại mật khẩu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

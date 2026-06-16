import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { staffApi } from "@/apis/staffApi";
import { staffInvitationApi } from "@/apis/staffInvitationApi";
import { useStaffStats } from "@/hooks/queries/useStaffQueries";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Label } from "@/components/ui/Label";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  MoreVertical,
  Search,
  Mail,
  Phone,
  Key,
  Edit,
  Trash2,
  Shield,
  Clock,
  Activity,
  Link,
  Copy,
  Check,
  X,
  Send,
  UserCog,
} from "lucide-react";
import { toast } from "sonner";

const getStatusConfig = (t) => ({
  active: {
    label: t("business.staff.active"),
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  inactive: {
    label: t("business.staff.locked"),
    className: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
  pending: {
    label: t("business.staff.pending"),
    className: "bg-yellow-50 text-yellow-700 border-yellow-200",
    dot: "bg-yellow-500",
  },
});

const getInvitationStatusConfig = (t) => ({
  pending: {
    label: t("business.staff.pending"),
    className: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  accepted: {
    label: t("business.staff.accepted"),
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  expired: {
    label: t("business.staff.expired"),
    className: "bg-gray-50 text-gray-600 border-gray-200",
  },
  revoked: {
    label: t("business.staff.revoked"),
    className: "bg-red-50 text-red-700 border-red-200",
  },
});

/**
 * StatsCard — single stat card with icon and value.
 */
const StatsCard = memo(function StatsCard({ title, value, icon: Icon, color, loading: isLoading }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={cn("h-4 w-4", color || "text-muted-foreground")} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className={cn("text-2xl font-bold", color?.replace("bg-", "text-"))}>
            {value ?? 0}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

/**
 * StaffCard — card-based staff member display.
 */
const StaffCard = memo(function StaffCard({
  staffMember,
  onEdit,
  onResetPassword,
  onToggleStatus,
  onRemove,
}) {
  const { t } = useTranslation();
  const initials = (staffMember.profile?.fullName || staffMember.email || "?")
    .split(" ")
    .slice(-2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");

  const statusConfig = getStatusConfig(t);
  const statusCfg = statusConfig[staffMember.status] || statusConfig.inactive;
  const lastActive = staffMember.lastLoginAt || staffMember.updatedAt;
  const roles = staffMember.roles || (staffMember.roleName ? [staffMember.roleName] : []);

  return (
    <div className="flex items-center gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/20">
      {/* Avatar */}
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
        {initials || <Users className="h-5 w-5" />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-sm truncate">
            {staffMember.profile?.fullName || t("business.staff.notUpdated")}
          </p>
          <Badge
            variant="outline"
            className={cn("text-[10px]", statusCfg.className)}
          >
            <span className={cn("mr-1 h-1.5 w-1.5 rounded-full", statusCfg.dot)} />
            {statusCfg.label}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {staffMember.email}
        </p>
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          {staffMember.profile?.phone && (
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {staffMember.profile.phone}
            </span>
          )}
          {lastActive && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(lastActive).toLocaleDateString("vi-VN")}
            </span>
          )}
        </div>
        {roles.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {roles.map((role, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="text-[10px] px-1.5 py-0"
              >
                <Shield className="mr-1 h-2.5 w-2.5" />
                {typeof role === "string" ? role : role.name || `Role ${role.id}`}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9 md:h-8 md:w-8 shrink-0 min-h-[44px] md:min-h-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => onEdit(staffMember)}>
            <Edit className="mr-2 h-4 w-4" />
            {t("business.staff.editAction")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onResetPassword(staffMember)}>
            <Key className="mr-2 h-4 w-4" />
            {t("business.staff.resetPassword")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onToggleStatus(staffMember)}>
            {staffMember.status === "active" ? (
              <>
                <UserX className="mr-2 h-4 w-4" />
                {t("business.staff.lockAccount")}
              </>
            ) : (
              <>
                <UserCheck className="mr-2 h-4 w-4" />
                {t("business.staff.activate")}
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onRemove(staffMember)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t("business.staff.removeStaff")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
});

/**
 * StaffCardSkeleton — loading placeholder for staff cards.
 */
function StaffCardSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-lg border p-4">
      <Skeleton className="h-11 w-11 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-8 w-8" />
    </div>
  );
}

export default function StaffManagementPage() {
  const { t } = useTranslation();

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
  const [roleFilter, setRoleFilter] = useState("all");

  // ─── Stats ─────────────────────────────────────────────────────────────────
  const { data: statsData, isLoading: statsLoading } = useStaffStats();
  const stats = statsData?.data || statsData || {};

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
  const [activeTab, setActiveTab] = useState("staff");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteSuccessOpen, setInviteSuccessOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [resetPwOpen, setResetPwOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  // ─── Form state ────────────────────────────────────────────────────────────
  const [editForm, setEditForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    roleId: "",
    isActive: true,
  });
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ─── Invite form state ─────────────────────────────────────────────────────
  const [inviteForm, setInviteForm] = useState({
    email: "",
    roleId: "",
    message: "",
  });
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
        roleId: roleFilter !== "all" ? roleFilter : undefined,
      });
      const data = res.data;
      if (data) {
        setStaff(data.staff || []);
        setPagination((p) => ({ ...p, ...(data.pagination || {}) }));
      }
    } catch {
      toast.error(t("business.staff.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter, roleFilter]);

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
    } catch {
      // Silent fail for invitations
    } finally {
      setInvLoading(false);
    }
  }, [invPagination.page, invPagination.limit, invStatusFilter]);

  const fetchBusinessRoles = useCallback(async () => {
    try {
      const res = await staffInvitationApi.getRoles();
      if (res.data) setBusinessRoles(res.data);
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  useEffect(() => {
    if (activeTab === "invitations") fetchInvitations();
  }, [activeTab, fetchInvitations]);

  useEffect(() => {
    fetchBusinessRoles();
  }, [fetchBusinessRoles]);

  // ─── Derived stats ─────────────────────────────────────────────────────────
  const displayStats = useMemo(
    () => ({
      total: stats.total ?? pagination.total ?? 0,
      active: stats.active ?? staff.filter((s) => s.status === "active").length,
      pendingInvitations:
        stats.pendingInvitations ??
        invitations.filter((i) => i.status === "pending").length,
    }),
    [stats, pagination.total, staff, invitations],
  );

  // ─── Staff handlers ────────────────────────────────────────────────────────
  const handleToggleStatus = useCallback(
    async (staffMember) => {
      const isActive = staffMember.status === "active";
      try {
        if (isActive) {
          await staffApi.deactivate(staffMember.id);
          toast.success(t("business.staff.accountLocked"));
        } else {
          await staffApi.activate(staffMember.id);
          toast.success(t("business.staff.accountActivated"));
        }
        fetchStaff();
      } catch (err) {
        toast.error(err.message || t("business.staff.statusChangeError"));
      }
    },
    [fetchStaff],
  );

  const openEdit = useCallback((s) => {
    setSelectedStaff(s);
    setEditForm({
      fullName: s.profile?.fullName || "",
      phone: s.profile?.phone || "",
      email: s.email || "",
      roleId: s.roleId ? String(s.roleId) : "",
      isActive: s.status === "active",
    });
    setEditOpen(true);
  }, []);

  const openResetPw = useCallback((s) => {
    setSelectedStaff(s);
    setNewPassword("");
    setResetPwOpen(true);
  }, []);

  const openRemove = useCallback((s) => {
    setSelectedStaff(s);
    setRemoveOpen(true);
  }, []);

  const handleEdit = useCallback(async () => {
    if (!selectedStaff) return;
    try {
      setSubmitting(true);
      await staffApi.update(selectedStaff.id, {
        fullName: editForm.fullName || undefined,
        phone: editForm.phone || undefined,
        roleId: editForm.roleId ? parseInt(editForm.roleId) : undefined,
        status: editForm.isActive ? "active" : "inactive",
      });
      toast.success(t("business.staff.updateSuccess"));
      setEditOpen(false);
      fetchStaff();
    } catch (err) {
      toast.error(err.message || t("business.staff.updateError"));
    } finally {
      setSubmitting(false);
    }
  }, [selectedStaff, editForm, fetchStaff]);

  const handleResetPassword = useCallback(async () => {
    if (!selectedStaff || !newPassword) return;
    try {
      setSubmitting(true);
      await staffApi.resetPassword(selectedStaff.id, newPassword);
      toast.success(t("business.staff.resetPasswordSuccess"));
      setResetPwOpen(false);
      setNewPassword("");
    } catch (err) {
      toast.error(err.message || t("business.staff.resetPasswordError"));
    } finally {
      setSubmitting(false);
    }
  }, [selectedStaff, newPassword]);

  const handleRemove = useCallback(async () => {
    if (!selectedStaff) return;
    try {
      setSubmitting(true);
      await staffApi.remove(selectedStaff.id);
      toast.success(t("business.staff.removeSuccess"));
      setRemoveOpen(false);
      setSelectedStaff(null);
      fetchStaff();
    } catch (err) {
      toast.error(err.message || t("business.staff.removeError"));
    } finally {
      setSubmitting(false);
    }
  }, [selectedStaff, fetchStaff]);

  // ─── Invitation handlers ───────────────────────────────────────────────────
  const handleCreateInvite = useCallback(async () => {
    try {
      setSubmitting(true);
      const res = await staffInvitationApi.create({
        email: inviteForm.email || undefined,
        roleId: inviteForm.roleId ? parseInt(inviteForm.roleId) : undefined,
        message: inviteForm.message || undefined,
      });
      setInviteResult(res.data);
      setInviteOpen(false);
      setInviteSuccessOpen(true);
      setInviteForm({ email: "", roleId: "", message: "" });
      fetchInvitations();
    } catch (err) {
      toast.error(err.message || t("business.staff.inviteCreateError"));
    } finally {
      setSubmitting(false);
    }
  }, [inviteForm, fetchInvitations]);

  const handleRevokeInvite = useCallback(
    async (inv) => {
      try {
        await staffInvitationApi.revoke(inv.id);
        toast.success(t("business.staff.inviteRevoked"));
        fetchInvitations();
      } catch (err) {
        toast.error(err.message || t("business.staff.inviteRevokeError"));
      }
    },
    [fetchInvitations],
  );

  const handleCopyLink = useCallback(() => {
    if (!inviteResult?.token) return;
    const link = `${window.location.origin}/invite?token=${inviteResult.token}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      toast.success(t("business.staff.linkCopied"));
      setTimeout(() => setCopied(false), 2000);
    });
  }, [inviteResult]);

  const getInviteLink = useCallback(
    (token) => `${window.location.origin}/invite?token=${token}`,
    [],
  );

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            {t("business.staff.title")}
            {!statsLoading && (
              <Badge variant="secondary" className="text-sm">
                {displayStats.total}
              </Badge>
            )}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t("business.staff.subtitle")}
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          {t("business.staff.inviteStaff")}
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 sm:grid-cols-3">
        <StatsCard
          title={t("business.staff.totalStaff")}
          value={displayStats.total}
          icon={Users}
          color="text-blue-600"
          loading={statsLoading}
        />
        <StatsCard
          title={t("business.staff.activeStaff")}
          value={displayStats.active}
          icon={UserCheck}
          color="text-emerald-600"
          loading={statsLoading}
        />
        <StatsCard
          title={t("business.staff.pendingInvitations")}
          value={displayStats.pendingInvitations}
          icon={Mail}
          color="text-amber-600"
          loading={statsLoading}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="staff" className="gap-2">
            <Users className="h-4 w-4" />
            {t("business.staff.staffTab")}
            <Badge variant="secondary" className="ml-1 text-[10px]">
              {staff.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="invitations" className="gap-2">
            <Mail className="h-4 w-4" />
            {t("business.staff.invitationsTab")}
            {displayStats.pendingInvitations > 0 && (
              <Badge variant="secondary" className="ml-1 text-[10px]">
                {displayStats.pendingInvitations}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ─── Staff Tab ──────────────────────────────────────────────────────── */}
        <TabsContent value="staff" className="space-y-4">
          {/* Search & Filter */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("business.staff.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder={t("business.staff.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("business.staff.all")}</SelectItem>
                <SelectItem value="active">{t("business.staff.active")}</SelectItem>
                <SelectItem value="inactive">{t("business.staff.locked")}</SelectItem>
              </SelectContent>
            </Select>
            {businessRoles.length > 0 && (
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder={t("business.staff.role")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("business.staff.allRoles")}</SelectItem>
                  {businessRoles.map((role) => (
                    <SelectItem key={role.id} value={String(role.id)}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Staff List */}
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <StaffCardSkeleton key={i} />
              ))}
            </div>
          ) : staff.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
              <Users className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                {t("business.staff.noStaffAny")}
              </p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                {t("business.staff.noStaffDesc")}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInviteOpen(true)}
                >
                  <Mail className="mr-2 h-3 w-3" />
                  {t("business.staff.inviteStaff")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {staff.map((s) => (
                <StaffCard
                  key={s.id}
                  staffMember={s}
                  onEdit={openEdit}
                  onResetPassword={openResetPw}
                  onToggleStatus={handleToggleStatus}
                  onRemove={openRemove}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                {t("business.staff.staffCount", { count: pagination.total })}
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
                  {t("business.staff.prev")}
                </Button>
                <span className="text-sm">
                  {t("business.staff.page", { page: pagination.page, total: pagination.totalPages })}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page + 1 }))
                  }
                >
                  {t("business.staff.next")}
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ─── Invitations Tab ────────────────────────────────────────────────── */}
        <TabsContent value="invitations" className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center flex-wrap">
            <Select
              value={invStatusFilter}
              onValueChange={setInvStatusFilter}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder={t("business.staff.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("business.staff.all")}</SelectItem>
                <SelectItem value="pending">{t("business.staff.pending")}</SelectItem>
                <SelectItem value="accepted">{t("business.staff.accepted")}</SelectItem>
                <SelectItem value="expired">{t("business.staff.expired")}</SelectItem>
                <SelectItem value="revoked">{t("business.staff.revoked")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {invLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <StaffCardSkeleton key={i} />
              ))}
            </div>
          ) : invitations.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
              <Mail className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                {t("business.staff.noStaffAny")}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setInviteOpen(true)}
              >
                <UserPlus className="mr-2 h-3 w-3" />
                {t("business.staff.inviteNewStaff")}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {invitations.map((inv) => {
                const statusCfg =
                  INVITATION_STATUS_CONFIG[inv.status] ||
                  INVITATION_STATUS_CONFIG.pending;
                return (
                  <div
                    key={inv.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 rounded-lg border bg-card p-4"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {inv.email || t("business.staff.inviteLink")}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {inv.role && (
                            <Badge variant="secondary" className="text-[10px]">
                              <Shield className="mr-1 h-2.5 w-2.5" />
                              {inv.role.name}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {t("business.staff.expiresAt")}{" "}
                            {new Date(inv.expiresAt).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <Badge variant="outline" className={statusCfg.className}>
                        {statusCfg.label}
                      </Badge>
                      {inv.status === "pending" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 md:h-8 md:w-8 min-h-[44px] md:min-h-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              navigator.clipboard.writeText(
                                getInviteLink(inv.token),
                              );
                              toast.success(t("business.staff.linkCopied"));
                            }}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            {t("business.staff.copyLink")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRevokeInvite(inv)}
                            className="text-red-600"
                          >
                            <X className="mr-2 h-4 w-4" />
                            {t("business.staff.revoke")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          )}

          {/* Pagination */}
          {invPagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                {t("business.staff.inviteCount", { count: invPagination.total })}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={invPagination.page <= 1}
                  onClick={() =>
                    setInvPagination((p) => ({ ...p, page: p.page - 1 }))
                  }
                >
                  {t("business.staff.prev")}
                </Button>
                <span className="text-sm">
                  {t("business.staff.page", { page: invPagination.page, total: invPagination.totalPages })}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={invPagination.page >= invPagination.totalPages}
                  onClick={() =>
                    setInvPagination((p) => ({ ...p, page: p.page + 1 }))
                  }
                >
                  {t("business.staff.next")}
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ─── Invite Dialog ──────────────────────────────────────────────────── */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              {t("business.staff.inviteNewStaff")}
            </DialogTitle>
            <DialogDescription>
              {t("business.staff.inviteDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">{t("business.staff.staffEmail")}</Label>
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
                {t("business.staff.emailHint")}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">{t("business.staff.roleRequired")}</Label>
              <Select
                value={inviteForm.roleId}
                onValueChange={(v) =>
                  setInviteForm((f) => ({ ...f, roleId: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("business.staff.selectRole")} />
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
            <div className="space-y-2">
              <Label htmlFor="invite-message">{t("business.staff.messageOptional")}</Label>
              <Textarea
                id="invite-message"
                placeholder={t("business.staff.messagePlaceholder")}
                value={inviteForm.message}
                onChange={(e) =>
                  setInviteForm((f) => ({ ...f, message: e.target.value }))
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setInviteOpen(false)}
              disabled={submitting}
            >
              {t("business.staff.cancel")}
            </Button>
            <Button onClick={handleCreateInvite} disabled={submitting}>
              {submitting ? (
                t("business.staff.sending")
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {t("business.staff.sendInvite")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Invite Success Dialog ──────────────────────────────────────────── */}
      <Dialog open={inviteSuccessOpen} onOpenChange={setInviteSuccessOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <Check className="h-5 w-5" />
              {t("business.staff.inviteSuccess")}
            </DialogTitle>
            <DialogDescription>
              {inviteResult?.emailSent
                ? t("business.staff.emailSentTo", { email: inviteResult.email })
                : t("business.staff.shareLinkDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {inviteResult?.emailSent && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                <span>
                  {t("business.staff.emailSentMessage", { email: inviteResult.email })}
                </span>
              </div>
            )}

            <div className="rounded-lg border bg-muted p-4">
              <div className="flex items-center gap-2 mb-2">
                <Link className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{t("business.staff.inviteLinkLabel")}</span>
              </div>
              <div className="flex items-center gap-2">
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
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="rounded-lg border p-3 text-sm space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  {t("business.staff.linkExpiresIn")}
                </span>
              </div>
              {inviteResult?.roleName && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span>
                    {t("business.staff.roleLabel")} <strong>{inviteResult.roleName}</strong>
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
              {t("business.staff.gotIt")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Staff Dialog ──────────────────────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              {t("business.staff.editStaff")}
            </DialogTitle>
            <DialogDescription>
              {t("business.staff.editDesc", { email: selectedStaff?.email })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">{t("business.staff.fullName")}</Label>
              <Input
                id="edit-name"
                value={editForm.fullName}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, fullName: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, email: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">{t("business.staff.phone")}</Label>
              <Input
                id="edit-phone"
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, phone: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">{t("business.staff.role")}</Label>
              <Select
                value={editForm.roleId}
                onValueChange={(v) =>
                  setEditForm((f) => ({ ...f, roleId: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("business.staff.selectRole")} />
                </SelectTrigger>
                <SelectContent>
                  {businessRoles.map((role) => (
                    <SelectItem key={role.id} value={String(role.id)}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label>{t("business.staff.activityStatus")}</Label>
                <p className="text-xs text-muted-foreground">
                  {editForm.isActive
                    ? t("business.staff.staffActive")
                    : t("business.staff.accountLockedDesc")}
                </p>
              </div>
              <Switch
                checked={editForm.isActive}
                onCheckedChange={(checked) =>
                  setEditForm((f) => ({ ...f, isActive: checked }))
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
              {t("business.staff.cancel")}
            </Button>
            <Button onClick={handleEdit} disabled={submitting}>
              {submitting ? t("business.staff.saving") : t("business.staff.saveChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Reset Password Dialog ──────────────────────────────────────────── */}
      <Dialog open={resetPwOpen} onOpenChange={setResetPwOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              {t("business.staff.resetPassword")}
            </DialogTitle>
            <DialogDescription>
              {t("business.staff.resetPasswordDesc", { email: selectedStaff?.email })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="new-pw">{t("business.staff.newPassword")}</Label>
            <Input
              id="new-pw"
              type="password"
              placeholder={t("business.staff.minChars")}
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
              {t("business.staff.cancel")}
            </Button>
            <Button onClick={handleResetPassword} disabled={submitting}>
              {submitting ? t("business.staff.processing") : t("business.staff.resetPassword")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Remove Staff Dialog ────────────────────────────────────────────── */}
      <Dialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              {t("business.staff.removeStaff")}
            </DialogTitle>
            <DialogDescription>
              {t("business.staff.removeDesc", { email: selectedStaff?.email })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRemoveOpen(false)}
              disabled={submitting}
            >
              {t("business.staff.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={submitting}
            >
              {submitting ? t("business.staff.deleting") : t("business.staff.removeStaff")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

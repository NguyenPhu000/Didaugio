import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Users,
  UserPlus,
  Search,
  MoreVertical,
  Key,
  Shield,
  Trash2,
  Lock,
  Unlock,
} from "lucide-react";
import { staffApi } from "@/apis/staffApi";
import { staffInvitationApi } from "@/apis/staffInvitationApi";
import { useStaffStats } from "@/hooks/queries/useStaffQueries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MetricCard } from "@/components/business/ui/MetricCard";
import { StaffInviteModal } from "@/components/staff/StaffInviteModal";

export default function StaffManagementPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [staffList, setStaffList] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  const { data: statsRes } = useStaffStats();
  const stats = statsRes?.data?.data || statsRes?.data || {};

  const loadStaffData = useCallback(async () => {
    setLoading(true);
    try {
      const [staffRes, rolesRes] = await Promise.all([
        staffApi.getAll({ search }),
        staffApi.getRoles(),
      ]);
      setStaffList(staffRes.data || []);
      setRoles(rolesRes.data || []);
    } catch {
      toast.error(t("business.staff.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [search, t]);

  useEffect(() => {
    loadStaffData();
  }, [loadStaffData]);

  const handleInviteSubmit = async (data) => {
    const res = await staffInvitationApi.create(data);
    loadStaffData();
    return res.data;
  };

  const handleToggleStatus = async (staff) => {
    try {
      const newStatus = staff.status === "active" ? "inactive" : "active";
      await staffApi.updateStatus(staff.id, newStatus);
      toast.success(t("business.staff.statusSuccess"));
      loadStaffData();
    } catch {
      toast.error(t("business.staff.statusFailed"));
    }
  };

  const handleRemoveStaff = async (id) => {
    try {
      await staffApi.delete(id);
      toast.success(t("business.staff.deleteSuccess"));
      loadStaffData();
    } catch {
      toast.error(t("business.staff.deleteFailed"));
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-100">
            {t("business.staff.title")}
          </h1>
          <p className="text-sm text-zinc-500 mt-1 dark:text-zinc-400">
            {t("business.staff.subtitle")}
          </p>
        </div>
        <Button
          onClick={() => setInviteModalOpen(true)}
          className="gap-2 bg-zinc-950 text-white hover:bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          <UserPlus className="h-4 w-4" />
          {t("business.staff.inviteStaff")}
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title={t("business.staff.totalStaff")}
          value={stats.totalCount ?? staffList.length}
          icon={Users}
          color="blue"
        />
        <MetricCard
          title={t("business.staff.activeStaff")}
          value={stats.activeCount ?? staffList.filter((s) => s.status === "active").length}
          icon={Shield}
          color="emerald"
        />
        <MetricCard
          title={t("business.staff.pendingInvitations")}
          value={stats.pendingCount ?? 0}
          icon={UserPlus}
          color="amber"
        />
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-zinc-200/80 dark:bg-zinc-950 dark:border-zinc-800">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("business.staff.searchPlaceholder")}
            className="pl-9 bg-zinc-50 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : staffList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border rounded-xl bg-white dark:bg-zinc-950">
          <Users className="h-10 w-10 text-zinc-400 mb-2" />
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {t("business.staff.noStaff")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffList.map((member) => (
            <Card key={member.id} className="bg-white border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 font-bold text-sm text-zinc-700 dark:text-zinc-300 flex items-center justify-center">
                      {(member.fullName || member.email || "S")[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-zinc-950 dark:text-zinc-100">
                        {member.fullName || member.email}
                      </h3>
                      <p className="text-xs text-zinc-500">{member.email}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleToggleStatus(member)}>
                        {member.status === "active" ? (
                          <>
                            <Lock className="h-4 w-4 mr-2" />
                            {t("business.staff.lock")}
                          </>
                        ) : (
                          <>
                            <Unlock className="h-4 w-4 mr-2" />
                            {t("business.staff.unlock")}
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleRemoveStaff(member.id)} className="text-red-600 dark:text-red-400">
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t("common.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-100 dark:border-zinc-900">
                  <Badge variant="outline" className="text-[10px]">
                    {member.businessRole?.name || t("business.staff.defaultRole")}
                  </Badge>
                  <span className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                    member.status === "active"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400"
                      : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400"
                  )}>
                    {member.status === "active" ? t("business.staff.active") : t("business.staff.locked")}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Invite Modal */}
      <StaffInviteModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        roles={roles}
        onInvite={handleInviteSubmit}
      />
    </div>
  );
}

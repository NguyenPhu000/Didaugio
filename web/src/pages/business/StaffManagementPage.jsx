import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Lock,
  MoreVertical,
  Search,
  ShieldCheck,
  Unlock,
  UserPlus,
  Users,
} from "lucide-react";
import { staffApi } from "@/apis/staffApi";
import { staffInvitationApi } from "@/apis/staffInvitationApi";
import { useStaffStats } from "@/hooks/queries/useStaffQueries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import { MetricCard } from "@/components/business/ui/MetricCard";
import { StaffInviteModal } from "@/components/staff/StaffInviteModal";

const getStaffName = (staff) =>
  staff.profile?.fullName || staff.fullName || staff.email || "Staff";

export default function StaffManagementPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [staffList, setStaffList] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [updatingRoleId, setUpdatingRoleId] = useState(null);

  const { data: statsResponse } = useStaffStats();
  const stats = statsResponse?.data?.data || statsResponse?.data || {};

  const loadStaffData = useCallback(async () => {
    setLoading(true);
    try {
      const [staffResponse, rolesResponse] = await Promise.all([
        staffApi.getAll({ search }),
        staffInvitationApi.getRoles(),
      ]);
      const staffPayload = staffResponse?.data || {};
      const rolesPayload = rolesResponse?.data || [];

      setStaffList(
        Array.isArray(staffPayload) ? staffPayload : staffPayload.staff || [],
      );
      setRoles(Array.isArray(rolesPayload) ? rolesPayload : []);
    } catch {
      toast.error(t("business.staff.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [search, t]);

  useEffect(() => {
    const timeoutId = window.setTimeout(loadStaffData, 250);
    return () => window.clearTimeout(timeoutId);
  }, [loadStaffData]);

  const handleInviteSubmit = async (data) => {
    const response = await staffInvitationApi.create(data);
    await loadStaffData();
    return response.data;
  };

  const handleToggleStatus = async (staff) => {
    const status = staff.status === "active" ? "inactive" : "active";
    try {
      await staffApi.update(staff.id, { status });
      toast.success(t("business.staff.statusSuccess"));
      await loadStaffData();
    } catch {
      toast.error(t("business.staff.statusFailed"));
    }
  };

  const handleRoleChange = async (staff, value) => {
    setUpdatingRoleId(staff.id);
    try {
      await staffApi.update(staff.id, {
        businessRoleId: value === "unassigned" ? null : Number(value),
      });
      toast.success(t("common.savedSuccessfully"));
      await loadStaffData();
    } catch {
      toast.error(t("common.operationFailed"));
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const activeCount =
    stats.active ?? staffList.filter((staff) => staff.status === "active").length;
  const inactiveCount =
    stats.inactive ?? staffList.filter((staff) => staff.status !== "active").length;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6 lg:p-8">
      <header className="flex flex-col justify-between gap-4 border-b border-zinc-200 pb-5 dark:border-zinc-800 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-100">
            {t("business.staff.title")}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {t("business.staff.subtitle")}
          </p>
        </div>
        <Button
          onClick={() => setInviteModalOpen(true)}
          className="w-full sm:w-auto justify-center h-10 gap-2 bg-zinc-950 px-4 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          <UserPlus className="h-4 w-4" />
          {t("business.staff.inviteStaff")}
        </Button>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          title={t("business.staff.totalStaff")}
          value={stats.total ?? staffList.length}
          icon={Users}
          color="blue"
        />
        <MetricCard
          title={t("business.staff.activeStaff")}
          value={activeCount}
          icon={ShieldCheck}
          color="emerald"
        />
        <MetricCard
          title={t("business.staff.locked")}
          value={inactiveCount}
          icon={Lock}
          color="amber"
        />
      </div>

      <div className="border-y border-zinc-200 py-3 dark:border-zinc-800">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("business.staff.searchPlaceholder")}
            className="h-10 border-zinc-200 bg-white pl-9 dark:border-zinc-800 dark:bg-zinc-950"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-52 rounded-lg" />
          ))}
        </div>
      ) : staffList.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center border border-dashed border-zinc-300 px-4 text-center dark:border-zinc-700">
          <Users className="mb-3 h-9 w-9 text-zinc-400" />
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t("business.staff.noStaff")}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {staffList.map((staff) => {
            const isActive = staff.status === "active";
            const selectedRole = String(staff.businessRole?.id || "unassigned");

            return (
              <article
                key={staff.id}
                className="border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                      {getStaffName(staff).slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-semibold text-zinc-950 dark:text-zinc-100">
                        {getStaffName(staff)}
                      </h2>
                      <p className="truncate text-xs text-zinc-500">{staff.email}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-500"
                      >
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">{t("business.staff.title")}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleToggleStatus(staff)}>
                        {isActive ? (
                          <Lock className="mr-2 h-4 w-4" />
                        ) : (
                          <Unlock className="mr-2 h-4 w-4" />
                        )}
                        {isActive ? t("business.staff.lock") : t("business.staff.unlock")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-4 border-t border-zinc-100 pt-3 dark:border-zinc-900">
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      {t("business.staff.selectRole")}
                    </span>
                    <span
                      className={
                        isActive
                          ? "text-xs font-medium text-emerald-700 dark:text-emerald-400"
                          : "text-xs font-medium text-amber-700 dark:text-amber-400"
                      }
                    >
                      {isActive ? t("business.staff.active") : t("business.staff.locked")}
                    </span>
                  </div>
                  <Select
                    value={selectedRole}
                    onValueChange={(value) => handleRoleChange(staff, value)}
                    disabled={updatingRoleId === staff.id}
                  >
                    <SelectTrigger className="h-9 border-zinc-200 bg-zinc-50 text-sm dark:border-zinc-800 dark:bg-zinc-900">
                      <SelectValue placeholder={t("business.staff.selectRolePlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">
                        {t("business.staff.defaultRole")}
                      </SelectItem>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={String(role.id)}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {staff.profile?.phone && (
                  <p className="mt-3 truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {staff.profile.phone}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}

      <StaffInviteModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        roles={roles}
        onInvite={handleInviteSubmit}
      />
    </div>
  );
}

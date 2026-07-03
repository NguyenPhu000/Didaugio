import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Badge,
  Skeleton,
} from "@/components/ui";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  Activity,
} from "lucide-react";
import { ROLE_NAMES } from "@/constants/constants";
import { formatDate, formatDateTime } from "@/utils/dateUtils";
import { locationService } from "@/apis/locationService";
import { auditLogService } from "@/apis/auditLogService";
import { useTranslation } from "react-i18next";

const UserDetailModal = ({
  open,
  onClose,
  user,
  activityLog: externalActivityLog,
  activityLoading: externalActivityLoading,
}) => {
  const { t } = useTranslation();
  const [fullAddress, setFullAddress] = useState(t("user.detailModal.loading"));
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [activityLog, setActivityLog] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);

  // Use external activity log if provided, otherwise fetch internally
  useEffect(() => {
    if (externalActivityLog !== undefined) {
      setActivityLog(externalActivityLog);
      setActivityLoading(externalActivityLoading ?? false);
    }
  }, [externalActivityLog, externalActivityLoading]);

  // Fetch activity log if not provided externally
  useEffect(() => {
    if (open && user?.id && externalActivityLog === undefined) {
      const fetchActivity = async () => {
        try {
          setActivityLoading(true);
          const res = await auditLogService.getAll({
            userId: user.id,
            limit: 10,
            page: 1,
          });
          setActivityLog(res.data || []);
        } catch {
          setActivityLog([]);
        } finally {
          setActivityLoading(false);
        }
      };
      fetchActivity();
    }
  }, [open, user?.id, externalActivityLog]);

  // Build full address from province/district codes
  useEffect(() => {
    const buildAddress = async () => {
      if (!user || !open) {
        setFullAddress("â€”");
        return;
      }

      setLoadingAddress(true);
      const parts = [];

      const address = user.profile?.address || user.address;
      if (address) parts.push(address);

      const provinceCode = user.profile?.provinceCode || user.provinceCode;
      const districtCode = user.profile?.districtCode || user.districtCode;

      if (!provinceCode) {
        setFullAddress(parts.length > 0 ? parts.join(", ") : "â€”");
        setLoadingAddress(false);
        return;
      }

      try {
        if (districtCode) {
          try {
            const wards = await locationService.getWardsByProvince(provinceCode);
            const ward = wards.find((w) => w.ward_code === districtCode);
            if (ward) {
              if (ward.ward_name) parts.push(ward.ward_name);
              if (ward.district_name) parts.push(ward.district_name);
            }
          } catch (err) {
            console.error("Error fetching ward:", err);
          }
        }

        const provinces = await locationService.getAllProvinces();
        const province = provinces.find((p) => p.province_code === provinceCode);
        if (province) parts.push(province.name);
      } catch (error) {
        console.error("Error fetching location names:", error);
      }

      setFullAddress(parts.length > 0 ? parts.join(", ") : "â€”");
      setLoadingAddress(false);
    };

    buildAddress();
  }, [user, open, t]);

  if (!user) return null;

  const getRoleName = (roleId) => {
    const roleKeys = {
      1: "roles.names.superAdmin",
      2: "roles.names.admin",
      3: "roles.names.business",
      4: "roles.names.staff",
      5: "roles.names.user",
      6: "roles.names.guest",
    };
    return roleKeys[roleId] ? t(roleKeys[roleId]) : t("user.detailModal.unknown");
  };

  const getGenderName = (gender) => {
    const genderMap = {
      male: t("user.detailModal.male"),
      female: t("user.detailModal.female"),
      other: t("user.detailModal.other"),
    };
    return genderMap[gender] || "â€”";
  };

  const getStatusInfo = (status) => {
    if (status === "active") {
      return { text: t("user.detailModal.statusActive"), className: "bg-green-100 text-green-700" };
    }
    if (status === "inactive" || status === "locked") {
      return { text: t("user.detailModal.statusLocked"), className: "bg-red-100 text-red-700" };
    }
    if (status === "banned") {
      return { text: t("user.detailModal.statusBanned"), className: "bg-gray-100 text-gray-700" };
    }
    return { text: t("user.detailModal.unknown"), className: "bg-gray-100 text-gray-700" };
  };

  const getRoleColor = (roleId) => {
    const colors = {
      1: "bg-red-100 text-red-700",
      2: "bg-purple-100 text-purple-700",
      3: "bg-primary/10 text-primary",
      4: "bg-blue-100 text-blue-700",
      5: "bg-gray-100 text-gray-700",
    };
    return colors[roleId] || "bg-gray-100 text-gray-700";
  };

  const displayName =
    user.profile?.fullName || user.fullName || t("user.detailModal.notUpdated");
  const displayPhone = user.profile?.phone || user.phone || "â€”";
  const displayGender = getGenderName(user.profile?.gender || user.gender);
  const displayDob = formatDate(user.profile?.dateOfBirth || user.dateOfBirth);
  const statusInfo = getStatusInfo(user.status);
  const avatarInitial =
    displayName !== t("user.detailModal.notUpdated")
      ? displayName.charAt(0).toUpperCase()
      : user.email.charAt(0).toUpperCase();
  let activityContent;
  if (activityLoading) {
    activityContent = (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={`activity-skeleton-${i}`} className="flex items-center gap-3">
            <Skeleton className="h-6 w-6 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2.5 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  } else if (activityLog.length === 0) {
    activityContent = (
      <p className="text-sm text-gray-500 text-center py-4">
        Chua co hoat dong nao
      </p>
    );
  } else {
    activityContent = (
      <div className="space-y-3">
        {activityLog.slice(0, 10).map((entry, index) => {
          const actionColor = auditLogService.getActionColor(entry.action);
          return (
            <div key={entry.id || `activity-${index}`} className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white border mt-0.5">
                <Activity className="h-3 w-3 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-900">
                    {entry.description || entry.action}
                  </span>
                  <Badge variant="outline" className={`text-[10px] ${actionColor}`}>
                    {entry.action}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {entry.createdAt
                    ? new Date(entry.createdAt).toLocaleString("vi-VN")
                    : ""}
                  {entry.tableName && ` - ${entry.tableName}`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("user.detailModal.title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Avatar and Basic Info */}
          <div className="flex items-center gap-4 pb-4 border-b">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-2xl">
                {avatarInitial}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-semibold text-gray-900 truncate">
                {displayName}
              </h3>
              <p className="text-sm text-gray-500 truncate">{user.email}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.roleId)}`}>
                  {getRoleName(user.roleId)}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.className}`}>
                  {statusInfo.text}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-800">
              <Mail className="w-4 h-4 text-blue-500" />
              {t("user.detailModal.contactInfo")}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                <p className="font-medium text-gray-900 break-all">{user.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  {t("user.detailModal.phone")}
                </p>
                <p className="font-medium text-gray-900">{displayPhone}</p>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-800">
              <User className="w-4 h-4 text-blue-500" />
              {t("user.detailModal.personalInfo")}
            </h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    {t("user.detailModal.gender")}
                  </p>
                  <p className="font-medium text-gray-900">{displayGender}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {t("user.detailModal.dateOfBirth")}
                  </p>
                  <p className="font-medium text-gray-900">{displayDob}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {t("user.detailModal.address")}
                </p>
                <p className="font-medium text-gray-900">
                  {loadingAddress ? t("user.detailModal.loading") : fullAddress}
                </p>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-800">
              <Shield className="w-4 h-4 text-blue-500" />
              {t("user.detailModal.accountInfo")}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  {t("user.detailModal.role")}
                </p>
                <p className="font-medium text-gray-900">{getRoleName(user.roleId)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  {t("user.detailModal.status")}
                </p>
                <p className="font-medium text-gray-900">{statusInfo.text}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  {t("user.detailModal.emailVerified")}
                </p>
                <div className="flex items-center gap-1">
                  {user.emailVerified ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="font-medium text-green-600">
                        {t("user.detailModal.verified")}
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span className="font-medium text-red-600">
                        {t("user.detailModal.notVerified")}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-800">
              <Clock className="w-4 h-4 text-blue-500" />
              {t("user.detailModal.timeInfo")}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  {t("user.detailModal.createdAt")}
                </p>
                <p className="font-medium text-gray-900">{formatDateTime(user.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  {t("user.detailModal.lastLogin")}
                </p>
                <p className="font-medium text-gray-900">{formatDateTime(user.lastLoginAt)}</p>
              </div>
            </div>
          </div>

          {/* Activity Log */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-800">
              <Activity className="w-4 h-4 text-blue-500" />
              Hoat dong gan day
            </h4>
            <div className="bg-gray-50 rounded-lg p-4">{activityContent}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>{t("user.detailModal.close")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailModal;

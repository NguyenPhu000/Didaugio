import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import {
  Bell,
  Mail,
  Smartphone,
  Loader2,
  CalendarCheck,
  CalendarX,
  Clock,
  Star,
  DollarSign,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { NOTIFICATION_GROUPS } from "./profileConstants";

const NOTIFICATION_ICONS = {
  bookingConfirmed: CalendarCheck,
  bookingCancelled: CalendarX,
  bookingPending: Clock,
  newReview: Star,
  paymentReceived: DollarSign,
  systemAlerts: AlertCircle,
};

const NOTIFICATION_DESCRIPTIONS = {
  bookingConfirmed: "Nhận thông báo khi đơn đặt chỗ được đối tác hoặc hệ thống xác nhận thành công.",
  bookingCancelled: "Cảnh báo khi khách hàng hoặc đối tác yêu cầu hủy đơn đặt chỗ.",
  bookingPending: "Thông báo khi có đơn đặt dịch vụ mới đang chờ xử lý hoặc phê duyệt.",
  newReview: "Cập nhật khi có khách du lịch gửi đánh giá hoặc nhận xét mới về địa điểm/dịch vụ.",
  paymentReceived: "Thông báo ngay khi giao dịch thanh toán VietQR / Thẻ được ghi nhận thành công.",
  systemAlerts: "Cảnh báo bảo mật tài khoản, hoạt động đáng ngờ và các bản cập nhật quan trọng từ hệ thống.",
};

export const ProfileNotificationsTab = memo(
  ({ notifSaving, notifSettings, handleNotifToggle }) => {
    const { t } = useTranslation();

    return (
      <div className="space-y-6">
        <div className="rounded-[28px] border border-black/[0.06] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden">
          {/* Header */}
          <div className="border-b border-black/[0.05] bg-[#FAF9F5] px-6 py-5 sm:px-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
                <Bell className="h-5 w-5 text-amber-300" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-950">
                  {t("profile.notificationSettings.title")}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {t("profile.notificationSettings.desc")}
                </p>
              </div>
            </div>
            {notifSaving ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-50 px-3.5 py-1 rounded-full border border-amber-200">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
                Đang lưu...
              </span>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                Tự động lưu
              </span>
            )}
          </div>

          {/* Group Channels */}
          <div className="p-6 sm:p-8 space-y-8">
            {NOTIFICATION_GROUPS.map((group) => {
              const isEmail = group.key === "email";
              const GroupIcon = isEmail ? Mail : Smartphone;

              return (
                <div key={group.key} className="space-y-3.5">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-black/[0.04]">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-800">
                      <GroupIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                        {isEmail ? "Kênh Thông báo qua Email" : "Kênh Thông báo Đẩy (Web / Mobile)"}
                      </h4>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {group.toggles.map(([key, labelKey]) => {
                      const IconComponent = NOTIFICATION_ICONS[key] || Bell;
                      const isChecked = !!notifSettings[group.key]?.[key];
                      const desc = NOTIFICATION_DESCRIPTIONS[key];

                      return (
                        <div
                          key={key}
                          className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-black/[0.06] bg-[#F8F7F3] hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-start gap-3.5">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 mt-0.5 ${
                                isChecked
                                  ? "bg-slate-950 text-amber-300"
                                  : "bg-slate-200 text-slate-400"
                              }`}
                            >
                              <IconComponent className="h-4 w-4" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold text-slate-950">
                                {t(labelKey)}
                              </p>
                              {desc && (
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                  {desc}
                                </p>
                              )}
                            </div>
                          </div>

                          <Switch
                            checked={isChecked}
                            onCheckedChange={(checked) =>
                              handleNotifToggle(group.key, key, checked)
                            }
                            className="data-[state=checked]:bg-slate-950 data-[state=unchecked]:bg-slate-300"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
);

ProfileNotificationsTab.displayName = "ProfileNotificationsTab";
export default ProfileNotificationsTab;

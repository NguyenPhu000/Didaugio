import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { Switch } from "@/components/ui/switch";
import { NOTIFICATION_GROUPS } from "./profileConstants";

const NOTIFICATION_DESCRIPTIONS = {
  bookingConfirmed: "Nhận thông báo khi đơn đặt chỗ được xác nhận thành công.",
  bookingCancelled: "Cảnh báo khi có yêu cầu hủy đơn đặt chỗ từ người dùng.",
  bookingPending: "Thông báo khi có đơn đặt dịch vụ mới đang chờ xử lý.",
  newReview: "Cập nhật khi có khách du lịch gửi đánh giá mới về địa điểm hoặc dịch vụ.",
  paymentReceived: "Thông báo khi giao dịch thanh toán VietQR được ghi nhận thành công.",
  systemAlerts: "Cảnh báo bảo mật tài khoản và các thông báo vận hành quan trọng từ hệ thống.",
};

export const ProfileNotificationsTab = memo(
  ({ notifSaving, notifSettings, handleNotifToggle }) => {
    const { t } = useTranslation();

    return (
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-black/[0.04] shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-h-[540px] flex flex-col justify-between space-y-7">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-[#1D1D1F]">
              Cài đặt thông báo
            </h3>
            <p className="text-xs text-[#86868B] mt-0.5">
              Chọn các sự kiện bạn muốn nhận thông báo qua email và thiết bị
            </p>
          </div>

          <div className="text-xs text-[#86868B]">
            {notifSaving ? "Đang lưu..." : "Tự động lưu"}
          </div>
        </div>

        {/* Group Channels */}
        <div className="space-y-6">
          {NOTIFICATION_GROUPS.map((group) => {
            const isEmail = group.key === "email";

            return (
              <div key={group.key} className="space-y-3">
                <h4 className="text-xs font-semibold text-[#86868B] uppercase tracking-wider px-1">
                  {isEmail ? "Kênh Email" : "Kênh Thông báo Đẩy (Web & Mobile)"}
                </h4>

                <div className="space-y-2">
                  {group.toggles.map(([key, labelKey]) => {
                    const isChecked = !!notifSettings[group.key]?.[key];
                    const desc = NOTIFICATION_DESCRIPTIONS[key];

                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-[#F5F5F7] transition-colors"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <p className="text-xs font-semibold text-[#1D1D1F]">
                            {t(labelKey, key)}
                          </p>
                          {desc && (
                            <p className="text-xs text-[#86868B] leading-relaxed">
                              {desc}
                            </p>
                          )}
                        </div>

                        <Switch
                          checked={isChecked}
                          onCheckedChange={(checked) =>
                            handleNotifToggle(group.key, key, checked)
                          }
                          aria-label={t(labelKey, key)}
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
    );
  }
);

ProfileNotificationsTab.displayName = "ProfileNotificationsTab";
export default ProfileNotificationsTab;

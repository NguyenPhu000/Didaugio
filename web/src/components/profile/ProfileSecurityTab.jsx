import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ADMIN_ROUTES } from "@/constants/routes";

export const ProfileSecurityTab = memo(({ setChangePasswordOpen }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-black/[0.04] shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-h-[540px] flex flex-col justify-between space-y-8">
      <div className="space-y-8">
        {/* Section 1: Mật khẩu */}
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-[#1D1D1F]">
              Đăng nhập & Bảo mật
            </h3>
            <p className="text-xs text-[#86868B] mt-0.5">
              Quản lý mật khẩu và các tùy chọn xác thực tài khoản quản trị
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#F5F5F7]">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-[#1D1D1F]">
                Mật khẩu tài khoản
              </p>
              <p className="text-xs text-[#86868B]">
                Được bảo vệ bằng mã hóa chuẩn. Cập nhật định kỳ để bảo vệ dữ liệu hệ thống.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setChangePasswordOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#1D1D1F] hover:bg-black active:scale-[0.98] rounded-xl shadow-xs transition-all self-start sm:self-auto cursor-pointer shrink-0"
            >
              Đổi mật khẩu
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F5F5F7]">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-[#1D1D1F]">
                Trạng thái tài khoản
              </p>
              <p className="text-xs text-[#86868B]">
                Tài khoản được gán phân quyền quản trị cao cấp
              </p>
            </div>

            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#E8F8EE] text-[#34C759] shrink-0">
              Bảo vệ tốt
            </span>
          </div>
        </div>

        {/* Section 2: Thiết bị & Phiên hoạt động */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-[#1D1D1F]">
                Thiết bị & Phiên hoạt động
              </h4>
              <p className="text-xs text-[#86868B] mt-0.5">
                Các phiên đăng nhập đang hoạt động trên tài khoản của bạn
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate(ADMIN_ROUTES.LOGIN_HISTORY)}
              className="text-xs font-medium text-[#0071E3] hover:underline cursor-pointer shrink-0"
            >
              Xem nhật ký
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#F5F5F7]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-[#1D1D1F]">
                  Trình duyệt Web hiện tại
                </p>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E8F8EE] text-[#34C759]">
                  Phiên này
                </span>
              </div>
              <p className="text-xs text-[#86868B]">
                Đang hoạt động qua cổng Web Quản trị iPoint Genie
              </p>
            </div>

            <span className="text-xs text-[#86868B] font-mono shrink-0">
              Vừa mới truy cập
            </span>
          </div>
        </div>
      </div>

      {/* Footer Info for consistent bottom spacing */}
      <div className="pt-4 border-t border-black/[0.04] text-xs text-[#86868B]">
        Để đảm bảo an toàn, hãy đăng xuất khỏi các thiết bị công cộng khi không sử dụng.
      </div>
    </div>
  );
});

ProfileSecurityTab.displayName = "ProfileSecurityTab";
export default ProfileSecurityTab;

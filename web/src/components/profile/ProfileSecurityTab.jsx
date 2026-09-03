import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  KeyRound,
  ShieldCheck,
  AlertTriangle,
  History,
  Laptop,
  CheckCircle2,
  FileCheck2,
  ArrowUpRight,
  Fingerprint,
  Lock,
} from "lucide-react";
import { ADMIN_ROUTES } from "@/constants/routes";

export const ProfileSecurityTab = memo(({ setChangePasswordOpen }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Change Password Card */}
      <div className="rounded-[28px] border border-black/[0.06] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="border-b border-black/[0.05] bg-[#FAF9F5] px-6 py-5 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
              <KeyRound className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-950">
                {t("profile.security.changePassword")}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {t("profile.security.changePasswordDesc")}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Bảo vệ tốt
          </span>
        </div>

        <div className="p-6 sm:p-8 space-y-5">
          <div className="flex items-start gap-4 rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                Khuyến nghị bảo mật hệ thống
              </p>
              <p className="text-xs text-amber-900 leading-relaxed font-medium">
                {t("profile.security.passwordTips")} Quản trị viên nên cập nhật mật khẩu định kỳ 90 ngày một lần để đảm bảo an toàn cho tài khoản cấp cao.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div className="text-xs text-slate-500 font-medium">
              Trạng thái: <span className="font-bold text-slate-900">Mật khẩu có độ bảo mật tiêu chuẩn</span>
            </div>
            <button
              type="button"
              onClick={() => setChangePasswordOpen(true)}
              className="h-11 px-6 rounded-full bg-slate-950 hover:bg-black text-white text-xs font-extrabold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <KeyRound className="h-4 w-4 text-amber-300" />
              <span>{t("profile.security.changePasswordBtn")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Sessions & Login History */}
      <div className="rounded-[28px] border border-black/[0.06] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="border-b border-black/[0.05] bg-[#FAF9F5] px-6 py-5 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
              <Laptop className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-950">
                Phiên đăng nhập & Lịch sử truy cập
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Theo dõi các thiết bị và vị trí đang truy cập vào tài khoản
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate(ADMIN_ROUTES.LOGIN_HISTORY)}
            className="h-9 px-4 rounded-full border border-black/[0.08] text-xs font-bold text-slate-800 hover:bg-slate-100 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>Tất cả phiên</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-4">
          {/* Current Device Box */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-black/[0.06] bg-[#F8F7F3]">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-950 border border-black/[0.06] shadow-2xs">
                <Laptop className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-extrabold text-slate-950 uppercase tracking-wide">
                    Trình duyệt Web hiện tại (Phiên này)
                  </p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/80 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    HOẠT ĐỘNG
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Đăng nhập qua Web Portal Admin · Token định danh hợp lệ
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate(ADMIN_ROUTES.LOGIN_HISTORY)}
              className="h-9 px-4 rounded-full bg-white hover:bg-slate-100 border border-black/[0.06] text-xs font-bold text-slate-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <History className="h-3.5 w-3.5 text-slate-400" />
              <span>Xem địa chỉ IP & Thiết bị</span>
            </button>
          </div>
        </div>
      </div>

      {/* Audit Log & Security Assurance Bento */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-[28px] border border-black/[0.06] bg-white p-6 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white mb-3 shadow-sm">
              <Fingerprint className="h-5 w-5 text-amber-300" />
            </div>
            <h4 className="text-sm font-extrabold text-slate-950">
              Mã hóa & Xác thực Cấp cao
            </h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Tài khoản quản trị được bảo vệ bởi thuật toán bcrypt hashing và cơ chế xác thực JWT session token kèm tự động vô hiệu hóa khi phát hiện bất thường.
            </p>
          </div>
          <div className="mt-5 pt-4 border-t border-black/[0.05] flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-700 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Đã kích hoạt lớp bảo vệ
            </span>
          </div>
        </div>

        <div className="rounded-[28px] border border-black/[0.06] bg-white p-6 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white mb-3 shadow-sm">
              <FileCheck2 className="h-5 w-5 text-amber-300" />
            </div>
            <h4 className="text-sm font-extrabold text-slate-950">
              Nhật ký kiểm toán Hệ thống (Audit Logs)
            </h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Mọi hành động nhạy cảm như đổi vai trò, xóa dữ liệu hay thay đổi thiết lập hệ sinh thái đều được ghi log bất biến vào cơ sở dữ liệu.
            </p>
          </div>
          <div className="mt-5 pt-4 border-t border-black/[0.05] flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate(ADMIN_ROUTES.AUDIT_LOGS)}
              className="text-xs font-extrabold text-slate-950 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Truy cập Audit Logs</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

ProfileSecurityTab.displayName = "ProfileSecurityTab";
export default ProfileSecurityTab;

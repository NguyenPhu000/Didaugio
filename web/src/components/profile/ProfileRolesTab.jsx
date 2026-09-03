import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  ShieldAlert,
  ShieldCheck,
  Building2,
  CheckCircle2,
  ArrowUpRight,
  Users,
  MapPin,
  Bot,
  CreditCard,
  Layers,
  Settings2,
} from "lucide-react";
import { ROLE_NAMES, ROLES } from "@/constants/constants";
import { ADMIN_ROUTES } from "@/constants/routes";

export const ProfileRolesTab = memo(({ profile }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const roleId = profile?.roleId;
  const isSuperAdmin = roleId === ROLES.SUPER_ADMIN;
  const isAdmin = roleId === ROLES.ADMIN || isSuperAdmin;
  const roleName = ROLE_NAMES[roleId] || "USER";

  const permissionsList = [
    {
      name: "Quản lý Người dùng & Nhân sự",
      desc: "Xem, phân quyền, cấp quyền và quản lý tài khoản thành viên hệ thống",
      icon: Users,
      allowed: isAdmin,
    },
    {
      name: "Duyệt Địa điểm & Dịch vụ Du lịch",
      desc: "Kiểm duyệt địa điểm Cần Thơ, phê duyệt dịch vụ kinh doanh",
      icon: MapPin,
      allowed: isAdmin,
    },
    {
      name: "Cấu hình AI Engine & Lịch trình",
      desc: "Quản lý Versioned Prompts, mô hình Groq / Gemini và logs AI",
      icon: Bot,
      allowed: isSuperAdmin,
    },
    {
      name: "Sổ cái Tài chính & Quyết toán (Payouts)",
      desc: "Theo dõi dòng tiền đối tác, phê duyệt hoàn tiền và đối soát giao dịch",
      icon: CreditCard,
      allowed: isSuperAdmin,
    },
    {
      name: "Quản trị Nội dung (CMS) & Banners",
      desc: "Cập nhật banner quảng bá, chiến dịch marketing và bài viết du lịch",
      icon: Layers,
      allowed: isAdmin,
    },
    {
      name: "Cấu hình Hệ thống & Phân quyền Roles",
      desc: "Điều chỉnh cài đặt hệ sinh thái và quản trị ma trận vai trò",
      icon: Settings2,
      allowed: isSuperAdmin,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Current Role Overview Card */}
      <div className="rounded-[28px] border border-black/[0.06] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="border-b border-black/[0.05] bg-[#FAF9F5] px-6 py-5 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
              <ShieldCheck className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-950">
                Vai trò & Cấp độ Phân quyền
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Thông tin đặc quyền được cấp cho tài khoản quản trị
              </p>
            </div>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={() => navigate(ADMIN_ROUTES.ROLES)}
              className="h-9 px-4 rounded-full border border-black/[0.08] text-xs font-bold text-slate-800 hover:bg-slate-100 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Quản lý Vai trò</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-slate-500" />
            </button>
          )}
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 p-6 rounded-2xl bg-slate-950 text-white shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-amber-300 shrink-0">
                {isSuperAdmin ? (
                  <ShieldAlert className="h-7 w-7" />
                ) : isAdmin ? (
                  <ShieldCheck className="h-7 w-7" />
                ) : (
                  <Building2 className="h-7 w-7" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 font-mono">
                    VAI TRÒ HIỆN TẠI
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/15 text-[10px] font-bold text-white">
                    HOẠT ĐỘNG
                  </span>
                </div>
                <h4 className="text-xl font-black tracking-tight text-white">
                  {roleName}
                </h4>
                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  {isSuperAdmin
                    ? "Toàn quyền quản trị cao nhất, kiểm soát hạ tầng, tài chính và cấu hình hệ sinh thái iPoint Genie."
                    : isAdmin
                    ? "Quản trị viên vận hành hệ thống, kiểm duyệt nội dung, quản lý người dùng và địa điểm."
                    : "Tài khoản đối tác kinh doanh dịch vụ du lịch tại Cần Thơ."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 sm:border-l sm:border-white/15 sm:pl-6">
              <div className="text-left sm:text-right">
                <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider font-mono">
                  Cấp độ truy cập
                </span>
                <span className="text-sm font-extrabold text-white font-mono">
                  {isSuperAdmin ? "Level 1 (Highest)" : isAdmin ? "Level 2 (Admin)" : "Level 3 (Partner)"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Permissions Breakdown Matrix */}
      <div className="rounded-[28px] border border-black/[0.06] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="border-b border-black/[0.05] bg-[#FAF9F5] px-6 py-5 sm:px-8">
          <h3 className="text-base font-extrabold text-slate-950">
            Ma trận quyền hạn phân hệ
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Chi tiết các chức năng mà vai trò của bạn có thể thực hiện
          </p>
        </div>

        <div className="p-6 sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            {permissionsList.map((perm, index) => {
              const Icon = perm.icon;
              return (
                <div
                  key={index}
                  className="flex items-start gap-3.5 p-4 rounded-2xl border border-black/[0.06] bg-[#F8F7F3] hover:bg-slate-50 transition-colors"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 mt-0.5 ${
                      perm.allowed
                        ? "bg-slate-950 text-amber-300"
                        : "bg-slate-200 text-slate-400"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-slate-950">
                        {perm.name}
                      </p>
                      {perm.allowed ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          ĐƯỢC PHÉP
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                          Hạn chế
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      {perm.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});

ProfileRolesTab.displayName = "ProfileRolesTab";
export default ProfileRolesTab;

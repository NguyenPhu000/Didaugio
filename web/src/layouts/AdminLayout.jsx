import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";

import { useAuthStore } from "@/stores/authStore";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarInset,
} from "@/components/animate-ui/components/radix/sidebar";

import { ADMIN_ROUTES, BUSINESS_ROUTES } from "@/constants/routes";
import { ROLES, ROLE_NAMES } from "@/constants/constants";
import { APP_META } from "@/constants/brand";
import { usePlaces } from "@/hooks/queries/usePlaceQueries";
import { usePermission } from "@/hooks/usePermission";
import { useTranslation } from "react-i18next";

// Extracted sub-components
import {
  NavMain,
  CustomSidebarRail,
  AdminHeader,
  getMenuData,
  filterMenuByRole,
} from "./sidebar";

/**
 * ADMIN LAYOUT
 * Warm Minimalist SaaS Framework (70% White / 20% Black / 10% Yellow)
 */
const AdminLayout = ({ children }) => {
  const { user } = useAuthStore();
  const { hasPermission } = usePermission();
  const { t } = useTranslation();

  // Fetch pending places count via TanStack Query (auto-refresh every 60s)
  const { data: pendingPlacesRes } = usePlaces(
    { status: "pending", page: 1, limit: 1 },
    { refetchInterval: 60000, enabled: user?.roleId !== ROLES.BUSINESS }
  );
  const pendingPlacesCount =
    Number(pendingPlacesRes?.pagination?.total ?? pendingPlacesRes?.data?.length ?? 0) || 0;

  useEffect(() => {
    document.title = `${t("common.appName")} - ${t("common.adminPanel")}`;
  }, [t]);

  const menuDataView = useMemo(() => {
    const data = getMenuData();
    const filtered = filterMenuByRole(data, { roleId: user?.roleId, hasPermission });

    if (filtered.main && user?.roleId === ROLES.BUSINESS) {
      filtered.main = filtered.main.map((item) =>
        item.key === "dashboard"
          ? { ...item, url: BUSINESS_ROUTES.DASHBOARD }
          : item
      );
    }

    if (filtered.management) {
      filtered.management = filtered.management.map((item) => {
        if (item.key !== "places" || !item.items) return item;
        return {
          ...item,
          items: item.items.map((sub) => {
            if (sub.url !== ADMIN_ROUTES.PLACES_PENDING) return sub;
            return {
              ...sub,
              badge:
                pendingPlacesCount > 0
                  ? { text: String(pendingPlacesCount) }
                  : null,
            };
          }),
        };
      });
    }

    return filtered;
  }, [pendingPlacesCount, user?.roleId, hasPermission, t]);

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="bg-sidebar border-r border-sidebar-border/30">
        <SidebarHeader className="bg-sidebar px-3 py-4 border-b border-sidebar-border/20">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                asChild
                className="hover:bg-white/[0.04] active:scale-[0.98] transition-all rounded-2xl data-[state=open]:bg-sidebar-accent group-data-[collapsible=icon]:!p-1.5 p-2 h-auto"
              >
                <Link
                  to={
                    user?.roleId === ROLES.BUSINESS
                      ? BUSINESS_ROUTES.DASHBOARD
                      : ADMIN_ROUTES.DASHBOARD
                  }
                  className="flex items-center gap-3 group"
                >
                  <div className="relative flex size-10 items-center justify-center rounded-[14px] bg-gradient-to-b from-white/[0.12] to-white/[0.03] border border-white/[0.12] shadow-[0_2px_12px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)] shrink-0 overflow-hidden transition-transform duration-300 group-hover:scale-105">
                    <div className="absolute inset-0 bg-[#F3E600]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[14px]" />
                    <img
                      src="/logo512.png"
                      alt="iPoint Genie"
                      className="size-6 object-contain relative z-10 transition-transform duration-300 group-hover:rotate-6 group-hover:drop-shadow-[0_0_8px_rgba(243,230,0,0.4)]"
                    />
                  </div>
                  <div className="grid flex-1 text-left group-data-[collapsible=icon]:hidden min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[15px] font-extrabold text-white leading-tight tracking-tight truncate">
                        {APP_META.NAME}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F3E600]/10 border border-[#F3E600]/25 text-[#F3E600] text-[9.5px] font-mono font-bold tracking-wider uppercase leading-none shadow-2xs">
                        <span className="size-1.5 rounded-full bg-[#F3E600] shadow-[0_0_6px_#F3E600] animate-pulse" />
                        {ROLE_NAMES[user?.roleId]
                          ? `${ROLE_NAMES[user?.roleId]}`
                          : APP_META.ADMIN_SUBTITLE}
                      </span>
                    </div>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent className="px-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {/* ─── Common ─── */}
          {menuDataView.main && (
            <NavMain items={menuDataView.main} label={t("nav.section.main")} />
          )}

          {/* ─── Admin sections ─── */}
          {menuDataView.management && (
            <NavMain items={menuDataView.management} label={t("nav.section.management")} />
          )}
          {menuDataView.adminBusiness && (
            <NavMain items={menuDataView.adminBusiness} label={t("nav.section.adminBusiness")} />
          )}
          {menuDataView.users && (
            <NavMain items={menuDataView.users} label={t("nav.section.users")} />
          )}
          {menuDataView.system && (
            <NavMain items={menuDataView.system} label={t("nav.section.system")} />
          )}

          {/* ─── Business sections ─── */}
          {menuDataView.business && (
            <NavMain items={menuDataView.business} label={t("nav.section.business")} />
          )}
          {menuDataView.businessFinance && (
            <NavMain items={menuDataView.businessFinance} label={t("nav.section.finance")} />
          )}
          {menuDataView.businessReviews && (
            <NavMain items={menuDataView.businessReviews} label={t("nav.section.reviews")} />
          )}
          {menuDataView.businessAccount && (
            <NavMain items={menuDataView.businessAccount} label={t("nav.section.account")} />
          )}
        </SidebarContent>
      </Sidebar>
      <CustomSidebarRail />
      <SidebarInset className="bg-[#FAF9F5] relative font-sans min-h-screen text-slate-900 selection:bg-[#F3E600] selection:text-slate-950 flex flex-col">
        <AdminHeader />
        <main className="flex-1 p-2 sm:p-4 md:p-5 lg:p-6 relative z-10 flex flex-col">
          <div className="flex-1 bg-white rounded-2xl sm:rounded-[32px] border border-black/[0.04] p-3.5 sm:p-6 md:p-8 shadow-[0_4px_30px_rgba(0,0,0,0.03)] relative">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AdminLayout;

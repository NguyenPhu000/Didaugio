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
 * Main layout wrapper with sidebar, header, and content area
 * Sub-components extracted to layouts/sidebar/ for maintainability
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
      <Sidebar collapsible="icon" className="bg-sidebar border-r">
        <SidebarHeader className="bg-sidebar px-3 py-4 border-b border-sidebar-border/30">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                asChild
                className="hover:bg-white/[0.04] transition-colors rounded-xl data-[state=open]:bg-sidebar-accent group-data-[collapsible=icon]:!p-1.5"
              >
                <Link
                  to={
                    user?.roleId === ROLES.BUSINESS
                      ? BUSINESS_ROUTES.DASHBOARD
                      : ADMIN_ROUTES.DASHBOARD
                  }
                  className="flex items-center gap-[12px]"
                >
                  {/* Khung Logo Tối Giản & Sắc Sảo */}
                  <div className="flex size-10 items-center justify-center rounded-[14px] bg-white/[0.04] border border-white/[0.08] shrink-0 overflow-hidden">
                    <img src="/logo512.png" alt="iPoint Genie" className="size-7 object-contain" />
                  </div>
                  {/* Cụm Chữ Thương Hiệu Premium */}
                  <div className="grid flex-1 text-left group-data-[collapsible=icon]:hidden">
                    <span className="text-[18px] font-semibold text-white leading-tight">
                      {APP_META.NAME}
                    </span>
                    <span className="text-[11px] font-medium uppercase tracking-[1px] text-[#BDE0FE] leading-tight mt-0.5">
                      {ROLE_NAMES[user?.roleId]
                        ? `${ROLE_NAMES[user?.roleId]}`
                        : APP_META.ADMIN_SUBTITLE}
                    </span>
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
      <SidebarInset>
        <AdminHeader />
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AdminLayout;

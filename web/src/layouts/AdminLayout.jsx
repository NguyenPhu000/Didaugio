import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
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
import AnimatedIcon from "@/components/ui/animated-icon";
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
        <SidebarHeader className="bg-sidebar px-4 py-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                asChild
                className="hover:bg-sidebar-accent transition-colors data-[state=open]:bg-sidebar-accent group-data-[collapsible=icon]:!p-2"
              >
                <Link
                  to={
                    user?.roleId === ROLES.BUSINESS
                      ? BUSINESS_ROUTES.DASHBOARD
                      : ADMIN_ROUTES.DASHBOARD
                  }
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <AnimatedIcon
                      icon={MapPin}
                      className="size-4"
                      type="pulse"
                    />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="font-semibold">{APP_META.NAME}</span>
                    <span className="text-xs text-muted-foreground uppercase">
                      {ROLE_NAMES[user?.roleId]
                        ? `${ROLE_NAMES[user?.roleId]} TERMINAL`
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

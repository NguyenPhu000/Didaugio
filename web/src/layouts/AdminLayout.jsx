import { useEffect, useMemo, useState } from "react";
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
import * as placeService from "@/apis/placeService";
import { usePermission } from "@/hooks/usePermission";

// Extracted sub-components
import {
  NavMain,
  CustomSidebarRail,
  AdminHeader,
  menuData,
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
  const [pendingPlacesCount, setPendingPlacesCount] = useState(0);

  useEffect(() => {
    if (user?.roleId === ROLES.BUSINESS) return;
    let disposed = false;

    const loadPendingCount = async () => {
      try {
        const response = await placeService.getAllPlaces({
          status: "pending",
          page: 1,
          limit: 1,
        });
        if (disposed) return;
        const total =
          response?.pagination?.total ?? response?.data?.length ?? 0;
        setPendingPlacesCount(Number(total) || 0);
      } catch {
        if (!disposed) setPendingPlacesCount(0);
      }
    };

    loadPendingCount();
    const timer = setInterval(loadPendingCount, 60000);
    return () => {
      disposed = true;
      clearInterval(timer);
    };
  }, [user?.roleId]);

  const menuDataView = useMemo(() => {
    const filtered = filterMenuByRole(menuData, { roleId: user?.roleId, hasPermission });

    if (filtered.main && user?.roleId === ROLES.BUSINESS) {
      filtered.main = filtered.main.map((item) =>
        item.title === "Dashboard"
          ? { ...item, url: BUSINESS_ROUTES.DASHBOARD }
          : item,
      );
    }

    if (filtered.management) {
      filtered.management = filtered.management.map((item) => {
        if (item.title !== "Địa điểm" || !item.items) return item;
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
  }, [pendingPlacesCount, user?.roleId, hasPermission]);

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
          {menuDataView.main && (
            <NavMain items={menuDataView.main} label="Main" />
          )}
          {menuDataView.management && (
            <NavMain items={menuDataView.management} label="Quản lý" />
          )}
          {menuDataView.business && (
            <NavMain items={menuDataView.business} label="Doanh nghiệp" />
          )}
          {menuDataView.adminBusiness && (
            <NavMain items={menuDataView.adminBusiness} label="Business" />
          )}
          {menuDataView.users && (
            <NavMain items={menuDataView.users} label="Users" />
          )}
          {menuDataView.system && (
            <NavMain items={menuDataView.system} label="System" />
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

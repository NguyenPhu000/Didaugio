import { useEffect } from "react";
import { Link } from "react-router-dom";
import { BriefcaseBusiness, CalendarCheck } from "lucide-react";
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

import { APP_META } from "@/constants/brand";
import { BUSINESS_ROUTES } from "@/constants/routes";
import { ROLES, ROLE_NAMES } from "@/constants/constants";
import { PERMISSIONS } from "@/constants/permissions";
import { useAuthStore } from "@/stores/authStore";
import { resolveRoleId } from "@/utils/authRouting";
import { useTranslation } from "react-i18next";
import { CustomSidebarRail, BusinessHeader, BusinessNavMain, getMenuData } from "./sidebar";

/**
 * BusinessLayout — dedicated layout for `/business/*`.
 * Uses standard admin sidebar layout styling and configuration for cohesive UI.
 */
const BusinessLayout = ({ children }) => {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const currentRoleId = resolveRoleId(user);
  const menuData = getMenuData();

  const businessMainMenu = [
    currentRoleId === ROLES.STAFF
      ? {
          title: t("nav.business.bookings"),
          icon: CalendarCheck,
          url: BUSINESS_ROUTES.BOOKINGS,
          permission: PERMISSIONS.BOOKINGS.VIEW,
        }
      : {
          title: t("nav.dashboard"),
          icon: BriefcaseBusiness,
          url: BUSINESS_ROUTES.DASHBOARD,
        },
  ];

  useEffect(() => {
    document.title = `${t("common.appName")} - ${t("common.businessPortal")}`;
  }, [t]);

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
                <Link to={businessMainMenu[0].url} className="flex items-center gap-[12px]">
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
                      {t("common.businessPortal")}
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent className="px-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <BusinessNavMain
            items={businessMainMenu}
            label={t("nav.section.main")}
          />
          <BusinessNavMain
            items={menuData.business || []}
            label={t("nav.section.operations")}
          />
          <BusinessNavMain
            items={menuData.businessFinance || []}
            label={t("nav.section.finance")}
          />
          <BusinessNavMain
            items={menuData.businessReviews || []}
            label={t("nav.section.reviews")}
          />
        </SidebarContent>
      </Sidebar>
      <CustomSidebarRail />
      <SidebarInset className="bg-[#F4F4F4] relative font-sans min-h-screen">
        <div className="absolute inset-0 bg-grid-pattern bg-grid-20 opacity-30 pointer-events-none" />
        <div className="absolute inset-0 bg-grid-dots opacity-40 pointer-events-none" />
        <BusinessHeader />
        <main className="flex-1 overflow-auto p-4 md:p-6 relative z-10">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default BusinessLayout;

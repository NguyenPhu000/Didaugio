import { useEffect } from "react";
import { Link } from "react-router-dom";
import { BriefcaseBusiness, MapPin } from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarInset,
} from "@/components/animate-ui/components/radix/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui";
import AnimatedIcon from "@/components/ui/animated-icon";
import { APP_META } from "@/constants/brand";
import { BUSINESS_ROUTES } from "@/constants/routes";
import { ROLES, ROLE_NAMES } from "@/constants/constants";
import { useAuthStore } from "@/stores/authStore";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import { resolveRoleId } from "@/utils/authRouting";
import { useTranslation } from "react-i18next";
import { CustomSidebarRail, BusinessHeader, NavMain, getMenuData } from "./sidebar";

/**
 * BusinessLayout — dedicated layout for `/business/*`.
 * Uses standard admin sidebar layout styling and configuration for cohesive UI.
 */
const BusinessLayout = ({ children }) => {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const currentRoleId = resolveRoleId(user);
  const menuData = getMenuData();

  const roleLabel = ROLE_NAMES[currentRoleId] || "Doanh nghiệp";
  const avatarSrc = resolveMediaUrl(user?.avatar || user?.profile?.avatar);
  const getInitials = (name) => (name ? name.charAt(0).toUpperCase() : "U");

  const businessMainMenu = [
    {
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
      <Sidebar
        collapsible="icon"
        className="bg-sidebar border-r"
      >
        <SidebarHeader className="bg-sidebar px-4 py-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                asChild
                className="hover:bg-sidebar-accent transition-colors data-[state=open]:bg-sidebar-accent group-data-[collapsible=icon]:!p-2"
              >
                <Link to={BUSINESS_ROUTES.DASHBOARD}>
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
                      {t("common.businessPortal")}
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent className="px-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <NavMain
            items={businessMainMenu}
            label={t("nav.section.main")}
          />
          <NavMain
            items={menuData.businessAccount || []}
            label={t("nav.section.businessAccount")}
          />
          <NavMain
            items={menuData.businessServices || []}
            label={t("nav.section.businessServices")}
          />
          <NavMain
            items={menuData.business || []}
            label={t("nav.section.operations")}
          />
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
            <Avatar className="h-9 w-9 shrink-0 border border-sidebar-border">
              <AvatarImage src={avatarSrc || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
                {getInitials(user?.fullName || user?.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden min-w-0">
              <span className="text-sm font-semibold truncate text-sidebar-foreground">
                {user?.fullName || "Doanh nghiệp"}
              </span>
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
                {roleLabel}
              </span>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
      <CustomSidebarRail />
      <SidebarInset>
        <BusinessHeader />
        <main className="flex-1 overflow-auto bg-zinc-50/50 p-4 md:p-6 dark:bg-zinc-950/50">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default BusinessLayout;

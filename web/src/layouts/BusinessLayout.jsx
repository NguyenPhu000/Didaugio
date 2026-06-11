import { useEffect } from "react";
import { Link } from "react-router-dom";
import { BriefcaseBusiness, MapPin } from "lucide-react";
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
import { APP_META } from "@/constants/brand";
import { BUSINESS_ROUTES } from "@/constants/routes";
import { useTranslation } from "react-i18next";
import { CustomSidebarRail, BusinessHeader, NavMain, getMenuData } from "./sidebar";

/**
 * BusinessLayout — dedicated layout for `/business/*`.
 * Uses standard admin sidebar layout styling and configuration for cohesive UI.
 */
const BusinessLayout = ({ children }) => {
  const { t } = useTranslation();
  const menuData = getMenuData();

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
            items={menuData.business || []}
            label={t("nav.section.operations")}
          />
        </SidebarContent>
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

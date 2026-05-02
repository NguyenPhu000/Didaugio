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
import { AdminHeader, CustomSidebarRail, NavMain, menuData } from "./sidebar";

const businessMainMenu = [
  {
    title: "Dashboard",
    icon: BriefcaseBusiness,
    url: BUSINESS_ROUTES.DASHBOARD,
  },
];

/**
 * Layout riêng cho `/business/*`.
 * Không render các nhóm menu admin để tránh business user lẫn vào admin surface.
 */
const BusinessLayout = ({ children }) => {
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
                      Business Portal
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent className="px-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <NavMain items={businessMainMenu} label="Business" />
          <NavMain items={menuData.business || []} label="Vận hành" />
        </SidebarContent>
      </Sidebar>
      <CustomSidebarRail />
      <SidebarInset>
        <AdminHeader />
        <main className="flex-1 overflow-auto bg-muted/20 p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default BusinessLayout;

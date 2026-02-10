import { Link, useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
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
import AnimatedIcon from "@/components/ui/animated-icon";
import { AUTH_ROUTES, ADMIN_ROUTES } from "@/constants/routes";
import { APP_META } from "@/constants/brand";

// Extracted sub-components
import {
  NavMain,
  NavUser,
  CustomSidebarRail,
  AdminHeader,
  menuData,
} from "./sidebar";

/**
 * ADMIN LAYOUT
 * Main layout wrapper with sidebar, header, and content area
 * Sub-components extracted to layouts/sidebar/ for maintainability
 */
const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate(AUTH_ROUTES.LOGIN);
  };

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
                <Link to={ADMIN_ROUTES.DASHBOARD}>
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <AnimatedIcon
                      icon={MapPin}
                      className="size-4"
                      type="pulse"
                    />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="font-semibold">{APP_META.NAME}</span>
                    <span className="text-xs text-muted-foreground">
                      {APP_META.ADMIN_SUBTITLE}
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent className="px-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <NavMain items={menuData.main} label="Main" />
          <NavMain items={menuData.management} label="Management" />
          <NavMain items={menuData.users} label="Users" />
          <NavMain items={menuData.system} label="System" />
          <NavMain items={menuData.settings} label="Settings" />
        </SidebarContent>
        <SidebarFooter className="p-2">
          <NavUser user={user} onLogout={handleLogout} />
        </SidebarFooter>
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

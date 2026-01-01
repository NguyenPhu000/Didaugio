import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import {
  LogOut,
  Home,
  MapPin,
  Users,
  Settings,
  Building2,
  Tags,
  FolderTree,
  BarChart3,
  Shield,
  ChevronRight,
  ChevronsUpDown,
  ChevronLeft,
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from "@/components/animate-ui/components/radix/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/animate-ui/components/radix/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ROLE_NAMES } from "@/config/constants";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@radix-ui/react-collapsible";

// Menu items cho sidebar
const menuData = {
  main: [
    {
      title: "Dashboard",
      icon: Home,
      url: "/dashboard",
    },
  ],
  management: [
    {
      title: "Địa điểm",
      icon: MapPin,
      items: [
        { title: "Tất cả địa điểm", url: "/places" },
        { title: "Chờ duyệt", url: "/places/pending" },
        { title: "Đã duyệt", url: "/places/approved" },
      ],
    },
    {
      title: "Danh mục",
      icon: FolderTree,
      items: [
        { title: "Tất cả danh mục", url: "/categories" },
        { title: "Thêm danh mục", url: "/categories/new" },
      ],
    },
    {
      title: "Tags",
      icon: Tags,
      url: "/tags",
    },
    {
      title: "Quận / Huyện",
      icon: Building2,
      url: "/districts",
    },
  ],
  users: [
    {
      title: "Người dùng",
      icon: Users,
      items: [
        { title: "Tất cả người dùng", url: "/users" },
        { title: "Thêm người dùng", url: "/users/new" },
      ],
    },
    {
      title: "Phân quyền",
      icon: Shield,
      items: [
        { title: "Roles", url: "/roles" },
        { title: "Permissions", url: "/permissions" },
      ],
    },
  ],
  reports: [
    {
      title: "Thống kê",
      icon: BarChart3,
      items: [
        { title: "Tổng quan", url: "/analytics" },
        { title: "Lượt xem", url: "/analytics/views" },
        { title: "Đánh giá", url: "/analytics/reviews" },
      ],
    },
  ],
  settings: [
    {
      title: "Cài đặt",
      icon: Settings,
      url: "/settings",
    },
  ],
};

// NavMain component with collapsible
function NavMain({ items, label }) {
  const location = useLocation();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive =
              item.url === location.pathname ||
              item.items?.some((sub) => sub.url === location.pathname);

            if (item.items) {
              return (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={isActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        className={cn(isActive && "bg-sidebar-accent")}
                      >
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.url}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={location.pathname === subItem.url}
                            >
                              <Link to={subItem.url}>
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            }

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={location.pathname === item.url}
                >
                  <Link to={item.url}>
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

// NavUser component
function NavUser({ user, onLogout }) {
  const { isMobile } = useSidebar();

  const getInitials = (email) => {
    return email ? email.charAt(0).toUpperCase() : "U";
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                  {getInitials(user?.email)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {user?.fullName || user?.email}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {ROLE_NAMES[user?.roleId] || "User"}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                    {getInitials(user?.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {user?.fullName || user?.email}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user?.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Cài đặt
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive cursor-pointer"
              onClick={onLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

// Custom Rail Toggle - nút lòi ra ở giữa cạnh phải sidebar
function CustomSidebarRail() {
  const { toggleSidebar, open } = useSidebar();

  return (
    <button
      onClick={toggleSidebar}
      style={{
        left: open
          ? "calc(var(--sidebar-width) - 12px)"
          : "calc(var(--sidebar-width-icon) - 12px)",
      }}
      className={cn(
        "fixed top-1/2 z-50 hidden md:flex h-6 w-6 -translate-y-1/2 items-center justify-center",
        "rounded-full border bg-background shadow-md",
        "hover:bg-accent hover:scale-110",
        "transition-all duration-300 ease-in-out"
      )}
      title={open ? "Thu gọn sidebar (Ctrl+B)" : "Mở rộng sidebar (Ctrl+B)"}
    >
      {open ? (
        <ChevronLeft className="size-4 text-muted-foreground" />
      ) : (
        <ChevronRight className="size-4 text-muted-foreground" />
      )}
    </button>
  );
}

// Header component
function Header() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <div className="flex items-center gap-2">
        <span className="font-semibold text-lg">Di Đâu Giờ?</span>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          Admin
        </span>
      </div>
    </header>
  );
}

// Main Layout Export
const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link to="/dashboard">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <MapPin className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Di Đâu Giờ?</span>
                    <span className="truncate text-xs">Admin Panel</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={menuData.main} label="Tổng quan" />
          <NavMain items={menuData.management} label="Quản lý nội dung" />
          <NavMain items={menuData.users} label="Quản lý người dùng" />
          <NavMain items={menuData.reports} label="Báo cáo" />
          <NavMain items={menuData.settings} label="Hệ thống" />
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={user} onLogout={handleLogout} />
        </SidebarFooter>
      </Sidebar>
      <CustomSidebarRail />
      <SidebarInset>
        <Header />
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AdminLayout;

import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import {
  LogOut,
  Home,
  Map,
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
  Mail,
  Key,
  FileText,
  Monitor,
  Sparkles,
  TrendingUp,
  Eye,
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
import AnimatedIcon from "@/components/ui/animated-icon";
import { Avatar, AvatarFallback, Badge } from "@/components/ui";
import { Separator } from "@/components/ui/Separator";
import { cn } from "@/lib/utils";
import { ROLE_NAMES } from "@/constants/constants";
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
      badge: null,
    },
    {
      title: "Bản đồ",
      icon: Map,
      url: "/admin/map",
      badge: { text: "Mới", variant: "default" },
    },
  ],
  management: [
    {
      title: "Địa điểm",
      icon: MapPin,
      url: "/admin/places",
    },
    {
      title: "Danh mục",
      icon: FolderTree,
      url: "/categories",
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
      url: "/users",
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
  system: [
    {
      title: "Email & Bảo mật",
      icon: Mail,
      items: [
        { title: "Xác thực Email", url: "/email-verifications" },
        { title: "Reset Mật khẩu", url: "/password-resets" },
      ],
    },
    {
      title: "Hoạt động",
      icon: FileText,
      items: [
        { title: "Lịch sử hệ thống", url: "/audit-logs" },
        { title: "Lịch sử đăng nhập", url: "/login-history" },
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
      <SidebarGroupLabel className="text-xs font-semibold text-primary uppercase tracking-wider px-3">
        {label}
      </SidebarGroupLabel>
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
                        className={cn(
                          "hover:bg-accent transition-colors",
                          isActive && "bg-accent text-accent-foreground font-medium"
                        )}
                      >
                        <AnimatedIcon icon={item.icon} className={cn("size-4", isActive && "text-primary")} type={isActive ? "pulse" : "hover"} />
                        <span>{item.title}</span>
                        <AnimatedIcon icon={ChevronRight} className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" type="rotate" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.url}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={location.pathname === subItem.url}
                              className="hover:bg-accent data-[active=true]:bg-accent data-[active=true]:text-accent-foreground data-[active=true]:font-medium transition-colors"
                            >
                              <Link to={subItem.url}>
                                <span className="text-sm">{subItem.title}</span>
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
                  className={cn(
                    "hover:bg-accent transition-colors",
                    location.pathname === item.url && "bg-accent text-accent-foreground font-medium"
                  )}
                >
                  <Link to={item.url} className="flex items-center gap-2">
                    <AnimatedIcon icon={item.icon} className={cn("size-4", location.pathname === item.url && "text-primary")} type={location.pathname === item.url ? "pulse" : "hover"} />
                    <span className="flex-1">{item.title}</span>
                    {item.badge && (
                      <Badge 
                        variant={item.badge.variant || "default"} 
                        className="ml-auto h-5 px-2 text-[10px] font-semibold bg-primary hover:bg-primary/90"
                      >
                        {item.badge.text}
                      </Badge>
                    )}
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
              className="data-[state=open]:bg-accent hover:bg-accent transition-colors border-t border-border"
            >
              <Avatar className="h-8 w-8 rounded-lg border-2 border-emerald-200">
                <AvatarFallback className="rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold">
                  {getInitials(user?.email)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-foreground">
                  {user?.fullName || user?.email}
                </span>
                <span className="truncate text-xs text-muted-foreground font-medium">
                  {ROLE_NAMES[user?.roleId] || "User"}
                </span>
              </div>
              <AnimatedIcon icon={ChevronsUpDown} className="ml-auto size-4 text-muted-foreground" type="rotate" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg border-border"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg border-2 border-emerald-200">
                  <AvatarFallback className="rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold">
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
              <Link to="/profile" className="cursor-pointer hover:bg-accent">
                <AnimatedIcon icon={Users} className="mr-2 h-4 w-4" />
                Hồ sơ
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings" className="cursor-pointer hover:bg-accent">
                <AnimatedIcon icon={Settings} className="mr-2 h-4 w-4" type="rotate" />
                Cài đặt
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive cursor-pointer hover:bg-red-50 focus:bg-red-50"
              onClick={onLogout}
            >
              <AnimatedIcon icon={LogOut} className="mr-2 h-4 w-4" type="tap" />
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
        <AnimatedIcon icon={ChevronLeft} className="size-4 text-muted-foreground" type="rotate" />
      ) : (
        <AnimatedIcon icon={ChevronRight} className="size-4 text-muted-foreground" type="rotate" />
      )}
    </button>
  );
}

// Header component
function Header() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-white/80 backdrop-blur-sm px-4">
      <SidebarTrigger className="-ml-1 hover:bg-accent rounded-md transition-colors" />
      <Separator orientation="vertical" className="mr-2 h-4 bg-border" />
      <div className="flex items-center gap-2">
        <span className="font-bold text-lg text-primary">
          Đi Đâu Giờ?
        </span>
        <Badge className="bg-primary text-primary-foreground border-none shadow-sm">
          Admin
        </Badge>
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
      <Sidebar collapsible="icon" className="border-r border-border">
        <SidebarHeader className="border-b border-border bg-sidebar-background">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="hover:bg-accent transition-colors">
                <Link to="/dashboard">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md">
                    <AnimatedIcon icon={MapPin} className="size-4" type="pulse" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-bold text-primary">Đi Đâu Giờ?</span>
                    <span className="truncate text-xs text-muted-foreground font-medium">Admin Panel</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent className="bg-sidebar-background">
          <NavMain items={menuData.main} label="Tổng quan" />
          <NavMain items={menuData.management} label="Quản lý nội dung" />
          <NavMain items={menuData.users} label="Người dùng" />
          <NavMain items={menuData.system} label="Hệ thống" />
          <NavMain items={menuData.settings} label="Cài đặt" />
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

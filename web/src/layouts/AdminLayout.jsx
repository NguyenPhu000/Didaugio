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
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <SidebarGroup className="py-2">
      <SidebarGroupLabel className="text-[10px] font-mono text-gray-500 uppercase tracking-widest px-2 group-data-[collapsible=icon]:hidden">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive =
              item.url === location.pathname ||
              item.items?.some((sub) => sub.url === location.pathname);

            if (item.items) {
              if (isCollapsed) {
                return (
                  <SidebarMenuItem key={item.title}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                          tooltip={item.title}
                          isActive={isActive}
                          className={cn(
                            "relative transition-all duration-200 h-9 justify-center",
                            "hover:bg-white/5 hover:text-white text-gray-400",
                            isActive && "text-[#F3E600] bg-white/5",
                          )}
                        >
                          <AnimatedIcon
                            icon={item.icon}
                            className={cn(
                              "size-4 shrink-0 transition-colors",
                              isActive
                                ? "text-[#F3E600]"
                                : "text-gray-400 group-hover:text-white",
                            )}
                            type={isActive ? "pulse" : "hover"}
                          />
                          <span className="sr-only">{item.title}</span>
                          {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] bg-[#F3E600] rounded-r-sm shadow-[0_0_8px_rgba(243,230,0,0.5)]" />
                          )}
                        </SidebarMenuButton>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        side="right"
                        align="start"
                        sideOffset={20}
                        className="w-56 rounded-md border border-white/10 bg-[#1A1A1A] p-2 text-white shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                      >
                        <DropdownMenuLabel className="text-xs font-mono text-gray-500 uppercase tracking-widest px-2 pb-2">
                          {item.title}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/10 my-1" />
                        {item.items.map((subItem) => {
                          const isSubActive = location.pathname === subItem.url;
                          return (
                            <DropdownMenuItem
                              key={subItem.url}
                              asChild
                              className="focus:bg-white/5 focus:text-[#F3E600]"
                            >
                              <Link
                                to={subItem.url}
                                className={cn(
                                  "flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors",
                                  isSubActive
                                    ? "text-[#F3E600] font-medium bg-white/5"
                                    : "text-gray-400 hover:text-white hover:bg-white/5",
                                )}
                              >
                                {isSubActive && (
                                  <div className="h-1.5 w-1.5 rounded-full bg-[#F3E600] shadow-[0_0_4px_#F3E600]" />
                                )}
                                {subItem.title}
                              </Link>
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>
                );
              }

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
                          "relative transition-all duration-200 h-9",
                          "hover:bg-white/5 hover:text-white text-gray-400",
                          isActive && "text-[#F3E600] font-medium bg-white/5",
                        )}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] bg-[#F3E600] rounded-r-sm shadow-[0_0_8px_rgba(243,230,0,0.5)]" />
                        )}
                        <AnimatedIcon
                          icon={item.icon}
                          className={cn(
                            "size-4 transition-colors",
                            isActive
                              ? "text-[#F3E600]"
                              : "text-gray-400 group-hover/collapsible:text-white",
                          )}
                          type={isActive ? "pulse" : "hover"}
                        />
                        <span className="text-sm tracking-wide group-data-[collapsible=icon]:hidden">
                          {item.title}
                        </span>
                        <AnimatedIcon
                          icon={ChevronRight}
                          className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 opacity-50 group-data-[collapsible=icon]:hidden"
                          type="rotate"
                        />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub className="border-l-white/10 ml-5">
                        {item.items.map((subItem) => {
                          const isSubActive = location.pathname === subItem.url;
                          return (
                            <SidebarMenuSubItem key={subItem.url}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isSubActive}
                                className={cn(
                                  "h-8 transition-colors text-xs",
                                  isSubActive
                                    ? "text-[#F3E600] bg-white/5 font-medium"
                                    : "text-gray-500 hover:text-white hover:bg-transparent",
                                )}
                              >
                                <Link to={subItem.url}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
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
                    "relative transition-all duration-200 h-9",
                    "hover:bg-white/5 hover:text-white text-gray-400",
                    location.pathname === item.url &&
                      "text-[#F3E600] font-medium bg-white/5",
                  )}
                >
                  <Link
                    to={item.url}
                    className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
                  >
                    {location.pathname === item.url && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] bg-[#F3E600] rounded-r-sm shadow-[0_0_8px_rgba(243,230,0,0.5)]" />
                    )}
                    <AnimatedIcon
                      icon={item.icon}
                      className={cn(
                        "size-4 shrink-0 transition-colors",
                        location.pathname === item.url
                          ? "text-[#F3E600]"
                          : "text-gray-400 group-hover:text-white",
                      )}
                      type={location.pathname === item.url ? "pulse" : "hover"}
                    />
                    <span className="flex-1 text-sm tracking-wide group-data-[collapsible=icon]:hidden">
                      {item.title}
                    </span>
                    {item.badge && (
                      <Badge
                        variant={item.badge.variant || "default"}
                        className="ml-auto h-4 px-1.5 text-[9px] font-bold bg-[#F3E600] text-black rounded-sm border-none shadow-[0_0_5px_rgba(243,230,0,0.4)] group-data-[collapsible=icon]:hidden"
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
              className="group-data-[collapsible=icon]:!p-2 hover:bg-white/5 data-[state=open]:bg-white/5 transition-colors ring-1 ring-white/5 hover:ring-white/10"
            >
              <Avatar className="h-8 w-8 rounded-sm ring-1 ring-white/20">
                <AvatarFallback className="rounded-sm bg-[#1A1A1A] text-[#F3E600] font-bold font-mono text-xs">
                  {getInitials(user?.email)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold text-white">
                  {user?.fullName || user?.email}
                </span>
                <span className="truncate text-[10px] text-gray-500 font-mono tracking-wider">
                  {ROLE_NAMES[user?.roleId] || "USER"} :: {user?.id}
                </span>
              </div>
              <AnimatedIcon
                icon={ChevronsUpDown}
                className="ml-auto size-4 text-gray-500 group-data-[collapsible=icon]:hidden"
                type="rotate"
              />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-md border border-white/10 bg-[#141414] text-gray-200"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-sm">
                  <AvatarFallback className="rounded-sm bg-[#F3E600] text-black font-bold">
                    {getInitials(user?.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-bold text-white">
                    {user?.fullName || user?.email}
                  </span>
                  <span className="truncate text-xs text-gray-500">
                    {user?.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              asChild
              className="focus:bg-white/5 focus:text-white"
            >
              <Link to="/profile" className="cursor-pointer">
                <AnimatedIcon icon={Users} className="mr-2 h-4 w-4" />
                Hồ sơ
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              asChild
              className="focus:bg-white/5 focus:text-white"
            >
              <Link to="/settings" className="cursor-pointer">
                <AnimatedIcon
                  icon={Settings}
                  className="mr-2 h-4 w-4"
                  type="rotate"
                />
                Cài đặt
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              className="text-red-400 cursor-pointer focus:bg-red-500/10 focus:text-red-400"
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
        "transition-all duration-300 ease-in-out",
      )}
      title={open ? "Thu gọn sidebar (Ctrl+B)" : "Mở rộng sidebar (Ctrl+B)"}
    >
      {open ? (
        <AnimatedIcon
          icon={ChevronLeft}
          className="size-4 text-muted-foreground"
          type="rotate"
        />
      ) : (
        <AnimatedIcon
          icon={ChevronRight}
          className="size-4 text-muted-foreground"
          type="rotate"
        />
      )}
    </button>
  );
}

// Header component
function Header() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-white/10 bg-[#1A1A1A] text-white px-4 shadow-md z-10 relative">
      <SidebarTrigger className="-ml-1 hover:bg-white/10 rounded-none text-white transition-colors" />
      <div className="h-4 w-px bg-white/20 mx-2" />
      <div className="flex items-center gap-2">
        <span className="font-black text-lg text-white uppercase tracking-tight">
          Di Dau Gio?
        </span>
        <div className="bg-[#F3E600] text-black px-1.5 py-0.5 text-[10px] font-bold font-mono rounded-[2px] shadow-[0_0_8px_rgba(243,230,0,0.4)]">
          ADM-CORE
        </div>
      </div>
      <div className="ml-auto flex items-center gap-4 text-[10px] font-mono text-gray-400 uppercase tracking-wider">
        <span className="hidden md:inline-block">NET.STATUS: SECURE</span>
        <span className="w-1.5 h-1.5 bg-[#F3E600] rounded-none animate-pulse"></span>
      </div>
      {/* Decor line bottom */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#F3E600] to-transparent opacity-50"></div>
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
      <Sidebar
        collapsible="icon"
        variant="inset"
        className="[&_[data-sidebar=sidebar]]:!rounded-[24px] [&_[data-sidebar=sidebar]]:!border-[2px] [&_[data-sidebar=sidebar]]:!border-[#F3E600] [&_[data-sidebar=sidebar]]:shadow-[0_0_20px_rgba(243,230,0,0.15)] [&_[data-sidebar=sidebar]]:overflow-hidden bg-transparent pl-4 py-4"
      >
        <SidebarHeader className="bg-sidebar-background px-4 py-6">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                asChild
                className="hover:bg-sidebar-accent transition-colors data-[state=open]:bg-sidebar-accent group-data-[collapsible=icon]:!p-2"
              >
                <Link to="/dashboard">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-sm bg-[#F3E600] text-black shadow-[0_0_10px_rgba(243,230,0,0.3)]">
                    <AnimatedIcon
                      icon={MapPin}
                      className="size-5"
                      type="pulse"
                    />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="font-bold text-white uppercase tracking-wider">
                      Di Dau Gio
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      ADMIN TERMINAL
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent className="bg-sidebar-background px-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <NavMain items={menuData.main} label="Main" />
          <NavMain items={menuData.management} label="Management" />
          <NavMain items={menuData.users} label="Users" />
          <NavMain items={menuData.system} label="System" />
          <NavMain items={menuData.settings} label="Settings" />
        </SidebarContent>
        <SidebarFooter className="bg-sidebar-background p-4 pb-6">
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

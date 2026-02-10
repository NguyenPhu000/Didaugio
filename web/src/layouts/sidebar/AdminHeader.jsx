import { SidebarTrigger } from "@/components/animate-ui/components/radix/sidebar";
import { Search, Bell, MessageSquare, ChevronDown, User } from "lucide-react";
import {
  Button,
  Input,
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui";
import { useAuthStore } from "@/stores/authStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/animate-ui/components/radix/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { AUTH_ROUTES, ADMIN_ROUTES } from "@/constants/routes";

/**
 * AdminHeader - Clean, modern header with search and user actions
 */
function AdminHeader() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : "U";
  };

  const handleLogout = () => {
    logout();
    navigate(AUTH_ROUTES.LOGIN);
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border bg-sidebar px-6 shadow-sm">
      {/* Left Section: Sidebar Trigger & Search */}
      <div className="flex items-center gap-6 flex-1">
        <SidebarTrigger className="-ml-2 h-9 w-9 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" />

        <div className="relative hidden w-full max-w-[400px] md:block">
          <Input
            type="text"
            placeholder="Search"
            className="h-10 w-full rounded-full border-0 bg-sidebar-accent/50 pl-5 pr-12 text-sm text-sidebar-foreground placeholder:text-sidebar-foreground/50 focus-visible:bg-sidebar-accent focus-visible:ring-1 focus-visible:ring-sidebar-ring"
          />
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full hover:bg-sidebar-accent"
          >
            <Search className="h-4 w-4 text-sidebar-foreground/70" />
          </Button>
        </div>
      </div>

      {/* Right Section: Actions & Profile */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-full hover:bg-sidebar-accent text-sidebar-foreground"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-red-500 border-2 border-sidebar"></span>
        </Button>

        {/* Messages */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full hover:bg-sidebar-accent text-sidebar-foreground"
        >
          <MessageSquare className="h-5 w-5" />
        </Button>

        {/* User Profile Dropdown */}
        <div className="pl-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-3 cursor-pointer rounded-full p-1 pl-2 hover:bg-sidebar-accent transition-all">
                <Avatar className="h-9 w-9 border border-sidebar-border">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground font-bold">
                    {getInitials(user?.fullName || user?.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex items-center gap-2 pr-2">
                  <span className="text-sm font-medium text-sidebar-foreground">
                    {user?.fullName || "My Account"}
                  </span>
                  <ChevronDown className="h-4 w-4 text-sidebar-foreground/70" />
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 mt-2 bg-sidebar border-sidebar-border text-sidebar-foreground"
            >
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-sidebar-border" />
              <DropdownMenuItem
                onClick={() => navigate(ADMIN_ROUTES.PROFILE)}
                className="focus:bg-sidebar-accent focus:text-sidebar-accent-foreground"
              >
                <User className="mr-2 h-4 w-4" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="focus:bg-sidebar-accent focus:text-sidebar-accent-foreground">
                <MessageSquare className="mr-2 h-4 w-4" /> Messages
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-sidebar-border" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive focus:bg-sidebar-accent"
              >
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;

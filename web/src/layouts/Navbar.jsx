import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import {
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  MapPin,
  Users,
  Settings,
  Mail,
  Key,
  FileText,
  Monitor,
} from "lucide-react";
import { useState } from "react";
import {
  Button,
  Avatar,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui";
import AnimatedIcon from "@/components/ui/animated-icon";
import { ROLE_NAMES } from "@/constants/constants";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menuItems = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "Dia diem", path: "/places", icon: MapPin },
    { label: "Nguoi dung", path: "/users", icon: Users },
    { label: "Email Verif.", path: "/email-verifications", icon: Mail },
    { label: "Password Reset", path: "/password-resets", icon: Key },
    { label: "Audit Logs", path: "/audit-logs", icon: FileText },
    { label: "Login History", path: "/login-history", icon: Monitor },
    { label: "Cai dat", path: "/settings", icon: Settings, type: "rotate" },
  ];

  const getInitials = (email) => {
    return email ? email.charAt(0).toUpperCase() : "U";
  };

  return (
    <nav className="bg-background border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-primary">Di Dau Gio?</span>
            <span className="text-sm text-muted-foreground">Admin</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  location.pathname === item.path
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <AnimatedIcon 
                  icon={item.icon} 
                  className="h-4 w-4 mr-2" 
                  type={item.type || "hover"}
                />
                {item.label}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{getInitials(user?.email)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {ROLE_NAMES[user?.roleId]}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer"
                >
                  <AnimatedIcon icon={LogOut} className="mr-2 h-4 w-4" type="tap" />
                  <span>Dang xuat</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <AnimatedIcon icon={X} className="h-6 w-6 text-foreground" type="rotate" />
            ) : (
              <AnimatedIcon icon={Menu} className="h-6 w-6 text-foreground" type="rotate" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    location.pathname === item.path
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <AnimatedIcon 
                    icon={item.icon} 
                    className="h-4 w-4 mr-2" 
                    type={item.type || "hover"} 
                  />
                  {item.label}
                </Link>
              ))}
              <div className="border-t pt-3 mt-3">
                <div className="flex items-center justify-between px-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {user?.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ROLE_NAMES[user?.roleId]}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    <AnimatedIcon icon={LogOut} className="h-4 w-4" type="tap" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

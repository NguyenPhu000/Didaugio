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
    <nav className="bg-[#1A1A1A] text-white border-b border-white/10 sticky top-0 z-50 shadow-md">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-[#F3E600] flex items-center justify-center text-black font-bold rounded-sm shadow-[0_0_10px_rgba(243,230,0,0.3)]">
              D
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight leading-none text-white group-hover:text-[#F3E600] transition-colors uppercase">
                Di Dau Gio?
              </span>
              <span className="text-[10px] text-gray-400 tracking-[0.2em] leading-none uppercase mt-0.5">
                Admin // Terminal
              </span>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative flex items-center px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wide transition-all duration-200 group overflow-hidden border border-transparent",
                  location.pathname === item.path
                    ? "text-[#F3E600] bg-white/5 border-white/5"
                    : "text-gray-400 hover:text-white hover:bg-white/5 hover:border-white/10",
                )}
              >
                {/* Active Indicator Line */}
                {location.pathname === item.path && (
                  <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#F3E600]"></span>
                )}

                <AnimatedIcon
                  icon={item.icon}
                  className={cn(
                    "h-4 w-4 mr-2 transition-colors",
                    location.pathname === item.path
                      ? "text-[#F3E600]"
                      : "text-gray-500 group-hover:text-white",
                  )}
                  type={item.type || "hover"}
                />
                {item.label}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center gap-4">
            <div className="h-8 w-px bg-white/10"></div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full hover:bg-white/10 ring-offset-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                >
                  <Avatar className="h-9 w-9 border border-white/20">
                    <AvatarFallback className="bg-[#1A1A1A] text-white text-xs font-mono">
                      {getInitials(user?.email)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 bg-[#1A1A1A] border-white/10 text-white rounded-none"
                align="end"
                forceMount
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none text-white uppercase tracking-wider">
                      {user?.email}
                    </p>
                    <p className="text-[10px] leading-none text-gray-500 font-mono mt-1">
                      {ROLE_NAMES[user?.roleId]} // USER
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  className="focus:bg-white/10 focus:text-[#F3E600] cursor-pointer text-gray-300 font-mono text-xs uppercase"
                  onClick={() => navigate("/settings")}
                >
                  <Settings className="mr-2 h-3.5 w-3.5" />
                  <span>Cai dat</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="focus:bg-red-900/20 focus:text-red-400 text-red-400 cursor-pointer font-mono text-xs uppercase"
                  onClick={handleLogout}
                >
                  <AnimatedIcon
                    icon={LogOut}
                    className="mr-2 h-3.5 w-3.5"
                    type="tap"
                  />
                  <span>Dang xuat</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-400 hover:text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <AnimatedIcon icon={X} className="h-6 w-6" type="rotate" />
            ) : (
              <AnimatedIcon icon={Menu} className="h-6 w-6" type="rotate" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10 bg-[#1A1A1A]">
            <div className="space-y-1 px-2">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center px-3 py-3 rounded-md text-sm font-medium transition-colors uppercase tracking-wider",
                    location.pathname === item.path
                      ? "bg-white/5 text-[#F3E600] border-l-2 border-[#F3E600]"
                      : "text-gray-400 hover:bg-white/5 hover:text-white",
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <AnimatedIcon
                    icon={item.icon}
                    className="h-4 w-4 mr-3"
                    type={item.type || "hover"}
                  />
                  {item.label}
                </Link>
              ))}
              <div className="border-t border-white/10 pt-3 mt-3">
                <div className="flex items-center justify-between px-3">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {user?.email}
                    </p>
                    <p className="text-[10px] text-gray-500 font-mono mt-1">
                      {ROLE_NAMES[user?.roleId]}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-red-400"
                  >
                    <AnimatedIcon
                      icon={LogOut}
                      className="h-4 w-4"
                      type="tap"
                    />
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

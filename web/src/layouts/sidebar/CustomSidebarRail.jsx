import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSidebar } from "@/components/animate-ui/components/radix/sidebar";
import AnimatedIcon from "@/components/ui/animated-icon";
import { cn } from "@/lib/utils";

/**
 * CustomSidebarRail - Floating toggle button at the sidebar edge
 */
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

export default CustomSidebarRail;

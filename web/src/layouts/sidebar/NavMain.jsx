import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
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
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@radix-ui/react-collapsible";

/**
 * NavMain - Sidebar navigation group with collapsible sub-menus
 */
function NavMain({ items, label }) {
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

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
              if (isCollapsed) {
                return (
                  <CollapsedMenuItem
                    key={item.title}
                    item={item}
                    isActive={isActive}
                    location={location}
                  />
                );
              }

              return (
                <ExpandedMenuItem
                  key={item.title}
                  item={item}
                  isActive={isActive}
                  location={location}
                />
              );
            }

            return (
              <SimpleMenuItem
                key={item.title}
                item={item}
                isActive={location.pathname === item.url}
              />
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

/** Collapsed sidebar - show dropdown on hover */
function CollapsedMenuItem({ item, isActive, location }) {
  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            tooltip={item.title}
            isActive={isActive}
            className={cn(
              "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
            )}
          >
            <AnimatedIcon
              icon={item.icon}
              className="size-4 shrink-0"
              type={isActive ? "pulse" : "hover"}
            />
            <span className="sr-only">{item.title}</span>
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="right"
          align="start"
          sideOffset={20}
          className="w-56 rounded-lg"
        >
          <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
            {item.title}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {item.items.map((subItem) => {
            const isSubActive = location.pathname === subItem.url;
            return (
              <DropdownMenuItem key={subItem.url} asChild>
                <Link
                  to={subItem.url}
                  className={cn(
                    "flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors",
                    isSubActive
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
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

/** Expanded sidebar - show collapsible sub-menu */
function ExpandedMenuItem({ item, isActive, location }) {
  return (
    <Collapsible asChild defaultOpen={isActive} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.title} isActive={isActive}>
            <AnimatedIcon
              icon={item.icon}
              className="size-4"
              type={isActive ? "pulse" : "hover"}
            />
            <span className="group-data-[collapsible=icon]:hidden">
              {item.title}
            </span>
            <AnimatedIcon
              icon={ChevronRight}
              className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden"
              type="rotate"
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.items.map((subItem) => {
              const isSubActive = location.pathname === subItem.url;
              return (
                <SidebarMenuSubItem key={subItem.url}>
                  <SidebarMenuSubButton asChild isActive={isSubActive}>
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

/** Simple single-level menu item (no sub-menus) */
function SimpleMenuItem({ item, isActive }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild tooltip={item.title} isActive={isActive}>
        <Link to={item.url}>
          <AnimatedIcon
            icon={item.icon}
            className="size-4 shrink-0"
            type={isActive ? "pulse" : "hover"}
          />
          <span className="flex-1 group-data-[collapsible=icon]:hidden">
            {item.title}
          </span>
          {item.badge && (
            <Badge
              variant="secondary"
              className="ml-auto h-4 px-1.5 text-[10px] group-data-[collapsible=icon]:hidden"
            >
              {item.badge.text}
            </Badge>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export default NavMain;

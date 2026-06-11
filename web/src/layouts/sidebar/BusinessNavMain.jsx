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

function navTargetMatchesLocation(targetUrl, location) {
  if (!targetUrl) return false;
  const [path, queryString] = targetUrl.split("?");
  if (location.pathname !== path) return false;
  if (!queryString) return true;
  const expected = new URLSearchParams(queryString);
  const actual = new URLSearchParams(location.search);
  for (const [k, v] of expected) {
    if (actual.get(k) !== v) return false;
  }
  return true;
}

/**
 * BusinessNavMain — sidebar navigation for the business portal.
 * Visually distinct from admin NavMain: monochrome zinc palette, cleaner active states.
 */
function BusinessNavMain({ items, label }) {
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600 px-2">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive =
              navTargetMatchesLocation(item.url, location) ||
              item.items?.some((sub) =>
                navTargetMatchesLocation(sub.url, location),
              );

            if (item.items) {
              if (isCollapsed) {
                return (
                  <BusinessCollapsedMenuItem
                    key={item.title}
                    item={item}
                    isActive={isActive}
                    location={location}
                  />
                );
              }

              return (
                <BusinessExpandedMenuItem
                  key={item.title}
                  item={item}
                  isActive={isActive}
                  location={location}
                />
              );
            }

            return (
              <BusinessSimpleMenuItem
                key={item.title}
                item={item}
                isActive={navTargetMatchesLocation(item.url, location)}
              />
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function BusinessCollapsedMenuItem({ item, isActive, location }) {
  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            tooltip={item.title}
            isActive={isActive}
            className={cn(
              "data-[state=open]:bg-zinc-100 data-[state=open]:text-zinc-950 dark:data-[state=open]:bg-zinc-800 dark:data-[state=open]:text-zinc-100",
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
          className="w-56 rounded-xl border-zinc-200/80 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
        >
          <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            {item.title}
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
          {item.items.map((subItem) => {
            const isSubActive = navTargetMatchesLocation(subItem.url, location);
            return (
              <DropdownMenuItem key={subItem.url} asChild>
                <Link
                  to={subItem.url}
                  className={cn(
                    "flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors cursor-pointer",
                    isSubActive
                      ? "bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 font-medium"
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100",
                  )}
                >
                  {subItem.icon && (
                    <AnimatedIcon
                      icon={subItem.icon}
                      className="size-3.5 shrink-0"
                      type={isSubActive ? "pulse" : "hover"}
                    />
                  )}
                  <span className="flex-1">{subItem.title}</span>
                  {subItem.badge?.text && (
                    <Badge
                      variant="secondary"
                      className="h-4 px-1.5 text-[10px] font-semibold bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                    >
                      {subItem.badge.text}
                    </Badge>
                  )}
                </Link>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}

function BusinessExpandedMenuItem({ item, isActive, location }) {
  return (
    <Collapsible asChild defaultOpen={isActive} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip={item.title}
            isActive={isActive}
            className={cn(
              isActive && "bg-zinc-100 text-zinc-950 dark:bg-zinc-800 dark:text-zinc-100",
            )}
          >
            <AnimatedIcon
              icon={item.icon}
              className="size-4"
              type={isActive ? "pulse" : "hover"}
            />
            <span className="group-data-[collapsible=icon]:hidden text-zinc-700 dark:text-zinc-300">
              {item.title}
            </span>
            <AnimatedIcon
              icon={ChevronRight}
              className="ml-auto size-4 transition-transform duration-200 text-zinc-400 dark:text-zinc-600 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden"
              type="rotate"
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.items.map((subItem) => {
              const isSubActive = navTargetMatchesLocation(subItem.url, location);
              return (
                <SidebarMenuSubItem key={subItem.url}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={isSubActive}
                    className={cn(
                      isSubActive && "!bg-zinc-950 !text-white dark:!bg-zinc-100 dark:!text-zinc-950",
                    )}
                  >
                    <Link to={subItem.url}>
                      {subItem.icon && (
                        <AnimatedIcon
                          icon={subItem.icon}
                          className="size-3.5 shrink-0"
                          type={isSubActive ? "pulse" : "hover"}
                        />
                      )}
                      <span className="flex-1 text-zinc-600 dark:text-zinc-400">{subItem.title}</span>
                      {subItem.badge?.text && (
                        <Badge
                          variant="secondary"
                          className="h-4 px-1.5 text-[10px] font-semibold bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                        >
                          {subItem.badge.text}
                        </Badge>
                      )}
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

function BusinessSimpleMenuItem({ item, isActive }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        tooltip={item.title}
        isActive={isActive}
        className={cn(
          isActive && "bg-zinc-100 text-zinc-950 dark:bg-zinc-800 dark:text-zinc-100",
        )}
      >
        <Link to={item.url}>
          <AnimatedIcon
            icon={item.icon}
            className="size-4 shrink-0"
            type={isActive ? "pulse" : "hover"}
          />
          <span className="flex-1 group-data-[collapsible=icon]:hidden text-zinc-700 dark:text-zinc-300">
            {item.title}
          </span>
          {item.badge && (
            <Badge
              variant="secondary"
              className="ml-auto h-4 px-1.5 text-[10px] group-data-[collapsible=icon]:hidden bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
            >
              {item.badge.text}
            </Badge>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export { BusinessNavMain };
export default BusinessNavMain;

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { MODULE_DISPLAY_NAMES } from "@/constants/permissions";
import { useTranslation } from "react-i18next";

export function PermissionList({ permissions, modules }) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const filteredData = useMemo(() => {
    if (!search.trim()) return { permissions, modules };

    const lowerSearch = search.toLowerCase();
    const filtered = {};
    const filteredModules = [];

    Object.entries(permissions).forEach(([module, perms]) => {
      const matchedPerms = perms.filter(
        (p) =>
          p.name.toLowerCase().includes(lowerSearch) ||
          p.displayName.toLowerCase().includes(lowerSearch)
      );

      if (matchedPerms.length > 0) {
        filtered[module] = matchedPerms;
        filteredModules.push(module);
      }
    });

    return { permissions: filtered, modules: filteredModules };
  }, [permissions, modules, search]);

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("role.permissionList.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filteredData.modules.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              {t("role.permissionList.noResults")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredData.modules.map((module) => (
            <Card key={module}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {MODULE_DISPLAY_NAMES[module] || module}
                    </CardTitle>
                    <CardDescription>
                      {t("role.permissionList.permissionCount", { count: filteredData.permissions[module].length })}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">{module}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {filteredData.permissions[module].map((permission) => (
                  <div
                    key={permission.id}
                    className="p-3 rounded-lg border bg-background"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-mono text-xs text-muted-foreground">
                          {permission.name}
                        </p>
                        <p className="text-sm font-medium">
                          {permission.displayName}
                        </p>
                        {permission.description && (
                          <p className="text-xs text-muted-foreground">
                            {permission.description}
                          </p>
                        )}
                      </div>
                      {permission.roles && permission.roles.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {permission.roles.map((role) => (
                            <Badge
                              key={role.id}
                              variant="outline"
                              className="text-xs"
                            >
                              {role.displayName}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

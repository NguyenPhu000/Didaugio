import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RolePermissionTab } from "./role-permission-tab";
import { RoleUsersTab } from "./role-users-tab";
import { Shield, Users } from "lucide-react";

export function RoleManagementModal({ open, onOpenChange, role, onUpdated }) {
  const [activeTab, setActiveTab] = useState("permissions");

  useEffect(() => {
    if (open && role) {
      setActiveTab("permissions");
    }
  }, [open, role]);

  if (!role) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-xl">
            Quản lý - {role.displayName}
          </DialogTitle>
          <DialogDescription>
            {role.description || "Cấu hình quyền hạn và quản lý users"}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col px-6 overflow-hidden"
        >
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger
              value="permissions"
              className="flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              Quyền hạn
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users ({role.userCount || 0})
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="permissions" className="h-full mt-0">
              <ScrollArea className="h-full pr-4">
                <RolePermissionTab
                  role={role}
                  onUpdated={onUpdated}
                  onClose={() => onOpenChange(false)}
                />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="users" className="h-full mt-0">
              <ScrollArea className="h-full pr-4">
                <RoleUsersTab role={role} onUpdated={onUpdated} />
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

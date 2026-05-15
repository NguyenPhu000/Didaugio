import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RolePermissionTab } from "./role-permission-tab";
import { RoleUsersTab } from "./role-users-tab";
import { Settings, Shield, Users } from "lucide-react";

export function RoleManagementModal({ open, onOpenChange, role, onUpdated, readOnly = false }) {
  const [activeTab, setActiveTab] = useState("permissions");

  useEffect(() => {
    if (open && role) {
      const id = requestAnimationFrame(() => setActiveTab("permissions"));
      return () => cancelAnimationFrame(id);
    }
  }, [open, role]);

  if (!role) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 bg-white border-2 border-black rounded-none shadow-hard">
        <DialogHeader className="px-6 pt-6 border-b-2 border-black pb-4">
          <DialogTitle className="text-xl flex items-center gap-3 font-bold uppercase tracking-wider">
            <div className="h-8 w-8 bg-black text-white flex items-center justify-center">
              <Settings className="h-5 w-5" />
            </div>
            QUẢN LÝ - {role.displayName}
          </DialogTitle>
          <DialogDescription className="text-gray-500 font-mono text-xs">
            {role.description || "Cấu hình quyền hạn và quản lý users"}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col px-6 py-4 overflow-hidden"
        >
          <TabsList className="grid w-full grid-cols-2 mb-4 bg-gray-100 border border-black rounded-none p-1 gap-1">
            <TabsTrigger
              value="permissions"
              className="flex items-center gap-2 rounded-none data-[state=active]:bg-black data-[state=active]:text-white transition-all font-bold uppercase tracking-wider data-[state=active]:shadow-none"
            >
              <Shield className="h-4 w-4" />
              Quyền hạn
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="flex items-center gap-2 rounded-none data-[state=active]:bg-black data-[state=active]:text-white transition-all font-bold uppercase tracking-wider data-[state=active]:shadow-none"
            >
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
                  readOnly={readOnly}
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

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
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <DialogHeader className="px-6 pt-6 border-b border-slate-100 dark:border-slate-800 pb-4">
          <DialogTitle className="text-xl flex items-center gap-2">
            <span className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
              <span className="material-icons-round">edit_note</span>
            </span>
            Quản lý - {role.displayName}
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400">
            {role.description || "Cấu hình quyền hạn và quản lý users"}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col px-6 py-4 overflow-hidden"
        >
          <TabsList className="grid w-full grid-cols-2 mb-4 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
            <TabsTrigger
              value="permissions"
              className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm transition-all"
            >
              <span className="material-icons-round text-lg">verified_user</span>
              Quyền hạn
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm transition-all"
            >
              <span className="material-icons-round text-lg">group</span>
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

import { useMemo } from "react";
import { useDashboardOnlineUsers } from "@/hooks/queries/useDashboardQuery";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import Users from "lucide-react/dist/esm/icons/users";
import Wifi from "lucide-react/dist/esm/icons/wifi";

const ROLE_COLORS = {
  super_admin: "bg-red-100 text-red-700",
  admin: "bg-orange-100 text-orange-700",
  business: "bg-blue-100 text-blue-700",
  staff: "bg-purple-100 text-purple-700",
  user: "bg-green-100 text-green-700",
  guest: "bg-gray-100 text-gray-700",
};

const getInitials = (name) => {
  if (!name) return "?";
  return name.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase();
};

export default function OnlineUsersCard() {
  const { data, isLoading } = useDashboardOnlineUsers();

  const count = data?.count ?? 0;
  const users = useMemo(() => data?.users ?? [], [data]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Wifi className="h-4 w-4 text-green-500" />
          Đang trực tuyến
        </CardTitle>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <Users className="h-3 w-3 mr-1" />
          {count}
        </Badge>
      </CardHeader>
      <CardContent>
        {count === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Không có người dùng nào đang trực tuyến
          </p>
        ) : (
          <ScrollArea className="h-[200px]">
            <div className="space-y-3">
              {users.map((u) => (
                <div key={u.id} className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={u.profile?.avatar} />
                      <AvatarFallback className="text-xs">
                        {getInitials(u.profile?.fullName || u.username)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {u.profile?.fullName || u.username}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {u.email}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`text-[10px] ${ROLE_COLORS[u.role?.name] || ""}`}
                  >
                    {u.role?.name}
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

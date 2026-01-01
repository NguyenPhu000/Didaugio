import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { useAuthStore } from "@/stores/authStore";
import { ROLE_NAMES } from "@/config/constants";
import {
  Users,
  MapPin,
  Star,
  Building2,
  TrendingUp,
  Clock,
} from "lucide-react";

const DashboardPage = () => {
  const { user } = useAuthStore();

  const stats = [
    {
      label: "Dia diem",
      value: "0",
      icon: MapPin,
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      label: "Doanh nghiep",
      value: "0",
      icon: Building2,
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      label: "Danh gia",
      value: "0",
      icon: Star,
      bgColor: "bg-yellow-100",
      iconColor: "text-yellow-600",
    },
    {
      label: "Nguoi dung",
      value: "0",
      icon: Users,
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Chào mừng,{" "}
          <span className="font-medium text-foreground">{user?.email}</span> •{" "}
          {ROLE_NAMES[user?.roleId]}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center p-6">
              <div
                className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center mr-4`}
              >
                <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
              Hoat dong gan day
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              Chua co hoat dong nao.
            </p>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <TrendingUp className="h-5 w-5 mr-2 text-muted-foreground" />
              Thong ke nhanh
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  Dia diem cho duyet
                </span>
                <span className="font-semibold text-orange-600">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  Danh gia moi hom nay
                </span>
                <span className="font-semibold text-blue-600">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  Nguoi dung moi thang nay
                </span>
                <span className="font-semibold text-green-600">0</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default DashboardPage;

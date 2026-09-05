import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
} from "@/components/ui";
import {
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  AlertTriangle,
  Server,
  Database,
  Globe2,
} from "lucide-react";
import SettingsSection from "@/components/settings/SettingsSection";
import { cn } from "@/lib/utils";
import { useSystemLogs, useSystemHealth } from "@/hooks/queries/useSettingsQueries";

const LOG_LEVEL_BADGES = {
  error: "bg-red-50 text-red-600 border border-red-100",
  warn: "bg-amber-50 text-amber-600 border border-amber-100",
  info: "bg-blue-50 text-blue-600 border border-blue-100",
};

const SystemHealthTabContent = ({ value = {}, onChange }) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingValue, setPendingValue] = useState(false);

  const { data: logsResponse, refetch: refetchLogs, isFetching: isFetchingLogs } = useSystemLogs({
    limit: 50,
  });
  const { data: healthResponse, refetch: refetchHealth, isFetching: isFetchingHealth } = useSystemHealth();

  const recentLogs = logsResponse?.data || [];
  const health = healthResponse?.data || {};
  const uptime = health.uptime || "Đang tải...";
  const errorCount = health.errorCount ?? 0;
  const isHealthy = health.status === "healthy";
  const postgisStatus = health.postgis === "active";

  const handleToggleMaintenance = (checked) => {
    if (checked) {
      setPendingValue(true);
      setConfirmOpen(true);
    } else {
      onChange("maintenanceMode", false);
    }
  };

  const handleConfirmMaintenance = () => {
    onChange("maintenanceMode", pendingValue);
    setConfirmOpen(false);
  };

  const handleRefresh = () => {
    refetchLogs();
    refetchHealth();
  };

  const isRefreshing = isFetchingLogs || isFetchingHealth;

  return (
    <div className="flex flex-col justify-between h-full space-y-8">
      <div className="space-y-6">
        <SettingsSection
          title="Chế độ bảo trì hệ thống"
          description="Tạm khóa quyền truy cập công khai của du khách để nâng cấp phiên bản hoặc bảo dưỡng máy chủ."
        >
          <div className="rounded-2xl bg-[#F9F9FB] p-5 border border-black/[0.02] space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5 pr-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">
                    Bật chế độ bảo trì toàn hệ thống
                  </span>
                  {value.maintenanceMode && (
                    <span className="rounded-full bg-red-50 text-red-600 px-2 py-0.5 text-[11px] font-semibold">
                      ĐANG BẬT BẢO TRÌ
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-normal leading-relaxed">
                  Khi bật, toàn bộ ứng dụng Mobile và Web Du khách sẽ hiển thị màn hình bảo trì. Chỉ tài khoản quản trị mới có thể đăng nhập.
                </p>
              </div>
              <Switch
                checked={!!value.maintenanceMode}
                onCheckedChange={handleToggleMaintenance}
              />
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
              <label className="block text-xs font-semibold text-slate-700">
                Thông điệp thông báo bảo trì gửi du khách
              </label>
              <textarea
                rows={2}
                value={value.maintenanceMessage || ""}
                onChange={(e) => onChange("maintenanceMessage", e.target.value)}
                placeholder="Nhập nội dung hiển thị trên màn hình bảo trì..."
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 transition-all resize-none leading-relaxed"
              />
            </div>
          </div>
        </SettingsSection>

        <SettingsSection
          title="Tình trạng sức khỏe hạ tầng"
          description="Đo lường thời gian hoạt động của máy chủ, cơ sở dữ liệu PostgreSQL và module PostGIS."
        >
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-[#F9F9FB] p-4 border border-black/[0.02] space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Server className="h-3.5 w-3.5" />
                <span className="text-[11px] font-semibold uppercase">Uptime Máy chủ</span>
              </div>
              <p className="text-lg font-bold tracking-tight text-slate-900 truncate">{uptime}</p>
            </div>

            <div className="rounded-2xl bg-[#F9F9FB] p-4 border border-black/[0.02] space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Database className="h-3.5 w-3.5" />
                <span className="text-[11px] font-semibold uppercase">PostgreSQL DB</span>
              </div>
              <div className="pt-0.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-xs font-semibold">
                  <CheckCircle2 className="h-3 w-3" /> Đã kết nối
                </span>
              </div>
            </div>

            <div className="rounded-2xl bg-[#F9F9FB] p-4 border border-black/[0.02] space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Globe2 className="h-3.5 w-3.5" />
                <span className="text-[11px] font-semibold uppercase">PostGIS GIS</span>
              </div>
              <div className="pt-0.5">
                <span className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                  postgisStatus ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                )}>
                  {postgisStatus ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                  {postgisStatus ? "Sẵn sàng" : "Không sẵn sàng"}
                </span>
              </div>
            </div>

            <div className="rounded-2xl bg-[#F9F9FB] p-4 border border-black/[0.02] space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500">
                <AlertCircle className="h-3.5 w-3.5" />
                <span className="text-[11px] font-semibold uppercase">Lỗi 24 giờ qua</span>
              </div>
              <p className={cn(
                "text-lg font-bold tracking-tight",
                errorCount > 0 ? "text-red-600" : "text-emerald-600"
              )}>
                {errorCount} lỗi
              </p>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection
          title="Nhật ký thao tác vận hành gần nhất"
          description="50 thao tác và sự kiện mới nhất được ghi nhận từ bảng audit_logs của hệ thống."
        >
          <div className="flex justify-end pb-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="rounded-full border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium px-4 h-8 shadow-sm transition-all cursor-pointer"
            >
              <RotateCcw className={cn("h-3.5 w-3.5 mr-1.5", isRefreshing && "animate-spin")} />
              {isRefreshing ? "Đang làm mới..." : "Làm mới dữ liệu"}
            </Button>
          </div>

          <div className="rounded-2xl bg-[#F9F9FB] p-3 border border-black/[0.02] max-h-[300px] overflow-y-auto space-y-2">
            {recentLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-normal">
                Chưa có thao tác nào được ghi nhận trong thời gian gần đây.
              </div>
            ) : (
              recentLogs.map((log, index) => (
                <div
                  key={log.id || index}
                  className="rounded-xl bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)] border border-slate-100/80 space-y-1 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide",
                        LOG_LEVEL_BADGES[log.level] || LOG_LEVEL_BADGES.info
                      )}
                    >
                      {log.action || "HOẠT ĐỘNG"}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                      <Clock className="h-3 w-3" />
                      {log.timestamp
                        ? new Date(log.timestamp).toLocaleString("vi-VN")
                        : "Vừa xong"}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-700 font-medium break-words">
                    {log.message}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Thực hiện bởi: <span className="font-semibold text-slate-600">{log.user}</span>
                  </p>
                </div>
              ))
            )}
          </div>
        </SettingsSection>
      </div>

      <div className="pt-4 flex items-center justify-between text-xs text-slate-400">
        <span>Tình trạng máy chủ được cập nhật trực tiếp qua API</span>
        <span>Hệ sinh thái iPoint Genie Cần Thơ</span>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="rounded-3xl border border-black/[0.04] bg-white p-6 sm:max-w-[440px] shadow-2xl">
          <DialogHeader className="space-y-2">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Xác nhận bật chế độ bảo trì
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs leading-relaxed text-slate-600">
            Bạn có chắc chắn muốn bật <strong className="text-slate-900">Chế độ bảo trì</strong>?
            Mọi du khách trên Mobile App và Website sẽ không thể xem địa điểm hoặc đặt chỗ cho đến khi bạn tắt chế độ này.
          </p>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              className="rounded-full border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium px-4 h-9"
            >
              Hủy bỏ
            </Button>
            <Button
              onClick={handleConfirmMaintenance}
              className="rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-4 h-9 shadow-sm"
            >
              Xác nhận bảo trì
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SystemHealthTabContent;

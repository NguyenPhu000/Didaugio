import React from "react";
import { Monitor, Smartphone, Ban, CheckCircle, XCircle } from "lucide-react";

export const getStatusInfo = (session, t) => {
  const status = session?.status || (session?.isActive ? "active" : "revoked");

  if (status === "revoked" || !session?.isActive) {
    return {
      label: t ? t("loginHistory.revoked") : "Đã thu hồi",
      color: "bg-slate-100 text-slate-600 border-slate-200",
      icon: <Ban className="w-3 h-3 text-slate-500" />,
    };
  }
  if (status === "expired") {
    return {
      label: t ? t("loginHistory.expired") : "Hết hạn",
      color: "bg-rose-50 text-rose-700 border-rose-200",
      icon: <XCircle className="w-3 h-3 text-rose-500" />,
    };
  }
  return {
    label: t ? t("loginHistory.active") : "Đang hoạt động",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: <CheckCircle className="w-3 h-3 text-emerald-500" />,
  };
};

export const getDeviceIcon = (deviceName) => {
  if (!deviceName) return <Monitor className="w-3.5 h-3.5 text-slate-400" />;
  const lower = deviceName.toLowerCase();
  if (
    lower.includes("mobile") ||
    lower.includes("android") ||
    lower.includes("iphone")
  ) {
    return <Smartphone className="w-3.5 h-3.5 text-slate-400" />;
  }
  return <Monitor className="w-3.5 h-3.5 text-slate-400" />;
};

export const truncateDevice = (name) => {
  if (!name) return "Không xác định";
  return name.length > 45 ? `${name.substring(0, 45)}...` : name;
};

import React from "react";
import { Monitor, Smartphone, Ban, CheckCircle, XCircle } from "lucide-react";

export const getStatusInfo = (session, t) => {
  const status = session.status || "active";

  if (status === "revoked" || !session.isActive) {
    return {
      label: t("loginHistory.revoked"),
      color: "text-gray-600 bg-gray-100",
      icon: <Ban className="w-4 h-4" />,
    };
  }
  if (status === "expired") {
    return {
      label: t("loginHistory.expired"),
      color: "text-red-600 bg-red-100",
      icon: <XCircle className="w-4 h-4" />,
    };
  }
  return {
    label: t("loginHistory.active"),
    color: "text-green-600 bg-green-100",
    icon: <CheckCircle className="w-4 h-4" />,
  };
};

export const getDeviceIcon = (deviceName) => {
  if (!deviceName) return <Monitor className="w-4 h-4" />;
  const lower = deviceName.toLowerCase();
  if (
    lower.includes("mobile") ||
    lower.includes("android") ||
    lower.includes("iphone")
  ) {
    return <Smartphone className="w-4 h-4" />;
  }
  return <Monitor className="w-4 h-4" />;
};

export const truncateDevice = (name) => {
  if (!name) return "Unknown";
  return name.length > 50 ? `${name.substring(0, 50)}...` : name;
};

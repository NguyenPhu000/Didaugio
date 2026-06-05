/**
 * RetryQueueBanner - Hiển thị trạng thái offline queue trong app
 */

import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { useRetryQueueStore, getQueueStatus } from "./RetryQueue";

export const RetryQueueBanner = () => {
  const [status, setStatus] = useState(getQueueStatus());
  const [isExpanded, setIsExpanded] = useState(false);
  const { init, processQueue } = useRetryQueueStore();

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(getQueueStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Don't show if nothing pending and online
  if (status.isOnline && status.totalCount === 0) {
    return null;
  }

  // Show offline banner
  if (!status.isOnline) {
    return (
      <View className="bg-slate-500 flex-row items-center justify-center py-2.5 px-4 gap-2">
        <MaterialIconsRounded name="wifi-off" size={18} color="#FFFFFF" />
        <Text className="text-white text-[13px] font-medium">
          Đang offline - Thao tác sẽ được đồng bộ khi có mạng
        </Text>
      </View>
    );
  }

  // Show pending actions indicator
  if (status.pendingCount > 0 || status.isProcessing) {
    return (
      <View className="bg-blue-500">
        <TouchableOpacity
          className="flex-row items-center justify-between py-2.5 px-4"
          onPress={() => setIsExpanded(!isExpanded)}
          activeOpacity={0.8}
        >
          <View className="flex-row items-center gap-2">
            {status.isProcessing ? (
              <MaterialIconsRounded name="sync" size={18} color="#FFFFFF" />
            ) : (
              <MaterialIconsRounded
                name="cloud-upload"
                size={18}
                color="#FFFFFF"
              />
            )}
            <Text className="text-white text-[13px] font-medium">
              {status.isProcessing
                ? "Đang đồng bộ..."
                : `${status.pendingCount} thao tác đang chờ đồng bộ`}
            </Text>
          </View>
          <MaterialIconsRounded
            name={isExpanded ? "expand-less" : "expand-more"}
            size={20}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        {isExpanded && status.totalCount > 0 && (
          <View className="bg-blue-600 px-4 pb-3 gap-1.5">
            {status.pendingCount > 0 && (
              <View className="flex-row items-center gap-1.5">
                <MaterialIconsRounded
                  name="schedule"
                  size={14}
                  color="#FFFFFF"
                />
                <Text className="text-white text-xs">
                  {status.pendingCount} đang chờ
                </Text>
              </View>
            )}
            {status.processingCount > 0 && (
              <View className="flex-row items-center gap-1.5">
                <MaterialIconsRounded name="sync" size={14} color="#FFFFFF" />
                <Text className="text-white text-xs">
                  {status.processingCount} đang xử lý
                </Text>
              </View>
            )}
            {status.failedCount > 0 && (
              <View className="flex-row items-center gap-1.5">
                <MaterialIconsRounded
                  name="error-outline"
                  size={14}
                  color="#FFB74D"
                />
                <Text className="text-amber-400 text-xs">
                  {status.failedCount} thất bại
                </Text>
              </View>
            )}
            {status.lastSyncTime && (
              <Text className="text-white/70 text-[11px] mt-1">
                Đồng bộ lần cuối:{" "}
                {new Date(status.lastSyncTime).toLocaleString("vi-VN")}
              </Text>
            )}
            {!status.isProcessing && status.pendingCount > 0 && (
              <TouchableOpacity
                className="flex-row items-center justify-center gap-1.5 bg-white/20 py-2 px-4 rounded-lg mt-2"
                onPress={() => processQueue()}
              >
                <MaterialIconsRounded
                  name="refresh"
                  size={14}
                  color="#FFFFFF"
                />
                <Text className="text-white text-[13px] font-semibold">
                  Đồng bộ ngay
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  }

  return null;
};

export default RetryQueueBanner;

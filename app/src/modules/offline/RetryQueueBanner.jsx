/**
 * RetryQueueBanner - Hiển thị trạng thái offline queue trong app
 */

import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
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
      <View style={styles.offlineBanner}>
        <MaterialIcons name="wifi-off" size={18} color="#FFFFFF" />
        <Text style={styles.offlineText}>
          Đang offline - Thao tác sẽ được đồng bộ khi có mạng
        </Text>
      </View>
    );
  }

  // Show pending actions indicator
  if (status.pendingCount > 0 || status.isProcessing) {
    return (
      <View style={styles.pendingBanner}>
        <TouchableOpacity
          style={styles.pendingContent}
          onPress={() => setIsExpanded(!isExpanded)}
          activeOpacity={0.8}
        >
          <View style={styles.pendingLeft}>
            {status.isProcessing ? (
              <MaterialIcons name="sync" size={18} color="#FFFFFF" />
            ) : (
              <MaterialIcons name="cloud-upload" size={18} color="#FFFFFF" />
            )}
            <Text style={styles.pendingText}>
              {status.isProcessing
                ? "Đang đồng bộ..."
                : `${status.pendingCount} thao tác đang chờ đồng bộ`}
            </Text>
          </View>
          <MaterialIcons
            name={isExpanded ? "expand-less" : "expand-more"}
            size={20}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        {isExpanded && status.totalCount > 0 && (
          <View style={styles.expandedContent}>
            {status.pendingCount > 0 && (
              <View style={styles.statusRow}>
                <MaterialIcons name="schedule" size={14} color="#FFFFFF" />
                <Text style={styles.statusText}>
                  {status.pendingCount} đang chờ
                </Text>
              </View>
            )}
            {status.processingCount > 0 && (
              <View style={styles.statusRow}>
                <MaterialIcons name="sync" size={14} color="#FFFFFF" />
                <Text style={styles.statusText}>
                  {status.processingCount} đang xử lý
                </Text>
              </View>
            )}
            {status.failedCount > 0 && (
              <View style={styles.statusRow}>
                <MaterialIcons name="error-outline" size={14} color="#FFB74D" />
                <Text style={[styles.statusText, { color: "#FFB74D" }]}>
                  {status.failedCount} thất bại
                </Text>
              </View>
            )}
            {status.lastSyncTime && (
              <Text style={styles.lastSync}>
                Đồng bộ lần cuối: {new Date(status.lastSyncTime).toLocaleString("vi-VN")}
              </Text>
            )}
            {!status.isProcessing && status.pendingCount > 0 && (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => processQueue()}
              >
                <MaterialIcons name="refresh" size={14} color="#FFFFFF" />
                <Text style={styles.retryText}>Đồng bộ ngay</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  offlineBanner: {
    backgroundColor: "#6B7280",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  offlineText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "500",
  },
  pendingBanner: {
    backgroundColor: "#3B82F6",
  },
  pendingContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  pendingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pendingText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "500",
  },
  expandedContent: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 6,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
  },
  lastSync: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    marginTop: 4,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
});

export default RetryQueueBanner;

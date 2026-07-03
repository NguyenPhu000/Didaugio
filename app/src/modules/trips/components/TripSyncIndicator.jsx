import React, { memo, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import safeAsyncStorage from "../../../utils/safeAsyncStorage";
import { useNetworkStatus } from "../hooks/useTripsOffline";

const PENDING_KEY = "@pending_trip_actions";

async function getPendingCount() {
  try {
    const raw = await safeAsyncStorage.getItem(PENDING_KEY);
    if (!raw) return 0;
    const actions = JSON.parse(raw);
    return Array.isArray(actions) ? actions.length : 0;
  } catch {
    return 0;
  }
}

export const TripSyncIndicator = memo(function TripSyncIndicator() {
  const { t } = useTranslation();
  const { isConnected } = useNetworkStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [lastOnline, setLastOnline] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    const checkPending = async () => {
      const count = await getPendingCount();
      setPendingCount(count);
      if (count > 0 && !isConnected) {
        setLastOnline(new Date());
      }
    };

    checkPending();
    intervalRef.current = setInterval(checkPending, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isConnected]);

  if (pendingCount === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        {isConnected ? (
          <>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.text}>{t("trip.sync.syncing", { count: pendingCount })}</Text>
          </>
        ) : (
          <>
            <MaterialIconsRounded name="cloud-off" size={16} color="#FF9F0A" />
            <Text style={styles.text}>
              {t("trip.sync.pendingOffline", { count: pendingCount })}
              {lastOnline ? ` (offline)` : ""}
            </Text>
          </>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.04)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  text: {
    fontSize: 13,
    color: "rgba(0,0,0,0.55)",
    fontFamily: "System",
  },
});

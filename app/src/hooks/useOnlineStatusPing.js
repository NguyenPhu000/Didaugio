import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useAuthStore } from "../stores/authStore";
import client from "../api/client";
import { ENDPOINTS } from "../api/endpoints";

const PING_INTERVAL = 45 * 1000; // 45 giay

export const useOnlineStatusPing = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!accessToken) return;

    const sendPing = async () => {
      try {
        await client.post(ENDPOINTS.auth.ping);
      } catch (err) {
        // Silent error to prevent console clutter
      }
    };

    // Ping ngay lap tuc khi mount hoac khi dang nhap thanh cong
    sendPing();

    let intervalId = setInterval(sendPing, PING_INTERVAL);

    const handleAppStateChange = (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // App quay lai trang thai active -> ping ngay lap tuc va thiet lap lai interval
        sendPing();
        clearInterval(intervalId);
        intervalId = setInterval(sendPing, PING_INTERVAL);
      } else if (nextAppState.match(/inactive|background/)) {
        // App di vao background -> clear interval de dung ping
        clearInterval(intervalId);
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      clearInterval(intervalId);
      subscription.remove();
    };
  }, [accessToken]);
};

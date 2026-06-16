import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { authService } from "@/apis/authService";

const PING_INTERVAL = 45 * 1000; // 45 giay

export default function OnlineStatusPing() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Ping ngay lap tuc khi bat dau
    const sendPing = async () => {
      try {
        await authService.ping();
      } catch (err) {
        // Silent error to prevent console clutter
      }
    };

    sendPing();

    // Chay dinh ky moi 45 giay
    const interval = setInterval(sendPing, PING_INTERVAL);

    // Gui ping ngay lap tuc khi nguoi dung focus lai tab
    const handleFocus = () => {
      sendPing();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [isAuthenticated]);

  return null;
}

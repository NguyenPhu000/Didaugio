import { useEffect, useState } from "react";
import api from "@/constants/api";
import { useAuthStore } from "@/stores/authStore";

/**
 * Hook to manage Web Push subscription.
 * - Requests notification permission
 * - Registers Service Worker
 * - Subscribes to push & saves to backend
 */
export const useWebPush = () => {
  const [permission, setPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const user = useAuthStore((state) => state.user);
  const userId = user?.userId || user?.id;

  useEffect(() => {
    if (!userId) return;
    // Auto-register SW and check existing subscription
    registerAndCheck();
  }, [userId]);

  const registerAndCheck = async () => {
    try {
      const reg = await navigator.serviceWorker?.register("/sw.js");
      if (!reg) return;

      const sub = await reg.pushManager.getSubscription();
      if (sub) setIsSubscribed(true);
    } catch (err) {
      console.warn("[WebPush] SW registration failed:", err.message);
    }
  };

  const requestPermissionAndSubscribe = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      console.warn("[WebPush] Browser không hỗ trợ Web Push");
      return;
    }

    // Request permission
    const result = await Notification.requestPermission();
    setPermission(result);

    if (result !== "granted") return;

    try {
      // Register SW
      const reg = await navigator.serviceWorker.register("/sw.js");

      // Get VAPID public key from backend
      const res = await api.get("/notifications/vapid-key");
      const publicKey = res?.data?.publicKey || res?.publicKey;

      if (!publicKey) {
        console.error("[WebPush] Không lấy được VAPID key");
        return;
      }

      // Subscribe
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // Save to backend
      await api.post("/notifications/subscribe", sub.toJSON());
      setIsSubscribed(true);
    } catch (err) {
      console.error("[WebPush] Subscribe failed:", err.message);
    }
  };

  const unsubscribe = async () => {
    try {
      const reg = await navigator.serviceWorker?.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await api.delete("/notifications/subscribe");
      }
      setIsSubscribed(false);
    } catch (err) {
      console.error("[WebPush] Unsubscribe failed:", err.message);
    }
  };

  return { permission, isSubscribed, requestPermissionAndSubscribe, unsubscribe };
};

/**
 * Convert VAPID base64 to Uint8Array (required by pushManager.subscribe)
 */
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

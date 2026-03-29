import { useState, useEffect, useRef } from "react";
import { useUIStore } from "../stores/uiStore";

let NetInfo = null;
try {
  NetInfo = require("@react-native-community/netinfo").default;
} catch {
  // Package chưa install — offline detection sẽ bị disable
}

export function useOffline() {
  const [isOffline, setIsOffline] = useState(false);
  const [isSlowConn, setIsSlowConn] = useState(false);
  const prevOffline = useRef(false);
  const addToast = useUIStore((s) => s.addToast);

  useEffect(() => {
    if (!NetInfo) return;

    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = !state.isConnected || !state.isInternetReachable;
      const slow =
        state.type === "cellular" &&
        (state.details?.cellularGeneration === "2g" ||
          state.details?.cellularGeneration === "3g");

      if (offline !== prevOffline.current) {
        if (!offline && prevOffline.current) {
          addToast({ id: "reconnected", type: "success", message: "Đã kết nối lại ✓" });
          setTimeout(() => {}, 3000);
        }
        prevOffline.current = offline;
        setIsOffline(offline);
      }
      setIsSlowConn(slow);
    });

    return unsubscribe;
  }, [addToast]);

  return { isOffline, isSlowConn };
}

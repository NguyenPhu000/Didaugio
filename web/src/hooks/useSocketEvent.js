import { useEffect, useRef } from "react";
import { connectSocket } from "@/utils/socket";

/**
 * Listen to a Socket.IO event. Auto-connects if needed, auto-cleans up on unmount.
 *
 * @param {string} event - Event name to listen for
 * @param {Function} handler - Callback invoked with event data
 *
 * @example
 * useSocketEvent("admin:online-count", (data) => {
 *   setOnlineCount(data.count);
 * });
 */
export function useSocketEvent(event, handler) {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    // Ensure socket is connected (idempotent — won't reconnect if already connected)
    const socket = connectSocket();
    if (!socket) return;

    const listener = (...args) => handlerRef.current(...args);
    socket.on(event, listener);

    return () => {
      socket.off(event, listener);
    };
  }, [event]);
}

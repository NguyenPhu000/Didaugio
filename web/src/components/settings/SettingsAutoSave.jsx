import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const SAVE_STATUS = {
  IDLE: "idle",
  SAVING: "saving",
  SAVED: "saved",
};

const DEFAULT_DEBOUNCE_MS = 1500;

const SettingsAutoSave = ({
  data,
  onSave,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  enabled = true,
  children,
}) => {
  const [status, setStatus] = useState(SAVE_STATUS.IDLE);
  const timeoutRef = useRef(null);
  const prevDataRef = useRef(null);
  const mountedRef = useRef(false);

  const performSave = useCallback(
    async (currentData) => {
      setStatus(SAVE_STATUS.SAVING);
      try {
        await onSave(currentData);
        setStatus(SAVE_STATUS.SAVED);
        prevDataRef.current = JSON.stringify(currentData);
      } catch {
        setStatus(SAVE_STATUS.IDLE);
      }
    },
    [onSave]
  );

  useEffect(() => {
    if (!enabled) return;

    if (!mountedRef.current) {
      mountedRef.current = true;
      prevDataRef.current = JSON.stringify(data);
      return;
    }

    const currentJson = JSON.stringify(data);
    if (currentJson === prevDataRef.current) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setStatus(SAVE_STATUS.IDLE);

    timeoutRef.current = setTimeout(() => {
      performSave(data);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [data, debounceMs, enabled, performSave]);

  useEffect(() => {
    if (status === SAVE_STATUS.SAVED) {
      const timer = setTimeout(() => setStatus(SAVE_STATUS.IDLE), 2000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  return (
    <div className="relative">
      {children}
      <div
        className={cn(
          "fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2 border font-mono text-xs uppercase tracking-wider transition-all duration-300",
          status === SAVE_STATUS.IDLE && "opacity-0 pointer-events-none",
          status === SAVE_STATUS.SAVING &&
            "bg-white border-blue-300 text-blue-600 opacity-100",
          status === SAVE_STATUS.SAVED &&
            "bg-green-50 border-green-300 text-green-600 opacity-100"
        )}
      >
        {status === SAVE_STATUS.SAVING && (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Đang lưu...</span>
          </>
        )}
        {status === SAVE_STATUS.SAVED && (
          <>
            <Check className="h-3.5 w-3.5" />
            <span>Đã lưu</span>
          </>
        )}
      </div>
    </div>
  );
};

export default SettingsAutoSave;
